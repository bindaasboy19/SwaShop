import mongoose from 'mongoose';

const buyerRequirementSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer user ID is required']
    },
    title: {
      type: String,
      required: [true, 'Requirement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Requirement description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    budgetMin: {
      type: Number,
      default: null,
      min: 0
    },
    budgetMax: {
      type: Number,
      default: null,
      min: 0
    },
    targetPricePerUnit: {
      type: Number,
      default: null,
      min: 0
    },
    location: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
      }
    },
    deadline: {
      type: Date,
      default: null
    },
    requiredAttributes: {
      type: [String],
      default: []
    },
    preferredSellerTypes: {
      type: [String],
      default: []
    },
    bulkRequired: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'MATCHED', 'IN_DISCUSSION', 'CLOSED', 'EXPIRED'],
      default: 'OPEN'
    },
    matchedSellerCount: {
      type: Number,
      default: 0
    },
    enquiriesCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

buyerRequirementSchema.index({ buyerId: 1 });
buyerRequirementSchema.index({ category: 1, status: 1 });
buyerRequirementSchema.index({ status: 1, createdAt: -1 });
buyerRequirementSchema.index({ 'location.city': 1 });

const BuyerRequirement = mongoose.model('BuyerRequirement', buyerRequirementSchema);
export default BuyerRequirement;
