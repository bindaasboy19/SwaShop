import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: [true, 'Seller profile reference is required']
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    images: {
      type: [String],
      default: []
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    discountPrice: {
      type: Number,
      default: null,
      min: [0, 'Discount price must be positive']
    },
    availability: {
      type: Boolean,
      default: true
    },
    stockStatus: {
      type: String,
      enum: ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'],
      default: 'AVAILABLE'
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'],
      default: 'AVAILABLE'
    },
    availabilityUpdatedAt: {
      type: Date,
      default: Date.now
    },
    quantityAvailable: {
      type: Number,
      default: null
    },
    b2b: {
      enabled: { type: Boolean, default: false },
      minOrderQuantity: { type: Number, default: 1 },
      bulkPrice: { type: Number, default: null },
      productionCapacity: { type: Number, default: 0 },
      leadTimeDays: { type: Number, default: 7 }
    },
    searchMetadata: {
      keywords: { type: [String], default: [] },
      normalizedTerms: { type: [String], default: [] }
    },
    favouriteCount: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    // Phase 2 AI & Structured Metadata Extensions
    features: {
      type: [String],
      default: []
    },
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    keywords: {
      type: [String],
      default: []
    },
    multilingual: {
      title: {
        en: { type: String, default: '' },
        hi: { type: String, default: '' }
      },
      description: {
        en: { type: String, default: '' },
        hi: { type: String, default: '' }
      }
    },
    aiMetadata: {
      generatedTitle: { type: String, default: '' },
      generatedDescription: { type: String, default: '' },
      generatedTags: { type: [String], default: [] },
      generatedCategory: { type: String, default: '' },
      language: { type: String, default: 'en' },
      lastGeneratedAt: { type: Date, default: null },
      generationSource: { type: String, default: '' }
    },
    enhancedImages: [
      {
        original: { type: String, required: true },
        enhanced: { type: String, required: true },
        enhancedAt: { type: Date, default: Date.now }
      }
    ],
    catalogQualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Helper function to calculate catalog quality score deterministically
productSchema.methods.calculateQualityScore = function () {
  let score = 0;
  if (this.name && this.name.trim().length >= 3) score += 15;
  if (this.description && this.description.trim().length >= 30) score += 20;
  else if (this.description && this.description.trim().length > 0) score += 10;
  if (this.categoryId) score += 15;
  if (this.images && this.images.length > 0) score += 20;
  if (this.price && this.price > 0) score += 10;
  if (this.tags && this.tags.length >= 3) score += 10;
  else if (this.tags && this.tags.length > 0) score += 5;
  if ((this.features && this.features.length > 0) || (this.attributes && Object.keys(this.attributes).length > 0)) score += 10;

  this.catalogQualityScore = Math.min(score, 100);
  return this.catalogQualityScore;
};

// Auto calculate score and sync availability before save
productSchema.pre('save', function (next) {
  this.calculateQualityScore();
  if (this.isModified('stockStatus') && !this.isModified('availabilityStatus')) {
    this.availabilityStatus = this.stockStatus;
    this.availabilityUpdatedAt = new Date();
  } else if (this.isModified('availabilityStatus') && !this.isModified('stockStatus')) {
    this.stockStatus = this.availabilityStatus;
    this.availabilityUpdatedAt = new Date();
  }
  if (this.stockStatus === 'OUT_OF_STOCK' || this.availabilityStatus === 'OUT_OF_STOCK') {
    this.availability = false;
  }
  next();
});

productSchema.index({ sellerId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ isPublished: 1, isActive: 1, availability: 1 });
productSchema.index({ 'b2b.enabled': 1 });
productSchema.index({ availabilityStatus: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text', keywords: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;

