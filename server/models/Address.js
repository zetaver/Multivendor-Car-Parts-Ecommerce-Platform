const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    street: {
      type: String,
      required: [true, 'Street is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Only one address can be default for a user
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // If this address is being set as default, unset any other default addresses for this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Address', addressSchema); 