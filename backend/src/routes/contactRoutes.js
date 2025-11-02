const express = require('express');
const { body, validationResult } = require('express-validator');
const ContactMessage = require('../models/ContactMessage');
const { logger } = require('../utils/monitoring');

const router = express.Router();

// POST /api/v1/contact - create a contact message
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').optional().trim(),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { name, email, subject, message } = req.body;
      const doc = await ContactMessage.create({ name, email, subject, message });
      logger.info('Contact message created', { id: doc._id, email });
      return res.status(201).json({ success: true, message: 'Message received', data: { id: doc._id } });
    } catch (error) {
      logger.error('Failed to create contact message', { error: error.message });
      return res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  }
);

module.exports = router;
