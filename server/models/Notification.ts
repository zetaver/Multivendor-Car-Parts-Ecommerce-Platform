import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: Schema.Types.ObjectId;
  type: 'order' | 'message' | 'price' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
}

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'message', 'price', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  data: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export default mongoose.model<INotification>('Notification', notificationSchema);