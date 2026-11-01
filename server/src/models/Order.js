import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    image: {
      type: String,
      default: ''
    },
    selectedVariant: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: [true, 'Seller reference is required'],
      index: true
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items && items.length > 0,
        message: 'Order must contain at least one item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentStatus: {
      type: String,
      enum: ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'OFFLINE_PENDING', 'OFFLINE_COMPLETED'],
      default: 'PENDING'
    },
    paymentMethod: {
      type: String,
      enum: ['CASH_ON_DELIVERY', 'ONLINE_UPI_CARD', 'OFFLINE_STORE_PAY'],
      default: 'CASH_ON_DELIVERY'
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },
    fulfilmentType: {
      type: String,
      enum: ['PICKUP', 'SELLER_DELIVERY', 'THIRD_PARTY_DELIVERY'],
      default: 'PICKUP'
    },
    shippingAddress: {
      fullName: { type: String, default: '' },
      phone: { type: String, default: '' },
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' }
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      default: null
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' }
      }
    ],
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ sellerId: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ buyerId: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
