const express = require('express');
const { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  searchProducts,
  getSellerProducts
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

// Protected routes
router.post('/', authenticate, authorize('seller', 'admin'), createProduct);
router.put('/:id', authenticate, authorize('seller', 'admin'), updateProduct);
router.delete('/:id', authenticate, authorize('seller', 'admin'), deleteProduct);
router.get('/seller/:sellerId', getSellerProducts);

module.exports = router;