import mongoose from 'mongoose';

const sellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    sellerType: {
      type: String,
      enum: ['ARTISAN', 'LOCAL_SHOP', 'MSME', 'MICRO_ENTREPRENEUR'],
      required: [true, 'Seller type is required']
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      trim: true,
      default: ''
    },
    logo: {
      type: String,
      default: ''
    },
    coverImage: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      default: ''
    },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    businessHours: {
      type: String,
      default: 'Mon - Sat: 9:00 AM - 8:00 PM'
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'APPROVED', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING'
    },
    verificationDetails: {
      requestedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewNotes: { type: String, default: '' },
      documentType: {
        type: String,
        enum: ['GSTIN', 'UDYAM', 'TRADE_LICENSE', 'ARTISAN_CARD', 'AADHAAR', 'OTHER', ''],
        default: ''
      },
      documentNumber: { type: String, default: '', select: false },
      documentUrl: { type: String, default: '', select: false } // Protected document
    },
    b2bProfile: {
      enabled: { type: Boolean, default: false },
      productionCapacity: { type: Number, default: 0 }, // units per month
      minimumOrderQuantity: { type: Number, default: 1 },
      bulkAvailable: { type: Boolean, default: false },
      leadTimeDays: { type: Number, default: 7 },
      businessCategories: { type: [String], default: [] },
      serviceLocations: { type: [String], default: [] },
      catalogSummary: { type: String, default: '' }
    },
    isOpen: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Synchronize GeoJSON location array whenever coordinates change
sellerProfileSchema.pre('save', function (next) {
  if (this.coordinates && (this.coordinates.lat !== undefined || this.coordinates.lng !== undefined)) {
    this.location = {
      type: 'Point',
      coordinates: [this.coordinates.lng || 0, this.coordinates.lat || 0]
    };
  }
  next();
});

sellerProfileSchema.index({ location: '2dsphere' });
sellerProfileSchema.index({ businessName: 'text', description: 'text', city: 'text' });
sellerProfileSchema.index({ verificationStatus: 1, isOpen: 1 });

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);
export default SellerProfile;
