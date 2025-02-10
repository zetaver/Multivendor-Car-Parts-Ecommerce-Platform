import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  product: Schema.Types.ObjectId;
  order: Schema.Types.ObjectId;
  reviewer: Schema.Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
}

const reviewSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
    required: true
  },
  images: [String],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Prevent multiple reviews from same user for same product
reviewSchema.index({ product: 1, reviewer: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', reviewSchema);