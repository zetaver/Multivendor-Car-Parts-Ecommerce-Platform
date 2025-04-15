const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentMethodSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    stripeCustomerId: {
      type: String,
      required: true
    },
    stripePaymentMethodId: {
      type: String,
      required: true
    },
    cardType: {
      type: String,
      required: true
    },
    lastFourDigits: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 4
    },
    expirationMonth: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2
    },
    expirationYear: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 4
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    billingDetails: {
      name: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
      }
    }
  },
  { timestamps: true }
);

// Only one payment method can be default for a user
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // If this payment method is being set as default, unset any other default payment methods for this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// If this is the user's first payment method, make it default
paymentMethodSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments({ userId: this.userId });
    if (count === 0) {
      this.isDefault = true;
    }
  }
  next();
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema); 