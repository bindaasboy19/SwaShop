import mongoose from 'mongoose';

const resellerListingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: [true, 'Reseller profile ID is required']
    },
    sourceProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Source product ID is required']
    },
    sourceSellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: [true, 'Source seller ID is required']
    },
    price: {
      type: Number,
      required: [true, 'Resell price is required'],
      min: [0, 'Resell price must be non-negative']
    },
    quantity: {
      type: Number,
      required: [true, 'Resell quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    availability: {
      type: Boolean,
      default: true
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

resellerListingSchema.index({ sellerId: 1 });
resellerListingSchema.index({ sourceProductId: 1 });
resellerListingSchema.index({ sourceSellerId: 1 });
resellerListingSchema.index({ isPublished: 1, isActive: 1 });

const ResellerListing = mongoose.model('ResellerListing', resellerListingSchema);
export default ResellerListing;
