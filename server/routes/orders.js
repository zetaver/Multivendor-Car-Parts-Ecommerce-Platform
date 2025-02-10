const express = require('express');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getSellerOrders,
  getBuyerOrders
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/seller', authenticate, authorize('seller'), getSellerOrders);
router.get('/buyer', authenticate, getBuyerOrders);
router.get('/:id', authenticate, getOrder);
router.put('/:id/status', authenticate, authorize('seller', 'admin'), updateOrderStatus);
router.put('/:id/cancel', authenticate, cancelOrder);

module.exports = router;

export default router