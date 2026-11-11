const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Complaint = require('./models/Complaint');

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Complaint.deleteMany({});

    console.log('[Seed] Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const workerPass = await bcrypt.hash('worker123', salt);
    const citizenPass = await bcrypt.hash('citizen123', salt);

    const admin = await User.create({
      name: 'Municipal Commissioner Vikram Rao',
      email: 'admin@smartcivic.gov',
      password: adminPass,
      role: 'admin',
      phone: '+91 98111 22334',
      department: 'Central Municipal Authority',
    });

    const citizen1 = await User.create({
      name: 'Rahul Sharma',
      email: 'citizen@gmail.com',
      password: citizenPass,
      role: 'citizen',
      phone: '+91 98222 33445',
    });

    const citizen2 = await User.create({
      name: 'Pooja Iyer',
      email: 'pooja.iyer@gmail.com',
      password: citizenPass,
      role: 'citizen',
      phone: '+91 98333 44556',
    });

    console.log('[Seed] Seeding Workers...');
    const worker1 = await Worker.create({
      name: 'Ramesh Kumar',
      email: 'ramesh.kumar@smartcivic.gov',
      phone: '+91 98444 55667',
      department: 'Sanitation',
      status: 'On Task',
      activeTasksCount: 1,
      completedTasksCount: 42,
    });

    const worker2 = await Worker.create({
      name: 'Sunita Sharma',
      email: 'sunita.sharma@smartcivic.gov',
      phone: '+91 98555 66778',
      department: 'Solid Waste Management',
      status: 'Available',
      activeTasksCount: 0,
      completedTasksCount: 56,
    });

    const worker3 = await Worker.create({
      name: 'Amit Patel',
      email: 'amit.patel@smartcivic.gov',
      phone: '+91 98666 77889',
      department: 'Roads & Infrastructure',
      status: 'Available',
      activeTasksCount: 0,
      completedTasksCount: 38,
    });

    const worker4 = await Worker.create({
      name: 'Rajesh Singh',
      email: 'rajesh.singh@smartcivic.gov',
      phone: '+91 98777 88990',
      department: 'Water Supply & Drainage',
      status: 'Available',
      activeTasksCount: 0,
      completedTasksCount: 29,
    });

    // Also create User records for workers so they can log in via Worker Dashboard
    await User.create([
      {
        name: worker1.name,
        email: worker1.email,
        password: workerPass,
        role: 'worker',
        department: worker1.department,
        phone: worker1.phone,
      },
      {
        name: worker2.name,
        email: worker2.email,
        password: workerPass,
        role: 'worker',
        department: worker2.department,
        phone: worker2.phone,
      },
    ]);

    console.log('[Seed] Seeding Complaints...');
    // Real coordinates around Delhi / Smart Civic Metro area
    const complaints = [
      {
        userId: citizen1._id,
        citizenName: citizen1.name,
        citizenEmail: citizen1.email,
        citizenPhone: citizen1.phone,
        image: '/uploads/garbage_main_road.jpg',
        description: 'Large garbage accumulation on the main road outside Metro Gate 2. Severe stench affecting school children and commuters.',
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Connaught Circus, Outer Circle Near Gate 2, Central District',
          locationType: 'public',
        },
        category: 'Garbage',
        confidence: 0.96,
        severity: 'HIGH',
        priorityScore: 88,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000), // 3 hours ago
      },
      {
        userId: citizen2._id,
        citizenName: citizen2.name,
        citizenEmail: citizen2.email,
        citizenPhone: citizen2.phone,
        image: '/uploads/overflowing_bin_market.jpg',
        description: 'Public community dustbin completely overflowing beyond capacity. Street animals scattering waste around the market sidewalk.',
        location: {
          latitude: 28.6155,
          longitude: 77.2115,
          address: 'Sector 14 Central Market Main Walkway',
          locationType: 'commercial',
        },
        category: 'Overflowing Bin',
        confidence: 0.94,
        severity: 'MEDIUM',
        priorityScore: 68,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 6 * 3600 * 1000), // 6 hours ago
      },
      {
        userId: citizen1._id,
        citizenName: citizen1.name,
        citizenEmail: citizen1.email,
        citizenPhone: citizen1.phone,
        image: '/uploads/pothole_crater_ave.jpg',
        description: 'Dangerous deep pothole on arterial road right before the hospital flyover. Multiple two-wheeler riders skidded this morning.',
        location: {
          latitude: 28.6210,
          longitude: 77.2180,
          address: 'Hospital Flyover Approach Road, Sector 9',
          locationType: 'hospital',
        },
        category: 'Pothole',
        confidence: 0.95,
        severity: 'HIGH',
        priorityScore: 92,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 8 * 3600 * 1000),
      },
      {
        userId: citizen2._id,
        citizenName: citizen2.name,
        citizenEmail: citizen2.email,
        citizenPhone: citizen2.phone,
        image: '/uploads/water_leakage_pipe.jpg',
        description: 'Drinking water municipal pipeline ruptured underground. Heavy water accumulation and clean water wastage.',
        location: {
          latitude: 28.6285,
          longitude: 77.2060,
          address: 'Civil Lines Water Main Intersection Line 4',
          locationType: 'residential',
        },
        category: 'Water Leakage',
        confidence: 0.93,
        severity: 'HIGH',
        priorityScore: 84,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000),
      },
      {
        userId: citizen1._id,
        citizenName: citizen1.name,
        citizenEmail: citizen1.email,
        citizenPhone: citizen1.phone,
        image: '/uploads/illegal_dumping_lot.jpg',
        description: 'Construction debris and commercial waste illegally dumped overnight on the vacant corner plot.',
        location: {
          latitude: 28.6180,
          longitude: 77.2140,
          address: 'Industrial Plot 18-A, Ring Road Extension',
          locationType: 'commercial',
        },
        category: 'Illegal Dumping',
        confidence: 0.91,
        severity: 'HIGH',
        priorityScore: 82,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 18 * 3600 * 1000),
      },
      {
        userId: citizen2._id,
        citizenName: citizen2.name,
        citizenEmail: citizen2.email,
        citizenPhone: citizen2.phone,
        image: '/uploads/garbage_main_road.jpg',
        description: 'Waste accumulation near school boundary wall. Assigned to sanitation crew for expedited clearing.',
        location: {
          latitude: 28.6148,
          longitude: 77.2078,
          address: 'Bal Bharati School Service Lane, Central Ward',
          locationType: 'school',
        },
        category: 'Garbage',
        confidence: 0.95,
        severity: 'HIGH',
        priorityScore: 89,
        status: 'IN_PROGRESS',
        assignedTo: {
          workerId: worker1._id,
          workerName: worker1.name,
          department: worker1.department,
          assignedAt: new Date(Date.now() - 2 * 3600 * 1000),
        },
        createdAt: new Date(Date.now() - 20 * 3600 * 1000),
      },
      {
        userId: citizen1._id,
        citizenName: citizen1.name,
        citizenEmail: citizen1.email,
        citizenPhone: citizen1.phone,
        image: '/uploads/garbage_main_road.jpg',
        description: 'Recurrent garbage corner cleared and sanitized by municipal sanitation squad.',
        location: {
          latitude: 28.6120,
          longitude: 77.2105,
          address: 'Heritage Park Gate 1, Janpath Crossing',
          locationType: 'public',
        },
        category: 'Garbage',
        confidence: 0.96,
        severity: 'MEDIUM',
        priorityScore: 62,
        status: 'RESOLVED',
        assignedTo: {
          workerId: worker1._id,
          workerName: worker1.name,
          department: worker1.department,
          assignedAt: new Date(Date.now() - 26 * 3600 * 1000),
        },
        resolution: {
          afterImage: '/uploads/resolved_after_cleaning.jpg',
          notes: 'Full waste cleared, lime powder sprayed for sanitation, and waste transported to designated landfill.',
          resolvedAt: new Date(Date.now() - 4 * 3600 * 1000),
          isVerified: true,
          cleanlinessScore: 94,
          debrisReductionPct: 91.5,
          verificationFeedback: 'AI Vision & Supervisor verification approved. High surface cleanliness confirmed.',
        },
        createdAt: new Date(Date.now() - 30 * 3600 * 1000),
      },
    ];

    const insertedComplaints = await Complaint.insertMany(complaints);
    // Link assigned complaint to worker1
    worker1.assignedComplaints.push(insertedComplaints[5]._id);
    await worker1.save();

    console.log(`[Seed] Seeded ${insertedComplaints.length} complaints successfully!`);
    console.log('[Seed] Ready to launch SmartCivic!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedData();

