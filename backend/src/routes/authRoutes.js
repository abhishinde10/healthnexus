const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  refreshToken,
  verifyEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validationErrorHandler } = require('../middleware/errorMiddleware');

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('userType')
    .isIn(['patient', 'nurse', 'doctor'])
    .withMessage('User type must be patient, nurse, or doctor'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  // Patient-specific validations
  body('dateOfBirth')
    .if(body('userType').equals('patient'))
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .if(body('userType').equals('patient'))
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Gender must be male, female, other, or prefer-not-to-say'),
  body('emergencyContact.name')
    .if(body('userType').equals('patient'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name is required'),
  body('emergencyContact.phone')
    .if(body('userType').equals('patient'))
    .isMobilePhone()
    .withMessage('Emergency contact phone is required'),
  body('emergencyContact.relationship')
    .if(body('userType').equals('patient'))
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact relationship is required'),
  // Provider-specific validations
  body('licenseNumber')
    .if(body('userType').isIn(['nurse', 'doctor']))
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('License number is required for healthcare providers'),
  body('specialization')
    .if(body('userType').isIn(['nurse', 'doctor']))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization is required for healthcare providers'),
  (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    next();
  }
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('userType')
    .isIn(['patient', 'nurse', 'doctor'])
    .withMessage('User type must be patient, nurse, or doctor'),
  (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    next();
  }
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    next();
  }
];

const validateResetPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    next();
  }
];

const validateUpdatePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(validationErrorHandler(errors));
    }
    next();
  }
];

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.patch('/reset-password/:token', validateResetPassword, resetPassword);
router.patch('/verify-email/:token', verifyEmail);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect); // All routes after this are protected
router.get('/me', getMe);
router.post('/logout', logout);
router.patch('/update-password', validateUpdatePassword, updatePassword);

module.exports = router;