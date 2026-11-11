const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Worker = require('../models/Worker');

// Haversine distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/admin/analytics - Comprehensive dashboard statistics
router.get('/analytics', async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'PENDING' });
    const inProgress = await Complaint.countDocuments({ status: 'IN_PROGRESS' });
    const resolved = await Complaint.countDocuments({ status: 'RESOLVED' });
    const highPriority = await Complaint.countDocuments({ severity: 'HIGH' });

    // Category breakdown
    const categoryAgg = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const categories = {};
    categoryAgg.forEach((item) => {
      categories[item._id || 'Unclassified'] = item.count;
    });

    // Severity breakdown
    const severityAgg = await Complaint.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const severities = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    severityAgg.forEach((item) => {
      if (item._id) severities[item._id] = item.count;
    });

    // Status breakdown
    const statusAgg = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statuses = {};
    statusAgg.forEach((item) => {
      statuses[item._id] = item.count;
    });

    // Resolution rate
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Worker workload
    const workers = await Worker.find().select('name department activeTasksCount completedTasksCount status');

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        highPriority,
        resolutionRate,
      },
      categories,
      severities,
      statuses,
      workers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/hotspots - Standout Feature 1: Smart Waste Hotspot Detection
router.get('/hotspots', async (req, res) => {
  try {
    const complaints = await Complaint.find({
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null },
    }).lean();

    // Spatial clustering within 400m
    const clusters = [];
    const visited = new Set();
    const CLUSTER_RADIUS_M = 400;

    complaints.forEach((comp, idx) => {
      if (visited.has(idx)) return;

      const clusterComplaints = [comp];
      visited.add(idx);

      complaints.forEach((other, oIdx) => {
        if (visited.has(oIdx)) return;
        const dist = getDistanceMeters(
          comp.location.latitude,
          comp.location.longitude,
          other.location.latitude,
          other.location.longitude
        );
        if (dist <= CLUSTER_RADIUS_M) {
          clusterComplaints.push(other);
          visited.add(oIdx);
        }
      });

      // Calculate centroid and metrics
      let sumLat = 0;
      let sumLon = 0;
      let sumPriority = 0;
      const catCount = {};

      clusterComplaints.forEach((c) => {
        sumLat += c.location.latitude;
        sumLon += c.location.longitude;
        sumPriority += c.priorityScore || 50;
        catCount[c.category] = (catCount[c.category] || 0) + 1;
      });

      const avgLat = sumLat / clusterComplaints.length;
      const avgLon = sumLon / clusterComplaints.length;
      const avgPriority = Math.round(sumPriority / clusterComplaints.length);
      const dominantCategory = Object.keys(catCount).reduce((a, b) => (catCount[a] > catCount[b] ? a : b), 'Garbage');

      const isCritical = clusterComplaints.length >= 3 || avgPriority >= 70;
      const urgencyTier = clusterComplaints.length >= 4 ? 'CRITICAL_HOTSPOT' : (clusterComplaints.length >= 2 ? 'RECURRENT_ZONE' : 'MONITORED_AREA');

      clusters.push({
        id: `hotspot-${clusters.length + 1}`,
        centroid: { latitude: avgLat, longitude: avgLon },
        radiusMeters: CLUSTER_RADIUS_M,
        complaintCount: clusterComplaints.length,
        avgPriorityScore: avgPriority,
        dominantCategory,
        urgencyTier,
        isCritical,
        addressArea: clusterComplaints[0].location.address || `Area near ${avgLat.toFixed(4)}, ${avgLon.toFixed(4)}`,
        complaints: clusterComplaints.map((c) => ({
          id: c._id,
          category: c.category,
          severity: c.severity,
          status: c.status,
          description: c.description,
          image: c.image,
        })),
      });
    });

    // Sort by complaint count and priority
    clusters.sort((a, b) => b.complaintCount * b.avgPriorityScore - a.complaintCount * a.avgPriorityScore);

    res.json({
      success: true,
      totalHotspots: clusters.length,
      hotspots: clusters,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/route-optimize - Standout Feature 2: Smart Waste Collection Route
router.get('/route-optimize', async (req, res) => {
  try {
    // Select pending complaints that require waste collection
    const pendingStops = await Complaint.find({
      status: 'PENDING',
      category: { $in: ['Garbage', 'Overflowing Bin', 'Illegal Dumping'] },
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null },
    }).lean();

    if (pendingStops.length === 0) {
      return res.json({
        success: true,
        message: 'No pending garbage complaints to collect at this moment!',
        route: [],
        totalDistanceKm: 0,
        estimatedTimeMinutes: 0,
      });
    }

    // Starting depot (e.g., Central Municipal Sanitation Yard)
    const depot = {
      name: 'Municipal Central Sanitation Depot',
      latitude: pendingStops[0].location.latitude + 0.005,
      longitude: pendingStops[0].location.longitude - 0.005,
      isDepot: true,
    };

    // Greedy Nearest Neighbor Route Optimization
    const unvisited = [...pendingStops];
    let currentPoint = depot;
    const orderedWaypoints = [depot];
    let totalMeters = 0;

    while (unvisited.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = getDistanceMeters(
          currentPoint.latitude,
          currentPoint.longitude,
          unvisited[i].location.latitude,
          unvisited[i].location.longitude
        );
        // Prioritize HIGH severity by weighting down effective distance
        const weight = unvisited[i].severity === 'HIGH' ? 0.75 : 1.0;
        const weightedDist = d * weight;

        if (weightedDist < minDistance) {
          minDistance = weightedDist;
          nearestIdx = i;
        }
      }

      const nextStop = unvisited.splice(nearestIdx, 1)[0];
      const actualDist = getDistanceMeters(
        currentPoint.latitude,
        currentPoint.longitude,
        nextStop.location.latitude,
        nextStop.location.longitude
      );

      totalMeters += actualDist;
      currentPoint = {
        id: nextStop._id,
        name: nextStop.location.address || `${nextStop.category} Site`,
        category: nextStop.category,
        severity: nextStop.severity,
        priorityScore: nextStop.priorityScore,
        latitude: nextStop.location.latitude,
        longitude: nextStop.location.longitude,
        image: nextStop.image,
        description: nextStop.description,
        legDistanceMeters: Math.round(actualDist),
      };
      orderedWaypoints.push(currentPoint);
    }

    // Return leg to depot
    const returnDist = getDistanceMeters(
      currentPoint.latitude,
      currentPoint.longitude,
      depot.latitude,
      depot.longitude
    );
    totalMeters += returnDist;
    orderedWaypoints.push({ ...depot, name: 'Municipal Central Depot (Return)', legDistanceMeters: Math.round(returnDist) });

    const totalDistanceKm = Number((totalMeters / 1000).toFixed(2));
    // Assume average collection truck speed 25 km/h + 10 mins per pickup stop
    const estimatedTimeMinutes = Math.round((totalDistanceKm / 25) * 60 + (pendingStops.length * 10));

    res.json({
      success: true,
      depot,
      stopsCount: pendingStops.length,
      totalDistanceKm,
      estimatedTimeMinutes,
      fuelEstimatedLiters: Number((totalDistanceKm * 0.28).toFixed(1)),
      optimizedRoute: orderedWaypoints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

