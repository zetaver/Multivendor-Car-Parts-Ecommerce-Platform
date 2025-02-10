const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['new', 'used'],
    required: true
  },
  oemNumber: {
    type: String,
    required: true,
    unique: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  compatibility: [{
    make: String,
    model: String,
    year: Number
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add indexes for better search performance
productSchema.index({ title: 'text', description: 'text', oemNumber: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ seller: 1 });

module.exports = mongoose.model('Product', productSchema);