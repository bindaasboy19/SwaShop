import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer user reference is required']
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: [true, 'Seller profile reference is required']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuyerRequirement',
      default: null
    },
    enquiryType: {
      type: String,
      enum: ['DIRECT', 'B2B_REQUIREMENT'],
      default: 'DIRECT'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    message: {
      type: String,
      required: [true, 'Enquiry message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'VIEWED', 'RESPONDED', 'ACCEPTED', 'REJECTED', 'CLOSED'],
      default: 'PENDING'
    },
    responseMessage: {
      type: String,
      trim: true,
      default: ''
    },
    quotedPrice: {
      type: Number,
      default: null
    },
    estimatedLeadTimeDays: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

enquirySchema.index({ customerId: 1 });
enquirySchema.index({ sellerId: 1 });
enquirySchema.index({ requirementId: 1 });
enquirySchema.index({ status: 1 });

const Enquiry = mongoose.model('Enquiry', enquirySchema);
export default Enquiry;
