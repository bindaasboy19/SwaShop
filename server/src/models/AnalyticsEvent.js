import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        'PRODUCT_VIEW',
        'PRODUCT_SEARCH_IMPRESSION',
        'PRODUCT_FAVOURITE',
        'SELLER_PROFILE_VIEW',
        'ENQUIRY_CREATED',
        'ENQUIRY_VIEWED',
        'SEARCH_PERFORMED',
        'B2B_REQUIREMENT_VIEW',
        'B2B_MATCH_VIEW'
      ],
      required: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      default: null
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    source: {
      type: String,
      enum: ['SEARCH', 'NEARBY', 'CATEGORY', 'DIRECT', 'B2B', 'RECOMMENDATION', 'OTHER'],
      default: 'DIRECT'
    }
  },
  {
    timestamps: true
  }
);

analyticsEventSchema.index({ sellerId: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ productId: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
export default AnalyticsEvent;
