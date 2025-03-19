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

// Protected routes
router.post('/logout', authenticate, async (req, res) => {
  // Clear refresh token from user document
  req.user.refreshToken = undefined;
  await req.user.save();
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;