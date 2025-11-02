const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'healthnexus-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate file for error logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log')
    })
  ],
  
  // Handle unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log')
    })
  ]
});

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        responseTimeTotal: 0
      },
      routes: new Map(),
      errors: new Map(),
      healthChecks: []
    };
    
    this.startTime = Date.now();
  }

  // Record request metrics
  recordRequest(req, res, responseTime) {
    this.metrics.requests.total++;
    this.metrics.requests.responseTimeTotal += responseTime;
    
    if (res.statusCode >= 400) {
      this.metrics.requests.errors++;
    } else {
      this.metrics.requests.success++;
    }

    // Track by route
    const route = `${req.method} ${req.route?.path || req.path}`;
    if (!this.metrics.routes.has(route)) {
      this.metrics.routes.set(route, {
        count: 0,
        avgResponseTime: 0,
        errors: 0,
        totalResponseTime: 0
      });
    }
    
    const routeMetrics = this.metrics.routes.get(route);
    routeMetrics.count++;
    routeMetrics.totalResponseTime += responseTime;
    routeMetrics.avgResponseTime = routeMetrics.totalResponseTime / routeMetrics.count;
    
    if (res.statusCode >= 400) {
      routeMetrics.errors++;
    }
  }

  // Record error
  recordError(error, context = {}) {
    const errorKey = error.name || 'UnknownError';
    if (!this.metrics.errors.has(errorKey)) {
      this.metrics.errors.set(errorKey, {
        count: 0,
        lastOccurred: null,
        contexts: []
      });
    }
    
    const errorMetrics = this.metrics.errors.get(errorKey);
    errorMetrics.count++;
    errorMetrics.lastOccurred = new Date();
    errorMetrics.contexts.push({
      ...context,
      timestamp: new Date(),
      message: error.message,
      stack: error.stack
    });
    
    // Keep only last 10 contexts
    if (errorMetrics.contexts.length > 10) {
      errorMetrics.contexts.shift();
    }
  }

  // Get current metrics
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.requests.total > 0 
      ? this.metrics.requests.responseTimeTotal / this.metrics.requests.total 
      : 0;

    return {
      uptime,
      requests: {
        ...this.metrics.requests,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        successRate: this.metrics.requests.total > 0 
          ? Math.round((this.metrics.requests.success / this.metrics.requests.total) * 100) 
          : 0
      },
      routes: Object.fromEntries(
        Array.from(this.metrics.routes.entries()).map(([route, metrics]) => [
          route,
          {
            ...metrics,
            avgResponseTime: Math.round(metrics.avgResponseTime * 100) / 100,
            errorRate: metrics.count > 0 ? Math.round((metrics.errors / metrics.count) * 100) : 0
          }
        ])
      ),
      errors: Object.fromEntries(this.metrics.errors.entries()),
      memory: process.memoryUsage(),
      healthChecks: this.metrics.healthChecks.slice(-10) // Last 10 health checks
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        responseTimeTotal: 0
      },
      routes: new Map(),
      errors: new Map(),
      healthChecks: this.metrics.healthChecks
    };
    this.startTime = Date.now();
  }

  // Add health check result
  addHealthCheck(result) {
    this.metrics.healthChecks.push({
      timestamp: new Date(),
      ...result
    });
    
    // Keep only last 50 health checks
    if (this.metrics.healthChecks.length > 50) {
      this.metrics.healthChecks.shift();
    }
  }
}

const performanceMonitor = new PerformanceMonitor();

// Health check utilities
class HealthChecker {
  constructor() {
    this.checks = new Map();
  }

  // Register a health check
  register(name, checkFunction, options = {}) {
    this.checks.set(name, {
      check: checkFunction,
      timeout: options.timeout || 5000,
      interval: options.interval || 30000,
      critical: options.critical || false,
      lastResult: null,
      lastCheck: null
    });
  }

  // Run a single health check
  async runCheck(name) {
    const checkConfig = this.checks.get(name);
    if (!checkConfig) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();
    let result;

    try {
      // Run check with timeout
      const checkPromise = checkConfig.check();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), checkConfig.timeout);
      });

      const checkResult = await Promise.race([checkPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      result = {
        name,
        status: 'healthy',
        duration,
        timestamp: new Date(),
        details: checkResult || {}
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      result = {
        name,
        status: 'unhealthy',
        duration,
        timestamp: new Date(),
        error: error.message,
        critical: checkConfig.critical
      };
    }

    checkConfig.lastResult = result;
    checkConfig.lastCheck = new Date();

    return result;
  }

  // Run all health checks
  async runAllChecks() {
    const results = [];
    const promises = Array.from(this.checks.keys()).map(name => 
      this.runCheck(name).catch(error => ({
        name,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      }))
    );

    const checkResults = await Promise.all(promises);
    
    // Determine overall health
    const criticalFailures = checkResults.filter(r => 
      r.status !== 'healthy' && this.checks.get(r.name)?.critical
    );
    
    const overallStatus = criticalFailures.length > 0 ? 'unhealthy' : 'healthy';
    
    const summary = {
      status: overallStatus,
      timestamp: new Date(),
      checks: checkResults,
      summary: {
        total: checkResults.length,
        healthy: checkResults.filter(r => r.status === 'healthy').length,
        unhealthy: checkResults.filter(r => r.status === 'unhealthy').length,
        failed: checkResults.filter(r => r.status === 'failed').length
      }
    };

    // Log health check results
    logger.info('Health check completed', summary);
    performanceMonitor.addHealthCheck(summary);

    return summary;
  }

  // Get last results
  getLastResults() {
    return Array.from(this.checks.entries()).map(([name, config]) => ({
      name,
      lastResult: config.lastResult,
      lastCheck: config.lastCheck
    }));
  }
}

const healthChecker = new HealthChecker();

// Register default health checks
const registerDefaultHealthChecks = () => {
  // Database health check
  healthChecker.register('database', async () => {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    await mongoose.connection.db.admin().ping();
    return { status: 'connected', readyState: mongoose.connection.readyState };
  }, { critical: true, timeout: 3000 });

  // Redis health check
  healthChecker.register('redis', async () => {
    const cacheService = require('./cache');
    const isHealthy = await cacheService.healthCheck();
    
    if (!isHealthy) {
      throw new Error('Redis health check failed');
    }
    
    return { status: 'connected' };
  }, { critical: false, timeout: 2000 });

  // Memory health check
  healthChecker.register('memory', async () => {
    const memUsage = process.memoryUsage();
    const memLimit = 1024 * 1024 * 1024; // 1GB limit
    
    if (memUsage.heapUsed > memLimit) {
      throw new Error(`Memory usage too high: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }
    
    return {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    };
  }, { critical: false });

  // Disk space health check
  healthChecker.register('disk', async () => {
    const fs = require('fs').promises;
    const stats = await fs.stat(process.cwd());
    
    // This is a simplified check; in production, you'd want to check actual disk usage
    return { status: 'ok' };
  }, { critical: false });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.id
    });

    // Record performance metrics
    performanceMonitor.recordRequest(req, res, responseTime);

    originalEnd.apply(this, args);
  };

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  // Log error
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Record error metrics
  performanceMonitor.recordError(error, {
    method: req.method,
    url: req.url,
    userId: req.user?.id
  });

  next(error);
};

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Close server
  if (global.server) {
    global.server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connection
      const mongoose = require('mongoose');
      mongoose.connection.close(() => {
        logger.info('Database connection closed');
        
        // Close Redis connection
        const cacheService = require('./cache');
        if (cacheService.client) {
          cacheService.client.quit(() => {
            logger.info('Redis connection closed');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });
  } else {
    process.exit(0);
  }
  
  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  performanceMonitor.recordError(error, { type: 'uncaughtException' });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  performanceMonitor.recordError(new Error(reason), { type: 'unhandledRejection' });
});

module.exports = {
  logger,
  performanceMonitor,
  healthChecker,
  registerDefaultHealthChecks,
  requestLogger,
  errorLogger,
  gracefulShutdown
};