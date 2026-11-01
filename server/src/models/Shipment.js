import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['LOCAL_STORE_PICKUP', 'SELLER_FLEET', 'DELHIVERY_LOGISTICS', 'INDIA_POST', 'STANDARD_COURIER'],
      default: 'LOCAL_STORE_PICKUP'
    },
    trackingNumber: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'FAILED'],
      default: 'LABEL_CREATED',
      index: true
    },
    pickupAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    estimatedDelivery: {
      type: Date,
      default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    trackingUrl: {
      type: String,
      default: ''
    },
    statusUpdates: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        location: { type: String, default: '' },
        message: { type: String, default: '' }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;
