const express = require('express');
const Stripe = require('stripe');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (stripeSecret) {
  stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
}

// POST /api/v1/payments/create-intent
router.post(
  '/create-intent',
  [
    body('amount').optional().isInt({ min: 50 }).withMessage('Amount must be in smallest currency unit'),
    body('currency').optional().isString(),
    body('service').isObject().withMessage('Service info required'),
    body('service.id').exists().withMessage('service.id required'),
    body('service.price').isNumeric().withMessage('service.price required'),
  ],
  async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ success: false, message: 'Stripe not configured' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { amount, currency = 'inr', service, metadata = {} } = req.body;
      const finalAmount = amount || Math.max(50, Math.round(Number(service.price) * 100));

      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          serviceId: service.id,
          serviceTitle: service.title || '',
          ...metadata,
        },
      });

      return res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to create payment intent' });
    }
  }
);

// GET /api/v1/payments/intent/:id
router.get('/intent/:id', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ success: false, message: 'Stripe not configured' });
    }
    const pi = await stripe.paymentIntents.retrieve(req.params.id);
    return res.status(200).json({ success: true, status: pi.status, amount: pi.amount, currency: pi.currency });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve intent' });
  }
});

module.exports = router;