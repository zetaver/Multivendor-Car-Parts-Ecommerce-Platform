const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

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
router.get('/check/:productId', wishlistController.checkWishlistItem);

// Clear wishlist
router.delete('/clear', wishlistController.clearWishlist);

module.exports = router; 