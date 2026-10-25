import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Exclude from normal queries by default
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'SELLER', 'ADMIN'],
      default: 'CUSTOMER'
    },
    avatar: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    buyerProfile: {
      enabled: { type: Boolean, default: false },
      businessName: { type: String, trim: true, default: '' },
      businessType: {
        type: String,
        enum: ['RETAILER', 'CORPORATE', 'WHOLESALER', 'INSTITUTIONAL', 'OTHER', ''],
        default: ''
      },
      industry: { type: String, trim: true, default: '' },
      location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: 'India' },
        coordinates: {
          lat: { type: Number, default: 0 },
          lng: { type: Number, default: 0 }
        }
      },
      gstNumber: { type: String, trim: true, default: '' },
      verificationStatus: {
        type: String,
        enum: ['UNVERIFIED', 'PENDING', 'VERIFIED'],
        default: 'UNVERIFIED'
      }
    }
  },
  {
    timestamps: true
  }
);

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Transform to remove sensitive information on serialization
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
