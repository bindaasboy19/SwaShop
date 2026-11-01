import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'ENQUIRY_RECEIVED',
        'ENQUIRY_RESPONDED',
        'B2B_MATCH',
        'B2B_QUOTE_RECEIVED',
        'B2B_QUOTE_ACCEPTED',
        'B2B_QUOTE_REJECTED',
        'ORDER_CREATED',
        'ORDER_STATUS_UPDATED',
        'PAYMENT_RECEIVED',
        'VERIFICATION_APPROVED',
        'VERIFICATION_REJECTED',
        'MARKET_INSIGHT',
        'SYSTEM_ANNOUNCEMENT'
      ],
      default: 'SYSTEM_ANNOUNCEMENT'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'PUSH', 'WHATSAPP', 'EMAIL'],
      default: 'IN_APP'
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
