import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import SellerProfile from '../models/SellerProfile.js';
import { logAudit } from '../services/auditService.js';

// @desc    Submit a verified or buyer review
// @route   POST /api/reviews
// @access  Private
export const addReview = async (req, res, next) => {
  try {
    const { productId, sellerId, orderId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ success: false, message: 'Product ID and rating are required' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let verifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        buyerId: req.user._id,
        'items.productId': productId
      });
      if (order) {
        verifiedPurchase = true;
      }
    }

    const targetSellerId = sellerId || product.sellerId;

    const review = await Review.create({
      reviewerId: req.user._id,
      sellerId: targetSellerId,
      productId,
      orderId: verifiedPurchase ? orderId : null,
      rating: numRating,
      comment: comment?.trim() || '',
      verifiedPurchase,
      status: 'PUBLISHED'
    });

    // Update Product average rating
    const allReviews = await Review.find({ productId, status: 'PUBLISHED' });
    const count = allReviews.length;
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

    await Product.findByIdAndUpdate(productId, {
      $set: {
        'ratings.average': Math.round(avg * 10) / 10,
        'ratings.count': count
      }
    });

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'REVIEW_SUBMITTED',
      resourceType: 'Review',
      resourceId: review._id,
      metadata: { productId, rating: numRating, verifiedPurchase },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:id
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.id, status: 'PUBLISHED' })
      .populate('reviewerId', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reviews for a seller
// @route   GET /api/reviews/seller/:id
// @access  Public
export const getSellerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.id, status: 'PUBLISHED' })
      .populate('reviewerId', 'name avatar')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
};
