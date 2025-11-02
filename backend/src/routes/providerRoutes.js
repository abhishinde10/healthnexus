const express = require('express');
const { authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Placeholder provider routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Provider routes - Coming soon',
    routes: {
      'GET /': 'Get all providers',
      'GET /profile': 'Get provider profile',
      'PUT /profile': 'Update provider profile',
      'GET /available': 'Get available providers',
      'PUT /availability': 'Update availability',
      'GET /schedule': 'Get provider schedule',
      'GET /stats': 'Get provider statistics'
    }
  });
});

// Get provider profile
router.get('/profile', authorize('nurse', 'doctor'), (req, res) => {
  res.json({
    success: true,
    message: 'Get provider profile endpoint - Coming soon'
  });
});

// Update provider profile
router.put('/profile', authorize('nurse', 'doctor'), (req, res) => {
  res.json({
    success: true,
    message: 'Update provider profile endpoint - Coming soon'
  });
});

module.exports = router;