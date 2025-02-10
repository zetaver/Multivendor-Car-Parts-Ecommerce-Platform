const express = require('express');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const messageRoutes = require('./messages');
const userRoutes = require('./users');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);

// Protected routes
router.use('/orders', authenticate, orderRoutes);
router.use('/messages', authenticate, messageRoutes);
router.use('/users', authenticate, userRoutes);

module.exports = router;