const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  citizenName: {
    type: String,
    default: 'Anonymous Citizen',
  },
  citizenEmail: {
    type: String,
    default: '',
  },
  citizenPhone: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      default: '',
    },
    locationType: {
      type: String,
      default: 'residential',
    },
  },
  // ML predictions
  category: {
    type: String,
    enum: ['Garbage', 'Overflowing Bin', 'Pothole', 'Water Leakage', 'Illegal Dumping', 'Clean Area'],
    default: 'Garbage',
  },
  confidence: {
    type: Number,
    default: 0.90,
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  },
  priorityScore: {
    type: Number,
    default: 50,
  },
  // Status and assignment
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
    default: 'PENDING',
  },
  assignedTo: {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    workerName: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
  },
  // Resolution details with Before/After verification
  resolution: {
    afterImage: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    cleanlinessScore: {
      type: Number,
      default: null,
    },
    debrisReductionPct: {
      type: Number,
      default: null,
    },
    verificationFeedback: {
      type: String,
      default: '',
    },
  },
  // Duplicate detection flags
  isDuplicate: {
    type: Boolean,
    default: false,
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
  },
  duplicateReason: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Complaint', complaintSchema);

