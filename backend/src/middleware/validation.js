const Joi = require('joi');
const ErrorResponse = require('../utils/errorResponse');

// Validation schemas
const schemas = {
  // User registration validation
  register: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.pattern.base': 'First name should only contain letters and spaces',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot be more than 50 characters long'
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Last name should only contain letters and spaces',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot be more than 50 characters long'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'Password must be at least 8 characters long'
      }),
    role: Joi.string()
      .valid('patient', 'provider', 'admin')
      .default('patient'),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      })
  }),

  // User login validation
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Update profile validation
  updateProfile: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional(),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    dateOfBirth: Joi.date()
      .max('now')
      .optional(),
    gender: Joi.string()
      .valid('male', 'female', 'other', 'prefer-not-to-say')
      .optional(),
    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(100).optional()
    }).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().max(100).optional(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
      relationship: Joi.string().max(50).optional()
    }).optional(),
    language: Joi.string()
      .valid('en', 'hi', 'es', 'fr')
      .optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      push: Joi.boolean().optional()
    }).optional()
  }),

  // Password update validation
  updatePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'New password must be at least 8 characters long'
      })
  }),

  // Forgot password validation
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      })
  }),

  // Reset password validation
  resetPassword: Joi.object({
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'Password must be at least 8 characters long'
      })
  }),

  // Service booking validation
  bookService: Joi.object({
    appointmentDate: Joi.date()
      .min('now')
      .required()
      .messages({
        'date.min': 'Appointment date cannot be in the past'
      }),
    appointmentTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid time in HH:MM format'
      }),
    address: Joi.object({
      street: Joi.string().max(200).required(),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      zipCode: Joi.string().max(20).required(),
      country: Joi.string().max(100).optional()
    }).required(),
    notes: Joi.string()
      .max(500)
      .optional(),
    preferredProvider: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid provider ID format'
      })
  }),

  // Review validation
  createReview: Joi.object({
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot be more than 5'
      }),
    title: Joi.string()
      .min(5)
      .max(100)
      .required()
      .messages({
        'string.min': 'Review title must be at least 5 characters long',
        'string.max': 'Review title cannot be more than 100 characters long'
      }),
    comment: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Review comment must be at least 10 characters long',
        'string.max': 'Review comment cannot be more than 500 characters long'
      })
  }),

  // Query parameters validation
  getServices: Joi.object({
    category: Joi.string()
      .valid('consultation', 'nursing', 'laboratory', 'physiotherapy', 'mental-health', 'vaccination', 'emergency')
      .optional(),
    search: Joi.string()
      .max(100)
      .optional(),
    minPrice: Joi.number()
      .min(0)
      .optional(),
    maxPrice: Joi.number()
      .min(0)
      .optional(),
    rating: Joi.number()
      .min(1)
      .max(5)
      .optional(),
    popular: Joi.string()
      .valid('true', 'false')
      .optional(),
    page: Joi.number()
      .integer()
      .min(1)
      .optional(),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional(),
    sortBy: Joi.string()
      .valid('createdAt', 'price', 'rating.average', 'title')
      .optional(),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .optional()
  }).options({ allowUnknown: true })
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schemas[schema].validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return next(new ErrorResponse(`Validation Error: ${errors.map(e => e.message).join(', ')}`, 400));
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
};

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;

    if (!objectIdPattern.test(id)) {
      return next(new ErrorResponse(`Invalid ${paramName} format`, 400));
    }

    next();
  };
};

// File upload validation
const validateFileUpload = (options = {}) => {
  return (req, res, next) => {
    if (!req.file && options.required) {
      return next(new ErrorResponse('File is required', 400));
    }

    if (req.file) {
      // Validate file type
      if (options.allowedTypes && !options.allowedTypes.includes(req.file.mimetype)) {
        return next(new ErrorResponse(`File type ${req.file.mimetype} is not allowed`, 400));
      }

      // Validate file size
      if (options.maxSize && req.file.size > options.maxSize) {
        return next(new ErrorResponse(`File size exceeds ${options.maxSize} bytes`, 400));
      }
    }

    next();
  };
};

// Sanitize input to prevent XSS
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

module.exports = {
  validate,
  validateObjectId,
  validateFileUpload,
  sanitizeInput,
  schemas
};