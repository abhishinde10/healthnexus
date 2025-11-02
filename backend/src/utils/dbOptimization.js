const mongoose = require('mongoose');

class DatabaseOptimizer {
  constructor() {
    this.indexCreated = false;
  }

  // Get existing index key patterns for a collection
  async getExistingIndexKeys(collection) {
    try {
      const indexes = await collection.indexes();
      // Normalize to key JSON strings for easy comparison
      return indexes.map(idx => JSON.stringify(idx.key));
    } catch (e) {
      console.error('Failed to fetch existing indexes:', e?.message || e);
      return [];
    }
  }

  // Safely create index: skip if equivalent/conflicting index already exists
  async tryCreateIndex(collection, spec, options = {}) {
    try {
      await collection.createIndex(spec, options);
    } catch (error) {
      const msg = error?.message || '';
      const name = options?.name || JSON.stringify(spec);
      // 85: IndexOptionsConflict; also handle generic "already exists" messages
      if (error?.code === 85 || error?.codeName === 'IndexOptionsConflict' || /already exists/i.test(msg)) {
        console.log(`ℹ️  Skipping index creation for ${name}: index exists or conflicts with different options`);
      } else {
        throw error;
      }
    }
  }

  // Create optimal indexes for better query performance
  async createIndexes() {
    try {
      if (this.indexCreated) return;

      console.log('Creating database indexes...');

      // Service indexes
      const ServiceModel = mongoose.model('Service');
      const serviceExisting = await this.getExistingIndexKeys(ServiceModel.collection);

      // Compound index for common service queries (not defined on schema)
      const svcCategoryActiveRating = JSON.stringify({ category: 1, isActive: 1, 'rating.average': -1 });
      if (!serviceExisting.includes(svcCategoryActiveRating)) {
        await this.tryCreateIndex(ServiceModel.collection, { category: 1, isActive: 1, 'rating.average': -1 }, { name: 'service_category_active_rating' });
      }

      // Text index for search functionality - schema already defines; skip explicit create
      // Price + active compound index
      const svcPriceActive = JSON.stringify({ price: 1, isActive: 1 });
      if (!serviceExisting.includes(svcPriceActive)) {
        await this.tryCreateIndex(ServiceModel.collection, { price: 1, isActive: 1 }, { name: 'service_price_active' });
      }

      // Popular services compound index
      const svcPopularActiveCreated = JSON.stringify({ isPopular: 1, isActive: 1, createdAt: -1 });
      if (!serviceExisting.includes(svcPopularActiveCreated)) {
        await this.tryCreateIndex(ServiceModel.collection, { isPopular: 1, isActive: 1, createdAt: -1 }, { name: 'service_popular_active_created' });
      }

      // User indexes
      const UserModel = mongoose.model('User');
      const userExisting = await this.getExistingIndexKeys(UserModel.collection);

      // Email unique handled by schema; skip duplicate creation

      // Phone index
      const userPhone = JSON.stringify({ 'profile.phone': 1 });
      if (!userExisting.includes(userPhone)) {
        await this.tryCreateIndex(UserModel.collection, { 'profile.phone': 1 }, { name: 'user_phone', sparse: true });
      }

      // User status and role compound (userType in schema)
      const userActiveType = JSON.stringify({ isActive: 1, userType: 1 });
      if (!userExisting.includes(userActiveType)) {
        await this.tryCreateIndex(UserModel.collection, { isActive: 1, userType: 1 }, { name: 'user_active_userType' });
      }

      // Review indexes
      const ReviewModel = mongoose.model('Review');
      const reviewExisting = await this.getExistingIndexKeys(ReviewModel.collection);

      // Service reviews compound index
      const reviewServiceRatingCreated = JSON.stringify({ service: 1, rating: -1, createdAt: -1 });
      if (!reviewExisting.includes(reviewServiceRatingCreated)) {
        await this.tryCreateIndex(ReviewModel.collection, { service: 1, rating: -1, createdAt: -1 }, { name: 'review_service_rating_created' });
      }

      // User reviews compound index
      const reviewUserCreated = JSON.stringify({ user: 1, createdAt: -1 });
      if (!reviewExisting.includes(reviewUserCreated)) {
        await this.tryCreateIndex(ReviewModel.collection, { user: 1, createdAt: -1 }, { name: 'review_user_created' });
      }

      // Appointment indexes (if model exists)
      try {
        const AppointmentModel = mongoose.model('Appointment');
        
        const apptExisting = await this.getExistingIndexKeys(AppointmentModel.collection);

        // User appointments (if your Appointment model had a user field)
        const apptUser = JSON.stringify({ user: 1, scheduledDate: -1, status: 1 });
        if (!apptExisting.includes(apptUser)) {
          await this.tryCreateIndex(AppointmentModel.collection, { user: 1, scheduledDate: -1, status: 1 }, { name: 'appointment_user_date_status' });
        }

        // Provider appointments compound
        const apptProvider = JSON.stringify({ provider: 1, scheduledDate: 1, status: 1 });
        if (!apptExisting.includes(apptProvider)) {
          await this.tryCreateIndex(AppointmentModel.collection, { provider: 1, scheduledDate: 1, status: 1 }, { name: 'appointment_provider_date_status' });
        }

        // Service appointments compound (if applicable)
        const apptService = JSON.stringify({ service: 1, status: 1, scheduledDate: -1 });
        if (!apptExisting.includes(apptService)) {
          await this.tryCreateIndex(AppointmentModel.collection, { service: 1, status: 1, scheduledDate: -1 }, { name: 'appointment_service_status_date' });
        }

      } catch (error) {
        console.log('Appointment model not found, skipping appointment indexes');
      }

      this.indexCreated = true;
      console.log('✅ Database indexes created successfully');
      
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
    }
  }

  // Analyze query performance
  async analyzeQuery(model, query, options = {}) {
    try {
      const explain = await model.find(query, null, options).explain('executionStats');
      
      return {
        indexUsed: explain.executionStats.indexesUsed,
        executionTime: explain.executionStats.executionTimeMillis,
        documentsScanned: explain.executionStats.docsExamined,
        documentsReturned: explain.executionStats.docsReturned,
        efficiency: explain.executionStats.docsReturned / explain.executionStats.docsExamined,
        queryPlanner: explain.queryPlanner
      };
    } catch (error) {
      console.error('Query analysis error:', error);
      return null;
    }
  }

  // Get collection statistics
  async getCollectionStats() {
    try {
      const db = mongoose.connection.db;
      const collections = ['services', 'users', 'reviews'];
      const stats = {};

      for (const collectionName of collections) {
        try {
          const collStats = await db.collection(collectionName).stats();
          stats[collectionName] = {
            count: collStats.count,
            size: collStats.size,
            avgObjSize: collStats.avgObjSize,
            indexSizes: collStats.indexSizes,
            totalIndexSize: collStats.totalIndexSize
          };
        } catch (error) {
          console.log(`Collection ${collectionName} not found`);
        }
      }

      return stats;
    } catch (error) {
      console.error('Collection stats error:', error);
      return {};
    }
  }

  // Database health check
  async healthCheck() {
    try {
      const start = Date.now();
      
      // Test basic connectivity
      await mongoose.connection.db.admin().ping();
      const pingTime = Date.now() - start;

      // Get database stats
      const dbStats = await mongoose.connection.db.stats();
      
      // Check connection pool
      const connectionStats = {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      };

      return {
        status: 'healthy',
        pingTime,
        database: {
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize,
          objects: dbStats.objects
        },
        connection: connectionStats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Clean up old data
  async cleanup(options = {}) {
    try {
      const {
        daysToKeep = 90,
        batchSize = 1000
      } = options;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let cleanupStats = {
        reviewsDeleted: 0,
        sessionsCleared: 0
      };

      // Clean up old review drafts or temporary data
      try {
        const ReviewModel = mongoose.model('Review');
        const result = await ReviewModel.deleteMany({
          status: 'draft',
          createdAt: { $lt: cutoffDate }
        });
        cleanupStats.reviewsDeleted = result.deletedCount;
      } catch (error) {
        console.log('No reviews to clean up');
      }

      // Clean up expired sessions (if implemented)
      try {
        const SessionModel = mongoose.model('Session');
        const result = await SessionModel.deleteMany({
          expiresAt: { $lt: new Date() }
        });
        cleanupStats.sessionsCleared = result.deletedCount;
      } catch (error) {
        console.log('No sessions to clean up');
      }

      return cleanupStats;
    } catch (error) {
      console.error('Database cleanup error:', error);
      return { error: error.message };
    }
  }

  // Optimize database by running maintenance commands
  async optimize() {
    try {
      const db = mongoose.connection.db;
      const collections = ['services', 'users', 'reviews'];
      const results = {};

      for (const collectionName of collections) {
        try {
          // Compact collection (MongoDB specific)
          if (db.collection(collectionName)) {
            await db.command({ compact: collectionName });
            results[collectionName] = 'compacted';
          }
        } catch (error) {
          results[collectionName] = `error: ${error.message}`;
        }
      }

      return results;
    } catch (error) {
      console.error('Database optimization error:', error);
      return { error: error.message };
    }
  }

  // Monitor slow queries
  async enableSlowQueryLogging(thresholdMs = 1000) {
    try {
      // Enable slow query logging
      mongoose.set('debug', (collectionName, method, query, doc, options) => {
        const start = Date.now();
        
        return function(err, result) {
          const duration = Date.now() - start;
          
          if (duration > thresholdMs) {
            console.log(`🐌 Slow Query Detected:`, {
              collection: collectionName,
              method,
              query,
              duration: `${duration}ms`,
              timestamp: new Date().toISOString()
            });
          }
        };
      });

      console.log(`✅ Slow query logging enabled (threshold: ${thresholdMs}ms)`);
    } catch (error) {
      console.error('Error enabling slow query logging:', error);
    }
  }

  // Aggregation pipeline helpers
  buildServiceAggregation(filters = {}) {
    const pipeline = [];

    // Match stage
    const matchStage = { isActive: true };
    if (filters.category) matchStage.category = filters.category;
    if (filters.minPrice || filters.maxPrice) {
      matchStage.price = {};
      if (filters.minPrice) matchStage.price.$gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) matchStage.price.$lte = parseFloat(filters.maxPrice);
    }
    if (filters.rating) matchStage['rating.average'] = { $gte: parseFloat(filters.rating) };
    if (filters.popular) matchStage.isPopular = true;

    pipeline.push({ $match: matchStage });

    // Add text search if needed
    if (filters.search) {
      pipeline.unshift({
        $match: {
          $text: { $search: filters.search }
        }
      });
      pipeline.push({
        $addFields: {
          searchScore: { $meta: 'textScore' }
        }
      });
    }

    // Lookup providers
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'providers',
        foreignField: '_id',
        as: 'providerDetails',
        pipeline: [
          { $project: { firstName: 1, lastName: 1, 'profile.specializations': 1, rating: 1 } }
        ]
      }
    });

    // Sort stage
    const sortStage = {};
    if (filters.search) {
      sortStage.searchScore = { $meta: 'textScore' };
    }
    
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    sortStage[sortBy] = sortOrder;
    
    pipeline.push({ $sort: sortStage });

    return pipeline;
  }
}

const dbOptimizer = new DatabaseOptimizer();

module.exports = dbOptimizer;