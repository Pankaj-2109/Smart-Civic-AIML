import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { adminAPI } from '../api/api';
import { AlertTriangle, Flame, MapPin, RefreshCw, Layers } from 'lucide-react';

const HotspotMap = ({ onSelectComplaint }) => {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circlesLayerRef = useRef(null);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getHotspots();
      if (res.data.success) {
        setHotspots(res.data.hotspots || []);
        if (res.data.hotspots.length > 0) {
          setSelectedHotspot(res.data.hotspots[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching hotspots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.6150, 77.2100],
      zoom: 13,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    circlesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circles when hotspots load
  useEffect(() => {
    if (!mapInstanceRef.current || !circlesLayerRef.current || hotspots.length === 0) return;

    circlesLayerRef.current.clearLayers();

    hotspots.forEach((hs) => {
      const color = hs.urgencyTier === 'CRITICAL_HOTSPOT' ? '#ef4444' : (hs.urgencyTier === 'RECURRENT_ZONE' ? '#f59e0b' : '#3b82f6');
      
      const circle = L.circle([hs.centroid.latitude, hs.centroid.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.35,
        radius: hs.radiusMeters || 350,
        weight: 2.5,
      });

      circle.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900 text-sm mb-1">🔥 ${hs.urgencyTier.replace('_', ' ')}</div>
          <p class="text-slate-600 mb-1"><strong>Complaints in cluster:</strong> ${hs.complaintCount}</p>
          <p class="text-slate-600 mb-1"><strong>Avg Priority:</strong> ${hs.avgPriorityScore}/100</p>
          <p class="text-slate-600 mb-1"><strong>Dominant Issue:</strong> ${hs.dominantCategory}</p>
          <p class="text-slate-400 text-[10px]">📍 ${hs.addressArea}</p>
        </div>
      `);

      circle.on('click', () => {
        setSelectedHotspot(hs);
      });

      circlesLayerRef.current.addLayer(circle);
    });

    if (hotspots[0]) {
      mapInstanceRef.current.setView([hotspots[0].centroid.latitude, hotspots[0].centroid.longitude], 14);
    }
  }, [hotspots]);

  const focusHotspot = (hs) => {
    setSelectedHotspot(hs);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hs.centroid.latitude, hs.centroid.longitude], 15, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 font-bold">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Smart Waste Hotspot Intelligence</h3>
              <p className="text-xs text-slate-500">Autonomous geospatial clustering detects recurring waste accumulation zones</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchHotspots}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Clusters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map View */}
        <div className="lg:col-span-2 h-[420px] rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
          <div ref={mapContainerRef} className="w-full h-full" />
          <div className="absolute bottom-3 left-3 z-[500] bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-medium text-slate-700 shadow-md border border-slate-200 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span>Critical Hotspot (3+ issues)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span>Recurrent Zone</span>
            </div>
          </div>
        </div>

        {/* Hotspots Sidebar List */}
        <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detected Hotspot Clusters ({hotspots.length})</h4>
          {hotspots.map((hs, i) => (
            <div
              key={hs.id}
              onClick={() => focusHotspot(hs)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                selectedHotspot?.id === hs.id
                  ? 'border-rose-400 bg-rose-50/50 shadow-sm ring-1 ring-rose-300'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  hs.urgencyTier === 'CRITICAL_HOTSPOT'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {hs.urgencyTier.replace('_', ' ')}
                </span>
                <span className="text-xs font-extrabold text-slate-700">
                  {hs.complaintCount} Reports
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">
                {hs.addressArea}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Top: <strong>{hs.dominantCategory}</strong></span>
                <span>Severity Score: <strong className="text-rose-600">{hs.avgPriorityScore}/100</strong></span>
              </div>
            </div>
          ))}

          {hotspots.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No waste clusters detected. City sectors are within normal cleanliness thresholds!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotspotMap;

