const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE || '30d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Generate random token
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Decode JWT without verification (for inspection)
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  generateRandomToken,
  hashToken,
  generateRefreshToken,
  decodeToken
};