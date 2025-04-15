const express = require('express');
const {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  checkEmail
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Token verification endpoint
router.get('/verify-token', authenticate, (req, res) => {
  // If authentication middleware passes, the token is valid
  res.status(200).json({ 
    valid: true, 
    message: 'Token is valid',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Protected routes
router.post('/logout', authenticate, async (req, res) => {
  // Clear refresh token from user document
  req.user.refreshToken = undefined;
  await req.user.save();
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;