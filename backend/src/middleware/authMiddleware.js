const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route - User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - Invalid token'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.userType}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user owns the resource or is authorized to access it
const checkOwnership = (Model, resourceField = 'user') => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Allow if user owns the resource
      if (resource[resourceField] && resource[resourceField].toString() === req.user._id.toString()) {
        return next();
      }

      // Allow providers to access their own provider profile
      if (Model.modelName === 'Provider' && resource.user.toString() === req.user._id.toString()) {
        return next();
      }

      // Allow patients to access their own patient profile
      if (Model.modelName === 'Patient' && resource.user.toString() === req.user._id.toString()) {
        return next();
      }

      // Allow healthcare providers (nurses and doctors) to access patient data for appointments
      if (['nurse', 'doctor'].includes(req.user.userType) && Model.modelName === 'Patient') {
        return next();
      }

      // Allow patients to view provider profiles for booking appointments
      if (req.user.userType === 'patient' && Model.modelName === 'Provider' && req.method === 'GET') {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    } catch (error) {
      next(error);
    }
  };
};

// Check if user can access appointment data
const checkAppointmentAccess = async (req, res, next) => {
  try {
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findById(req.params.id).populate('patient provider');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the patient or the provider for this appointment
    const isPatient = appointment.patient.user.toString() === req.user._id.toString();
    const isProvider = appointment.provider.user.toString() === req.user._id.toString();

    if (!isPatient && !isProvider) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment'
      });
    }

    req.appointment = appointment;
    next();
  } catch (error) {
    next(error);
  }
};

// Verify user is verified (for sensitive operations)
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your account to access this feature'
    });
  }
  next();
};

// Rate limit per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request history
    let userHistory = userRequests.get(userId) || [];
    
    // Remove old requests outside the window
    userHistory = userHistory.filter(timestamp => timestamp > windowStart);
    
    // Check if user has exceeded the limit
    if (userHistory.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this user, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000 / 60)
      });
    }

    // Add current request
    userHistory.push(now);
    userRequests.set(userId, userHistory);

    next();
  };
};

module.exports = {
  protect,
  authorize,
  checkOwnership,
  checkAppointmentAccess,
  requireVerification,
  userRateLimit
};