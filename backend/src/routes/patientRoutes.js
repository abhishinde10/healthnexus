const express = require('express');
const { authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Placeholder patient routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Patient routes - Coming soon',
    routes: {
      'GET /': 'Get all patients (for providers)',
      'GET /profile': 'Get patient profile',
      'PUT /profile': 'Update patient profile',
      'GET /medical-history': 'Get medical history',
      'POST /medical-history': 'Add medical history',
      'GET /appointments': 'Get patient appointments',
      'POST /symptom-triage': 'Submit symptom triage'
    }
  });
});

// Get patient profile
router.get('/profile', authorize('patient'), (req, res) => {
  res.json({
    success: true,
    message: 'Get patient profile endpoint - Coming soon'
  });
});

// Update patient profile
router.put('/profile', authorize('patient'), (req, res) => {
  res.json({
    success: true,
    message: 'Update patient profile endpoint - Coming soon'
  });
});

module.exports = router;