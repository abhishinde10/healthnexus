const cacheService = require('../utils/cache');

// Cache middleware factory
const cacheMiddleware = (options = {}) => {
  const {
    keyGenerator,
    expiration = 300, // 5 minutes default
    condition = () => true,
    onHit = () => {},
    onMiss = () => {},
    skipCache = false
  } = options;

  return async (req, res, next) => {
    // Skip caching if disabled or condition not met
    if (skipCache || !condition(req)) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : generateDefaultKey(req);
      
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        onHit(req, cacheKey);
        
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `max-age=${expiration}`
        });
        
        return res.json({
          success: true,
          cached: true,
          timestamp: new Date().toISOString(),
          ...cachedData
        });
      }
      
      // Cache miss - store original res.json
      const originalJson = res.json;
      
      res.json = function(data) {
        // Only cache successful responses
        if (data && data.success !== false && res.statusCode < 400) {
          // Store in cache asynchronously
          cacheService.set(cacheKey, data, expiration).catch(err => {
            console.error('Cache set error:', err);
          });
        }
        
        onMiss(req, cacheKey);
        
        // Add cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `max-age=${expiration}`
        });
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

// Default key generator
const generateDefaultKey = (req) => {
  const { method, path, query, user } = req;
  const userId = user?.id || 'anonymous';
  const queryString = Object.keys(query).length > 0 
    ? JSON.stringify(query) 
    : '';
    
  return `${method}:${path}:${userId}:${Buffer.from(queryString).toString('base64')}`;
};

// Specific middleware for different routes
const serviceListCache = cacheMiddleware({
  keyGenerator: (req) => {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      location: req.query.location,
      priceRange: req.query.priceRange,
      rating: req.query.rating,
      sortBy: req.query.sortBy,
      page: req.query.page || 1,
      limit: req.query.limit || 10
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });
    
    return cacheService.generateKey('services', 'list', filters);
  },
  expiration: 300, // 5 minutes
  condition: (req) => req.method === 'GET',
  onHit: (req, key) => console.log(`Cache HIT for services: ${key}`),
  onMiss: (req, key) => console.log(`Cache MISS for services: ${key}`)
});

const userProfileCache = cacheMiddleware({
  keyGenerator: (req) => {
    const userId = req.user?.id || req.params.id;
    return cacheService.generateKey('user', userId);
  },
  expiration: 1800, // 30 minutes
  condition: (req) => req.method === 'GET' && req.user?.id,
  onHit: (req, key) => console.log(`Cache HIT for user profile: ${key}`),
  onMiss: (req, key) => console.log(`Cache MISS for user profile: ${key}`)
});

const appointmentCache = cacheMiddleware({
  keyGenerator: (req) => {
    const userId = req.user?.id;
    const filters = {
      status: req.query.status,
      date: req.query.date,
      serviceId: req.query.serviceId
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });
    
    return cacheService.generateKey('appointments', userId, filters);
  },
  expiration: 600, // 10 minutes
  condition: (req) => req.method === 'GET' && req.user?.id,
  onHit: (req, key) => console.log(`Cache HIT for appointments: ${key}`),
  onMiss: (req, key) => console.log(`Cache MISS for appointments: ${key}`)
});

// Cache invalidation middleware
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;
    
    const invalidatePatterns = async () => {
      try {
        if (Array.isArray(patterns)) {
          for (const pattern of patterns) {
            const keys = await cacheService.keys(pattern);
            for (const key of keys) {
              await cacheService.del(key);
            }
          }
        } else if (typeof patterns === 'function') {
          const patternsToInvalidate = patterns(req);
          for (const pattern of patternsToInvalidate) {
            const keys = await cacheService.keys(pattern);
            for (const key of keys) {
              await cacheService.del(key);
            }
          }
        } else {
          const keys = await cacheService.keys(patterns);
          for (const key of keys) {
            await cacheService.del(key);
          }
        }
      } catch (error) {
        console.error('Cache invalidation error:', error);
      }
    };
    
    // Override response methods to invalidate cache after successful operations
    res.json = function(data) {
      const result = originalJson.call(this, data);
      
      // Invalidate cache for successful operations
      if (data && data.success !== false && res.statusCode < 400) {
        invalidatePatterns();
      }
      
      return result;
    };
    
    res.send = function(data) {
      const result = originalSend.call(this, data);
      
      if (res.statusCode < 400) {
        invalidatePatterns();
      }
      
      return result;
    };
    
    res.end = function(data) {
      const result = originalEnd.call(this, data);
      
      if (res.statusCode < 400) {
        invalidatePatterns();
      }
      
      return result;
    };
    
    next();
  };
};

// Specific invalidation middleware
const invalidateServiceCache = invalidateCache([
  '*:services:*',
  '*:appointments:*' // Services affect appointments too
]);

const invalidateUserCache = (req) => {
  const userId = req.user?.id || req.params.id;
  return [
    `*:user:${userId}*`,
    `*:appointments:${userId}*`
  ];
};

const invalidateAppointmentCache = (req) => {
  const userId = req.user?.id;
  return [
    `*:appointments:${userId}*`,
    `*:user:${userId}*` // User stats might change
  ];
};

// Rate limiting with cache
const rateLimitMiddleware = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached = () => {}
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const windowSeconds = Math.floor(windowMs / 1000);
      
      const currentCount = await cacheService.incrementRateLimit(key, windowSeconds);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });
      
      if (currentCount > maxRequests) {
        onLimitReached(req, key);
        return res.status(429).json({
          success: false,
          message: 'Too many requests',
          retryAfter: windowMs
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continue on error
    }
  };
};

// Cache warming utilities
const warmCache = {
  async services() {
    try {
      // This would typically be called during app startup
      console.log('Warming service cache...');
      // Pre-populate common service queries
      // Implementation would depend on your specific needs
    } catch (error) {
      console.error('Service cache warming error:', error);
    }
  },

  async popularData() {
    try {
      console.log('Warming popular data cache...');
      // Pre-populate frequently accessed data
    } catch (error) {
      console.error('Popular data cache warming error:', error);
    }
  }
};

// Cache statistics
const getCacheStats = async () => {
  try {
    const keys = await cacheService.keys('*');
    const stats = {
      totalKeys: keys.length,
      keysByType: {},
      healthCheck: await cacheService.healthCheck()
    };
    
    // Analyze key patterns
    keys.forEach(key => {
      const parts = key.split(':');
      if (parts.length >= 2) {
        const type = parts[1];
        stats.keysByType[type] = (stats.keysByType[type] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Cache stats error:', error);
    return { error: error.message };
  }
};

module.exports = {
  cacheMiddleware,
  serviceListCache,
  userProfileCache,
  appointmentCache,
  invalidateCache,
  invalidateServiceCache,
  invalidateUserCache: invalidateCache(invalidateUserCache),
  invalidateAppointmentCache: invalidateCache(invalidateAppointmentCache),
  rateLimitMiddleware,
  warmCache,
  getCacheStats
};