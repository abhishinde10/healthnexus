const Redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connect();
  }

  async connect() {
    try {
      this.client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected || !this.client) return null;
      
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, expiration = 3600) {
    try {
      if (!this.isConnected || !this.client) return false;
      
      await this.client.setEx(key, expiration, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected || !this.client) return false;
      
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected || !this.client) return false;
      
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async flush() {
    try {
      if (!this.isConnected || !this.client) return false;
      
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  async keys(pattern) {
    try {
      if (!this.isConnected || !this.client) return [];
      
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  // Cache patterns for different data types
  generateKey(type, identifier, params = {}) {
    const paramStr = Object.keys(params).length > 0 
      ? ':' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
      : '';
    
    return `${process.env.NODE_ENV || 'development'}:${type}:${identifier}${paramStr}`;
  }

  // Specific cache methods
  async cacheServiceList(filters, data, expiration = 300) {
    const key = this.generateKey('services', 'list', filters);
    return await this.set(key, data, expiration);
  }

  async getCachedServiceList(filters) {
    const key = this.generateKey('services', 'list', filters);
    return await this.get(key);
  }

  async cacheUserProfile(userId, data, expiration = 1800) {
    const key = this.generateKey('user', userId);
    return await this.set(key, data, expiration);
  }

  async getCachedUserProfile(userId) {
    const key = this.generateKey('user', userId);
    return await this.get(key);
  }

  async invalidateUserCache(userId) {
    const pattern = this.generateKey('user', userId) + '*';
    const keys = await this.keys(pattern);
    
    if (keys.length > 0) {
      for (const key of keys) {
        await this.del(key);
      }
    }
  }

  async cacheAppointments(userId, data, expiration = 600) {
    const key = this.generateKey('appointments', userId);
    return await this.set(key, data, expiration);
  }

  async getCachedAppointments(userId) {
    const key = this.generateKey('appointments', userId);
    return await this.get(key);
  }

  async invalidateAppointmentCache(userId) {
    const key = this.generateKey('appointments', userId);
    await this.del(key);
  }

  // Session management
  async storeSession(sessionId, data, expiration = 86400) { // 24 hours
    const key = this.generateKey('session', sessionId);
    return await this.set(key, data, expiration);
  }

  async getSession(sessionId) {
    const key = this.generateKey('session', sessionId);
    return await this.get(key);
  }

  async deleteSession(sessionId) {
    const key = this.generateKey('session', sessionId);
    return await this.del(key);
  }

  // Rate limiting support
  async incrementRateLimit(identifier, window = 3600) {
    try {
      if (!this.isConnected || !this.client) return 1;
      
      const key = this.generateKey('ratelimit', identifier);
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, window);
      }
      
      return current;
    } catch (error) {
      console.error('Rate limit increment error:', error);
      return 1;
    }
  }

  async getRateLimitCount(identifier) {
    const key = this.generateKey('ratelimit', identifier);
    const count = await this.get(key);
    return count || 0;
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected || !this.client) return false;
      
      const testKey = 'health:check';
      await this.set(testKey, { timestamp: Date.now() }, 10);
      const result = await this.get(testKey);
      await this.del(testKey);
      
      return !!result;
    } catch (error) {
      console.error('Cache health check error:', error);
      return false;
    }
  }
}

const cacheService = new CacheService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (cacheService.client) {
    await cacheService.client.quit();
  }
});

process.on('SIGINT', async () => {
  if (cacheService.client) {
    await cacheService.client.quit();
  }
});

module.exports = cacheService;