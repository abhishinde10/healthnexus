require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const connectDB = require('./src/config/database');
const { 
  logger, 
  registerDefaultHealthChecks, 
  requestLogger, 
  errorLogger 
} = require('./src/utils/monitoring');
const dbOptimizer = require('./src/utils/dbOptimization');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const providerRoutes = require('./src/routes/providerRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const monitoringRoutes = require('./src/routes/monitoring');
const contactRoutes = require('./src/routes/contactRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

// Import middleware
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');
const { protect } = require('./src/middleware/authMiddleware');

const app = express();

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Enable compression for production
app.use(compression());

// Request logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(requestLogger);
}

// Connect to database and setup optimizations
connectDB().then(async () => {
  // Initialize database optimizations
  await dbOptimizer.createIndexes();
  
  // Register health checks
  registerDefaultHealthChecks();
  
  logger.info('Database connected and optimized');
}).catch(err => {
  logger.error('Database connection failed:', err);
  process.exit(1);
});

// Trust proxy (important for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60) || 15
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// More restrictive rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001'
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'HealthNexus API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Monitoring and health routes
app.use('/api/v1/health', monitoringRoutes);

// Public routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/contact`, contactRoutes);
app.use(`/api/${apiVersion}/payments`, paymentRoutes);

// API routes
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/services`, serviceRoutes);
app.use(`/api/${apiVersion}/patients`, protect, patientRoutes);
app.use(`/api/${apiVersion}/providers`, protect, providerRoutes);
app.use(`/api/${apiVersion}/appointments`, protect, appointmentRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to HealthNexus API',
    version: apiVersion,
    documentation: '/api/docs',
    endpoints: {
      auth: `/api/${apiVersion}/auth`,
      services: `/api/${apiVersion}/services`,
      patients: `/api/${apiVersion}/patients`,
      providers: `/api/${apiVersion}/providers`,
      appointments: `/api/${apiVersion}/appointments`
    },
    health: '/health'
  });
});

// Catch 404 and forward to error handler
app.use(notFound);

// Error logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(errorLogger);
}

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  const startupMessage = `
🏥 HealthNexus Backend Server Started
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🚀 Server running on port ${PORT}
📡 API endpoints: http://localhost:${PORT}/api
💓 Health check: http://localhost:${PORT}/health
📊 Monitoring: http://localhost:${PORT}/api/v1/health
📚 API docs: http://localhost:${PORT}/api
  `;
  
  console.log(startupMessage);
  logger.info('Server started successfully', { port: PORT, environment: process.env.NODE_ENV });
});

// Store server reference globally for graceful shutdown
global.server = server;

module.exports = { app, server };