const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    priceAtAdd: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Add index for better query performance
wishlistSchema.index({ user: 1 });

// Method to check if product exists in wishlist
wishlistSchema.methods.hasProduct = function(productId) {
  return this.products.some(item => item.product.toString() === productId.toString());
};

// Method to add product to wishlist
wishlistSchema.methods.addProduct = function(productId, price) {
  if (!this.hasProduct(productId)) {
    this.products.push({
      product: productId,
      priceAtAdd: price
    });
  }
  return this;
};

// Method to remove product from wishlist
wishlistSchema.methods.removeProduct = function(productId) {
  this.products = this.products.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this;
};

// Virtual for total items count
wishlistSchema.virtual('totalItems').get(function() {
  return this.products.length;
});

module.exports = mongoose.model('Wishlist', wishlistSchema);