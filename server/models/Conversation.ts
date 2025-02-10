import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: Schema.Types.ObjectId[];
  lastMessage?: Schema.Types.ObjectId;
  product?: Schema.Types.ObjectId;
  isActive: boolean;
}

const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IConversation>('Conversation', conversationSchema);