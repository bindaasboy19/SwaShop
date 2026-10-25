import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    feature: {
      type: String,
      required: true,
      enum: [
        'TITLE',
        'DESCRIPTION',
        'CATEGORY',
        'TAGS',
        'ATTRIBUTES',
        'CATALOG',
        'IMAGE_ENHANCE',
        'TRANSCRIBE',
        'PRICING'
      ]
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    provider: {
      type: String,
      default: 'gemini'
    },
    model: {
      type: String,
      default: 'gemini-2.5-flash'
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS'
    },
    errorMessage: {
      type: String,
      default: null
    },
    durationMs: {
      type: Number,
      default: 0
    },
    inputSummary: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

aiUsageSchema.index({ userId: 1, createdAt: -1 });
aiUsageSchema.index({ feature: 1, status: 1 });
aiUsageSchema.index({ createdAt: -1 });

const AIUsage = mongoose.model('AIUsage', aiUsageSchema);
export default AIUsage;
