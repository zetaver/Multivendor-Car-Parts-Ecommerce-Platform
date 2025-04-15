const mongoose = require('mongoose');
const SellerReview = require('../models/SellerReview');
const Order = require('../models/Order');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Helper to calculate and update seller rating
const updateSellerRating = async (sellerId) => {
  try {
    const reviews = await SellerReview.find({ seller: sellerId });
    
    if (reviews.length === 0) {
      await User.findByIdAndUpdate(sellerId, { rating: 0 });
      return 0;
    }
    
    // Calculate the average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
    
    // Update the seller's rating
    await User.findByIdAndUpdate(sellerId, { rating: roundedRating });
    
    return roundedRating;
  } catch (error) {
    console.error('Error updating seller rating:', error);
    throw error;
  }
};

// Create a new review for a seller
exports.createSellerReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { sellerId, orderId, rating, comment, productId } = req.body;
    const userId = req.user.id;

    // Verify the order exists and belongs to the user
    const order = await Order.findOne({
      _id: orderId,
      buyer: userId,
      seller: sellerId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to you'
      });
    }

    // Check if the order status is 'delivered'
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only review orders that have been delivered'
      });
    }

    // Check if the user has already reviewed this order
    const existingReview = await SellerReview.findOne({
      user: userId,
      order: orderId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this order'
      });
    }

    // Create the review
    const review = new SellerReview({
      user: userId,
      seller: sellerId,
      order: orderId,
      rating,
      comment,
      productId
    });

    const savedReview = await review.save();

    // Update the seller's average rating
    const newRating = await updateSellerRating(sellerId);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        review: savedReview,
        sellerRating: newRating
      }
    });
  } catch (error) {
    console.error('Error creating seller review:', error);
    
    // Check for duplicate key error (user already reviewed this order)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this order'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all reviews for a seller
exports.getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { sort = 'recent', limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort option
    let sortOption = {};
    switch (sort) {
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { rating: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Get total count for pagination
    const totalCount = await SellerReview.countDocuments({ 
      seller: sellerId,
      isVisible: true
    });
    
    // Fetch the reviews
    const reviews = await SellerReview.find({ 
      seller: sellerId,
      isVisible: true 
    })
      .populate('user', 'firstName lastName avatar')
      .populate('productId', 'title images')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get rating statistics
    const stats = await SellerReview.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId), isVisible: true } },
      { $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    // Format stats into an object
    const ratingStats = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    
    stats.forEach(stat => {
      ratingStats[stat._id] = stat.count;
    });
    
    // Get seller info including current rating
    const seller = await User.findById(sellerId)
      .select('rating totalSales firstName lastName storeName');
    
    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / parseInt(limit)),
          limit: parseInt(limit)
        },
        stats: {
          average: seller.rating,
          total: totalCount,
          distribution: ratingStats
        },
        seller: {
          _id: seller._id,
          name: `${seller.firstName} ${seller.lastName}`,
          storeName: seller.storeName,
          rating: seller.rating,
          totalSales: seller.totalSales
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all reviews submitted by the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with user's reviews
 */
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching reviews for user: ${userId}`);
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find reviews by this user
    const reviews = await SellerReview.find({ user: userId })
      .populate('seller', 'firstName lastName storeName')
      .populate('productId', 'title images')
      .populate('order', 'createdAt')
      .sort({ createdAt: -1 });
      
    console.log(`Found ${reviews.length} reviews for user: ${userId}`);
      
    return res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user reviews',
      error: error.message
    });
  }
};

/**
 * Update a seller review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with updated review
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    console.log(`Attempting to update review ${reviewId} by user ${userId}`);
    console.log('Update data:', { rating, comment });

    // Find the review by ID and verify that it belongs to the user
    const review = await SellerReview.findOne({ _id: reviewId, user: userId });

    if (!review) {
      console.log(`Review not found or unauthorized. ReviewID: ${reviewId}, UserID: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found or you are not authorized to update this review' 
      });
    }

    // Update the review fields
    if (rating !== undefined) {
      review.rating = rating;
    }
    
    if (comment !== undefined) {
      review.comment = comment;
    }

    const updatedReview = await review.save();
    console.log(`Review ${reviewId} updated successfully`);
    
    // Update the seller's rating
    const newRating = await updateSellerRating(review.seller);
    console.log(`Updated seller ${review.seller} rating to ${newRating}`);

    return res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview,
      sellerRating: newRating
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating review',
      error: error.message
    });
  }
};

/**
 * Delete a seller review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response indicating success
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    console.log(`Attempting to delete review ${reviewId} by user ${userId}`);

    // Find the review by ID and verify that it belongs to the user
    const review = await SellerReview.findOne({ _id: reviewId, user: userId });

    if (!review) {
      console.log(`Review not found or unauthorized. ReviewID: ${reviewId}, UserID: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found or you are not authorized to delete this review' 
      });
    }
    
    // Save seller ID before deleting for rating update
    const sellerId = review.seller;

    // Delete the review
    await SellerReview.deleteOne({ _id: reviewId });
    console.log(`Review ${reviewId} deleted successfully`);
    
    // Update the seller's rating
    const newRating = await updateSellerRating(sellerId);
    console.log(`Updated seller ${sellerId} rating to ${newRating} after review deletion`);

    return res.json({
      success: true,
      message: 'Review deleted successfully',
      data: {
        deletedReviewId: reviewId,
        sellerId: sellerId,
        sellerRating: newRating
      }
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting review',
      error: error.message
    });
  }
};

// Get eligible orders for review
exports.getEligibleOrdersForReview = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find delivered orders that have not been reviewed
    const orders = await Order.find({
      buyer: userId,
      status: 'delivered'
    })
      .populate('seller', 'firstName lastName storeName')
      .populate('items.product', 'title images')
      .sort({ updatedAt: -1 });
    
    // Get already reviewed orders to filter them out
    const reviewedOrders = await SellerReview.find({
      user: userId
    }).select('order');
    
    const reviewedOrderIds = reviewedOrders.map(review => review.order.toString());
    
    // Filter out already reviewed orders
    const eligibleOrders = orders.filter(order => !reviewedOrderIds.includes(order._id.toString()));
    
    res.status(200).json({
      success: true,
      data: eligibleOrders
    });
  } catch (error) {
    console.error('Error fetching eligible orders for review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 