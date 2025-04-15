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
const brandRoutes = require('./brands');
const reviewRoutes = require('./reviews');
const contactRoutes = require('./contact');
const upsRoutes = require('./ups');
const { authenticate } = require('../middleware/auth');
const Conversation = require('../models/Conversation'); // Ensure the model is imported

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/media', mediaRoutes);
router.use('/products', productRoutes);
router.use('/banners', bannerRoutes);
router.use('/brands', brandRoutes);
router.use('/contact', contactRoutes);
router.use('/ups', upsRoutes);

// Protected routes
router.use('/orders', authenticate, orderRoutes);
router.use('/messages', authenticate, messageRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/addresses', authenticate, addressRoutes);
router.use('/payments', authenticate, paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/messages', messageRoutes); // new add to day 26

// DELETE route for conversations
router.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findByIdAndDelete(id);

    if (!conversation) {
      return res.status(404).json({ error: { message: 'Conversation not found' } });
    }

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

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