const mongoose = require('mongoose');

const sellerReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: false,
    maxlength: 500
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Ensure a user can only leave one review per order
sellerReviewSchema.index({ user: 1, order: 1 }, { unique: true });
// Index to quickly find all reviews for a seller
sellerReviewSchema.index({ seller: 1 });

module.exports = mongoose.model('SellerReview', sellerReviewSchema); 