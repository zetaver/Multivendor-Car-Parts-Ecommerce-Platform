import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlist extends Document {
  user: Schema.Types.ObjectId;
  products: Schema.Types.ObjectId[];
}

const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);