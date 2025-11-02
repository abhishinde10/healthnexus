const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Provider = require('../models/Provider');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Generate refresh token
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Create and send token response
const createSendToken = async (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Save refresh token to user
  user.refreshTokens.push({ token: refreshToken });
  await user.save({ validateBeforeSave: false });

  // Update last login
  user.updateLastLogin();

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.cookie('jwt', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  res.status(statusCode).json({
    success: true,
    message,
    token,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture
    }
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    userType,
    phone,
    licenseNumber,
    specialization,
    // Patient-specific fields
    dateOfBirth,
    gender,
    emergencyContact
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !userType) {
    return next(new AppError('Please provide all required fields', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 409));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    userType,
    phone
  });

  // Create role-specific profile
  if (userType === 'patient') {
    if (!dateOfBirth || !gender || !emergencyContact) {
      return next(new AppError('Please provide patient-specific information', 400));
    }

    await Patient.create({
      user: user._id,
      dateOfBirth,
      gender,
      emergencyContact
    });
  } else if (userType === 'nurse' || userType === 'doctor') {
    if (!licenseNumber || !specialization) {
      return next(new AppError('Please provide license number and specialization', 400));
    }

    // Check if license number already exists
    const existingProvider = await Provider.findOne({ licenseNumber });
    if (existingProvider) {
      return next(new AppError('Provider with this license number already exists', 409));
    }

    await Provider.create({
      user: user._id,
      licenseNumber,
      specialization,
      languages: [{ language: 'English', proficiency: 'native' }]
    });
  }

  // Generate email verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  // await sendVerificationEmail(user, verificationToken);

  createSendToken(user, 201, res, 'User registered successfully. Please check your email for verification.');
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password, userType } = req.body;

  // Check if email, password and userType are provided
  if (!email || !password || !userType) {
    return next(new AppError('Please provide email, password, and user type', 400));
  }

  // Check for user and include password in the result
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user type matches
  if (user.userType !== userType) {
    return next(new AppError(`Invalid user type. Expected ${user.userType}`, 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  createSendToken(user, 200, res, 'Login successful');
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    // Remove refresh token from user's tokens array
    const user = await User.findById(req.user._id);
    user.refreshTokens = user.refreshTokens.filter(
      tokenObj => tokenObj.token !== refreshToken
    );
    await user.save({ validateBeforeSave: false });
  }

  // Clear cookies
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  let profile = null;

  // Get role-specific profile
  if (req.user.userType === 'patient') {
    profile = await Patient.findOne({ user: req.user._id });
  } else if (['nurse', 'doctor'].includes(req.user.userType)) {
    profile = await Provider.findOne({ user: req.user._id });
  }

  res.status(200).json({
    success: true,
    user: req.user,
    profile
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide email address', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('No user found with this email address', 404));
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // TODO: Send password reset email
  // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
  // await sendPasswordResetEmail(user, resetURL);

  res.status(200).json({
    success: true,
    message: 'Password reset token sent to email!'
  });
});

// @desc    Reset password
// @route   PATCH /api/v1/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new AppError('Please provide new password', 400));
  }

  // Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res, 'Password reset successful');
});

// @desc    Update password
// @route   PATCH /api/v1/auth/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check if current password is correct
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  createSendToken(user, 200, res, 'Password updated successfully');
});

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new AppError('Please provide refresh token', 400));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(tokenObj => tokenObj.token === token);
    
    if (!tokenExists) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new tokens
    const newToken = signToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(tokenObj => tokenObj.token !== token);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

// @desc    Verify email
// @route   PATCH /api/v1/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  // Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  refreshToken,
  verifyEmail
};