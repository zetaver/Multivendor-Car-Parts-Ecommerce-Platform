const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post(
  '/',
  [
    authenticate,
    [
      check('items', 'Items are required').isArray({ min: 1 }),
      check('items.*.productId', 'Product ID is required for each item').notEmpty(),
      check('items.*.quantity', 'Quantity must be a positive number').isInt({ min: 1 }),
      check('addressId', 'Address ID is required').notEmpty(),
      check('paymentMethod', 'Payment method is required').notEmpty(),
      check('paymentIntentId', 'Payment intent ID').optional(),
      check('shippingMethod', 'Shipping method').optional(),
      check('totalAmount', 'Total amount must be a positive number').optional().isFloat({ min: 0 }),
      check('pickupPoint', 'Pickup point information').optional(),
      check('pickupPoint.id', 'Pickup point ID is required when pickup point is provided').optional().notEmpty(),
      check('pickupPoint.name', 'Pickup point name is required when pickup point is provided').optional().notEmpty(),
      check('pickupPoint.address', 'Pickup point address is required when pickup point is provided').optional().notEmpty()
    ]
  ],
  orderController.createOrder
);

// @route   GET /api/orders
// @desc    Get order history for the authenticated user
// @access  Private
router.get('/', authenticate, orderController.getOrderHistory);

// @route   GET /api/orders/admin/all
// @desc    Get all seller orders (admin only)
// @access  Private/Admin
router.get('/admin/all', authenticate, authorize('admin'), orderController.getAllSellerOrders);

// @route   GET /api/orders/admin/count
// @desc    Count all seller orders (admin only)
// @access  Private/Admin
router.get('/admin/count', authenticate, authorize('admin'), orderController.countSellerOrders);

// @route   GET /api/orders/seller
// @desc    Get orders for the authenticated seller
// @access  Private/Seller
router.get('/seller', authenticate, authorize('seller'), orderController.getSellerOrders);

// @route   GET /api/orders/:id
// @desc    Get a specific order by ID
// @access  Private
router.get('/:id', authenticate, orderController.getOrderById);

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (admin, seller, or user for cancellation)
// @access  Private
router.patch(
  '/:id/status',
  [
    authenticate,
    check('status', 'Status is required').notEmpty()
  ],
  orderController.updateOrderStatus
);

// @route   PATCH /api/orders/:id/payment
// @desc    Update payment status (admin only)
// @access  Private/Admin
router.patch(
  '/:id/payment',
  [
    authenticate,
    authorize('admin'),
    check('paymentStatus', 'Payment status is required').notEmpty()
  ],
  orderController.updatePaymentStatus
);

// @route   PATCH /api/orders/:id/tracking
// @desc    Update order tracking number (admin or seller)
// @access  Private
router.patch(
  '/:id/tracking',
  [
    authenticate,
    check('trackingNumber', 'Tracking number is required').notEmpty()
  ],
  orderController.updateOrderTracking
);

// @route   DELETE /api/orders/:id
// @desc    Delete an order (admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), orderController.deleteOrder);

module.exports = router; 