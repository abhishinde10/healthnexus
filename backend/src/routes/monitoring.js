const express = require('express');
const router = express.Router();
const { 
  healthChecker, 
  performanceMonitor,
  logger 
} = require('../utils/monitoring');
const { getCacheStats } = require('../middleware/cache');
const dbOptimizer = require('../utils/dbOptimization');
const cacheService = require('../utils/cache');

// @desc    Get health status
// @route   GET /api/v1/health
// @access  Public
router.get('/', async (req, res) => {
  try {
    const healthStatus = await healthChecker.runAllChecks();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// @desc    Get detailed health status (admin only)
// @route   GET /api/v1/health/detailed
// @access  Private/Admin
router.get('/detailed', async (req, res) => {
  try {
    const [
      healthStatus,
      performanceMetrics,
      cacheStats,
      dbStats
    ] = await Promise.all([
      healthChecker.runAllChecks(),
      performanceMonitor.getMetrics(),
      getCacheStats(),
      dbOptimizer.getCollectionStats()
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      health: healthStatus,
      performance: performanceMetrics,
      cache: cacheStats,
      database: dbStats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Detailed health check failed',
      error: error.message
    });
  }
});

// @desc    Get performance metrics
// @route   GET /api/v1/health/metrics
// @access  Private/Admin
router.get('/metrics', (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    res.json({
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get metrics',
      error: error.message
    });
  }
});

// @desc    Reset performance metrics
// @route   POST /api/v1/health/metrics/reset
// @access  Private/Admin
router.post('/metrics/reset', (req, res) => {
  try {
    performanceMonitor.reset();
    logger.info('Performance metrics reset');
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to reset metrics', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset metrics',
      error: error.message
    });
  }
});

// @desc    Get database statistics
// @route   GET /api/v1/health/database
// @access  Private/Admin
router.get('/database', async (req, res) => {
  try {
    const [dbHealth, collectionStats] = await Promise.all([
      dbOptimizer.healthCheck(),
      dbOptimizer.getCollectionStats()
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      health: dbHealth,
      collections: collectionStats
    });
  } catch (error) {
    logger.error('Failed to get database stats', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get database statistics',
      error: error.message
    });
  }
});

// @desc    Run database optimization
// @route   POST /api/v1/health/database/optimize
// @access  Private/Admin
router.post('/database/optimize', async (req, res) => {
  try {
    logger.info('Starting database optimization');
    
    const optimizationResult = await dbOptimizer.optimize();
    
    logger.info('Database optimization completed', optimizationResult);
    
    res.json({
      success: true,
      message: 'Database optimization completed',
      results: optimizationResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database optimization failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Database optimization failed',
      error: error.message
    });
  }
});

// @desc    Clean up old data
// @route   POST /api/v1/health/database/cleanup
// @access  Private/Admin
router.post('/database/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    
    logger.info('Starting database cleanup', { daysToKeep });
    
    const cleanupResult = await dbOptimizer.cleanup({ daysToKeep });
    
    logger.info('Database cleanup completed', cleanupResult);
    
    res.json({
      success: true,
      message: 'Database cleanup completed',
      results: cleanupResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database cleanup failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Database cleanup failed',
      error: error.message
    });
  }
});

// @desc    Get cache statistics
// @route   GET /api/v1/health/cache
// @access  Private/Admin
router.get('/cache', async (req, res) => {
  try {
    const cacheStats = await getCacheStats();
    const cacheHealth = await cacheService.healthCheck();
    
    res.json({
      timestamp: new Date().toISOString(),
      health: cacheHealth,
      statistics: cacheStats
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
});

// @desc    Clear cache
// @route   POST /api/v1/health/cache/clear
// @access  Private/Admin
router.post('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    let result;
    if (pattern) {
      // Clear specific pattern
      const keys = await cacheService.keys(pattern);
      let deletedCount = 0;
      
      for (const key of keys) {
        await cacheService.del(key);
        deletedCount++;
      }
      
      result = { deletedKeys: deletedCount, pattern };
      logger.info('Cache pattern cleared', result);
    } else {
      // Clear all cache
      await cacheService.flush();
      result = { message: 'All cache cleared' };
      logger.info('All cache cleared');
    }
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to clear cache', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

// @desc    Get server information
// @route   GET /api/v1/health/info
// @access  Private/Admin
router.get('/info', (req, res) => {
  try {
    const info = {
      service: 'HealthNexus Backend API',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      startTime: new Date(Date.now() - process.uptime() * 1000),
      timestamp: new Date().toISOString(),
      pid: process.pid,
      features: {
        caching: true,
        monitoring: true,
        healthChecks: true,
        authentication: true,
        rateLimit: true
      },
      endpoints: {
        health: '/api/v1/health',
        metrics: '/api/v1/health/metrics',
        docs: '/api/v1/docs'
      }
    };
    
    res.json(info);
  } catch (error) {
    logger.error('Failed to get server info', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get server information',
      error: error.message
    });
  }
});

// @desc    Test endpoint for monitoring
// @route   GET /api/v1/health/test
// @access  Public
router.get('/test', (req, res) => {
  const { delay, status } = req.query;
  
  const responseDelay = parseInt(delay) || 0;
  const responseStatus = parseInt(status) || 200;
  
  setTimeout(() => {
    res.status(responseStatus).json({
      success: true,
      message: 'Test endpoint response',
      delay: responseDelay,
      status: responseStatus,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  }, responseDelay);
});

// @desc    Get logs (last N entries)
// @route   GET /api/v1/health/logs
// @access  Private/Admin
router.get('/logs', async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    const fs = require('fs').promises;
    const path = require('path');
    
    const logFile = level === 'error' ? 'error.log' : 'app.log';
    const logPath = path.join(process.cwd(), 'logs', logFile);
    
    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      const lines = logContent.trim().split('\n').slice(-parseInt(limit));
      
      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { raw: line, timestamp: new Date().toISOString() };
        }
      });
      
      res.json({
        success: true,
        level,
        count: logs.length,
        logs
      });
    } catch (fileError) {
      res.json({
        success: true,
        message: 'No log file found or empty',
        level,
        count: 0,
        logs: []
      });
    }
  } catch (error) {
    logger.error('Failed to get logs', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve logs',
      error: error.message
    });
  }
});

module.exports = router;