const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const sellerReviewController = require('../controllers/sellerReviewController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Create a new seller review
// @access  Private
router.post(
  '/',
  [
    authenticate,
    [
      check('sellerId', 'Seller ID is required').not().isEmpty(),
      check('orderId', 'Order ID is required').not().isEmpty(),
      check('productId', 'Product ID is required').not().isEmpty(),
      check('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
      check('comment', 'Comment cannot exceed 500 characters').optional().isLength({ max: 500 })
    ]
  ],
  sellerReviewController.createSellerReview
);

// @route   GET /api/reviews/user
// @desc    Get all reviews submitted by the current user
// @access  Private
router.get('/user', authenticate, sellerReviewController.getUserReviews);

// @route   GET /api/reviews/seller/:sellerId
// @desc    Get all reviews for a seller
// @access  Public
router.get('/seller/:sellerId', sellerReviewController.getSellerReviews);

// @route   GET /api/reviews/eligible-orders
// @desc    Get orders eligible for review
// @access  Private
router.get('/eligible-orders', authenticate, sellerReviewController.getEligibleOrdersForReview);

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private
router.put('/:reviewId', authenticate, sellerReviewController.updateReview);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete('/:reviewId', authenticate, sellerReviewController.deleteReview);

module.exports = router; 