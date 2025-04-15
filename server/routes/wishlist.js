const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[Wishlist Route] ${req.method} ${req.originalUrl}`);
  next();
});

// All wishlist routes require authentication
router.use(authenticate);

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Get count of items in user's wishlist
router.get('/count', wishlistController.getWishlistCount);

// Get count of users who have favorited a product
router.get('/product-favorite-count/:id', wishlistController.getProductFavoriteCount);

// Add product to wishlist
router.post('/add', wishlistController.addToWishlist);

// Remove product from wishlist
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

// Check if product is in wishlist
/**
 * @route GET /api/wishlist/check/:productId
 * @desc Check if a specific product is in the user's wishlist
 * @access Private - requires authentication
 * @returns {Object} Object with isInWishlist boolean
 */
router.get('/check/:productId', wishlistController.checkWishlistItem);

// Get recently added wishlist items
/**
 * @route GET /api/wishlist/recent
 * @desc Get most recently added items to wishlist
 * @access Private - requires authentication
 * @returns {Array} List of recent wishlist items
 */
router.get('/recent', wishlistController.getRecentWishlistItems);

// Toggle product in wishlist (add if not exists, remove if exists)
/**
 * @route POST /api/wishlist/toggle/:productId
 * @desc Toggle a product in wishlist (add/remove)
 * @access Private - requires authentication
 * @returns {Object} Updated wishlist status
 */
router.post('/toggle/:productId', wishlistController.toggleWishlistItem);

// Clear wishlist
router.delete('/clear', wishlistController.clearWishlist);

// Error handling middleware for wishlist routes
router.use((err, req, res, next) => {
  console.error('Wishlist route error:', err);
  res.status(500).json({
    success: false,
    message: 'Wishlist operation failed',
    error: err.message
  });
});

module.exports = router; 