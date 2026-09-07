import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetType: {
      type: String,
      enum: ['PRODUCT', 'SELLER'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetModel'
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['Product', 'SellerProfile']
    }
  },
  {
    timestamps: true
  }
);

favouriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
favouriteSchema.index({ userId: 1, targetType: 1 });

const Favourite = mongoose.model('Favourite', favouriteSchema);
export default Favourite;
