import mongoose from 'mongoose';

const searchEventSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    category: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    resultsCount: {
      type: Number,
      default: 0
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    searchType: {
      type: String,
      enum: ['KEYWORD', 'SEMANTIC', 'NEARBY', 'CATEGORY_FILTER'],
      default: 'KEYWORD'
    }
  },
  {
    timestamps: true
  }
);

searchEventSchema.index({ query: 1, createdAt: -1 });
searchEventSchema.index({ category: 1, createdAt: -1 });
searchEventSchema.index({ createdAt: -1 });

const SearchEvent = mongoose.model('SearchEvent', searchEventSchema);
export default SearchEvent;
