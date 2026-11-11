const express = require('express');
const router = express.Router();
const mlClient = require('../services/mlClient');

// POST /api/ai/assistant - AI Civic Assistant
router.post('/assistant', async (req, res) => {
  try {
    const { query, userContext } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query string is required' });
    }

    const response = await mlClient.askAssistant(query, userContext);
    res.json({
      success: true,
      query,
      reply: response.reply,
      suggestions: response.suggestions || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

