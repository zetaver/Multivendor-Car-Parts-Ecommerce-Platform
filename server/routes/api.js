const express = require('express');
const authRoutes = require('./auth');
const orderRoutes = require('./orders');
const messageRoutes = require('./messages');
const userRoutes = require('./users');
const categoryRoutes = require('./categories');
const mediaRoutes = require('./media');
const productRoutes = require('./products');
const wishlistRoutes = require('./wishlist');
const addressRoutes = require('./addresses');
const bannerRoutes = require('./banners');
const paymentRoutes = require('./payments');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/media', mediaRoutes);
router.use('/products', productRoutes);
router.use('/banners', bannerRoutes);

// Protected routes
router.use('/orders', authenticate, orderRoutes);
router.use('/messages', authenticate, messageRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/addresses', authenticate, addressRoutes);
router.use('/payments', authenticate, paymentRoutes);

// Add a test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'API routes are working' });
});

// For debugging - log all registered routes
console.log('API routes registered:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
  }
});

module.exports = router;