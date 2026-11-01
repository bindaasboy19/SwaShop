import mongoose from 'mongoose';

const quoteItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuyerRequirement',
      required: true,
      index: true
    },
    buyerId: {
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
    items: {
      type: [quoteItemSchema],
      required: true
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    leadTimeDays: {
      type: Number,
      default: 7,
      min: 1
    },
    validityDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days validity
    },
    shippingIncluded: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_ORDER'],
      default: 'PENDING',
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    }
  },
  {
    timestamps: true
  }
);

quoteSchema.index({ requirementId: 1, sellerId: 1 });
quoteSchema.index({ buyerId: 1, status: 1 });

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;
