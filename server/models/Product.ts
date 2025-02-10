import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory: string;
  condition: 'new' | 'used';
  oemNumber: string;
  seller: Schema.Types.ObjectId;
  compatibility: {
    make: string;
    model: string;
    year: number;
  }[];
  stock: number;
  views: number;
  rating: number;
  totalReviews: number;
  status: 'active' | 'inactive' | 'deleted';
}

const productSchema = new Schema({
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
    type: Schema.Types.ObjectId,
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

export default mongoose.model<IProduct>('Product', productSchema);