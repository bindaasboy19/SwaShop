import mongoose from 'mongoose';

const moderationReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['PRODUCT', 'SELLER', 'REVIEW', 'MESSAGE'],
      required: true,
      index: true
    },
    targetId: {
      type: String,
      required: true,
      index: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    details: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED'],
      default: 'OPEN',
      index: true
    },
    adminNotes: {
      type: String,
      default: ''
    },
    actionTaken: {
      type: String,
      enum: ['NONE', 'WARNING_ISSUED', 'CONTENT_REMOVED', 'SELLER_SUSPENDED', 'DISMISSED'],
      default: 'NONE'
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const ModerationReport = mongoose.model('ModerationReport', moderationReportSchema);
export default ModerationReport;
