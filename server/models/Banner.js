const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bannerSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image is required']
    },
    link: {
      type: String,
      default: '#'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    position: {
      type: String,
      enum: ['home_top', 'home_middle', 'home_bottom', 'category_page', 'sidebar'],
      default: 'home_top'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: () => new Date(+new Date() + 30*24*60*60*1000) // Default 30 days from now
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Index for faster queries
bannerSchema.index({ position: 1, isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Banner', bannerSchema); 