const express = require('express');
const {
  getServices,
  getService,
  getCategories,
  bookService
} = require('../controllers/serviceController');

const { protect } = require('../middleware/authMiddleware');
const { 
  serviceListCache, 
  invalidateServiceCache,
  rateLimitMiddleware
} = require('../middleware/cache');

const router = express.Router();

// Public routes with caching and rate limiting
router.get('/', 
  rateLimitMiddleware({ maxRequests: 100, windowMs: 15 * 60 * 1000 }),
  serviceListCache,
  getServices
);
router.get('/categories', 
  rateLimitMiddleware({ maxRequests: 50, windowMs: 15 * 60 * 1000 }),
  getCategories
);
router.get('/:id', 
  rateLimitMiddleware({ maxRequests: 50, windowMs: 15 * 60 * 1000 }),
  getService
);

// Protected routes with cache invalidation
router.post('/:id/book', 
  protect, 
  rateLimitMiddleware({ maxRequests: 10, windowMs: 15 * 60 * 1000 }),
  invalidateServiceCache,
  bookService
);

module.exports = router;