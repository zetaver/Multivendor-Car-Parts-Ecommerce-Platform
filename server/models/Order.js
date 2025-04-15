const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  pickupPoint: {
    id: String,
    name: String,
    provider: String,
    address: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    price: Number,
    deliveryDays: String,
    distance: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentIntentId: {
    type: String,
    default: null
  },
  shippingMethod: {
    type: String,
    enum: ['pickup', 'home', 'standard', 'express'],
    default: 'standard'
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  isOfferPurchase: {
    type: Boolean,
    default: false
  },
  offerDetails: {
    offerId: String,
    originalPrice: Number,
    offerAmount: Number,
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);