import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    },
    verifiedPurchase: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'UNDER_REVIEW', 'FLAGGED', 'REMOVED'],
      default: 'PUBLISHED',
      index: true
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ sellerId: 1, status: 1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
