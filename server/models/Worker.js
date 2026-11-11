const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    default: '+91 98765 43210',
  },
  department: {
    type: String,
    enum: ['Sanitation', 'Roads & Infrastructure', 'Water Supply & Drainage', 'Solid Waste Management'],
    default: 'Sanitation',
  },
  status: {
    type: String,
    enum: ['Available', 'On Task', 'Off Duty'],
    default: 'Available',
  },
  activeTasksCount: {
    type: Number,
    default: 0,
  },
  completedTasksCount: {
    type: Number,
    default: 0,
  },
  assignedComplaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Worker', workerSchema);

