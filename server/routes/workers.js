const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Complaint = require('../models/Complaint');

// GET /api/workers - List all municipal workers
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find().sort({ activeTasksCount: 1, name: 1 });
    res.json({ success: true, count: workers.length, workers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/workers - Create new worker
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, department = 'Sanitation' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const worker = new Worker({
      name,
      email,
      phone,
      department,
      status: 'Available',
    });

    await worker.save();
    res.status(201).json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/workers/:id/tasks - Get worker's assigned tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const tasks = await Complaint.find({ 'assignedTo.workerId': req.params.id })
      .sort({ priorityScore: -1, createdAt: -1 });

    res.json({ success: true, worker, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/workers/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const worker = await Worker.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

