import Favourite from '../models/Favourite.js';
import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';

// @desc    Toggle saving a product
// @route   POST /api/favourites/products/:id
// @access  Private (Customer or Seller)
export const toggleProductFavourite = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const existing = await Favourite.findOne({
      userId: req.user._id,
      targetType: 'PRODUCT',
      targetId: productId
    });

    if (existing) {
      await Favourite.findByIdAndDelete(existing._id);
      return res.json({
        success: true,
        saved: false,
        message: 'Product removed from saved items.'
      });
    } else {
      await Favourite.create({
        userId: req.user._id,
        targetType: 'PRODUCT',
        targetId: productId,
        targetModel: 'Product'
      });
      return res.json({
        success: true,
        saved: true,
        message: 'Product added to saved items.'
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle saving a seller shop
// @route   POST /api/favourites/sellers/:id
// @access  Private (Customer or Seller)
export const toggleSellerFavourite = async (req, res, next) => {
  try {
    const sellerId = req.params.id;
    const seller = await SellerProfile.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found.'
      });
    }

    const existing = await Favourite.findOne({
      userId: req.user._id,
      targetType: 'SELLER',
      targetId: sellerId
    });

    if (existing) {
      await Favourite.findByIdAndDelete(existing._id);
      return res.json({
        success: true,
        saved: false,
        message: 'Seller removed from saved shops.'
      });
    } else {
      await Favourite.create({
        userId: req.user._id,
        targetType: 'SELLER',
        targetId: sellerId,
        targetModel: 'SellerProfile'
      });
      return res.json({
        success: true,
        saved: true,
        message: 'Seller added to saved shops.'
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get all saved products and sellers for current user
// @route   GET /api/favourites
// @access  Private (Customer or Seller)
export const getMyFavourites = async (req, res, next) => {
  try {
    const favourites = await Favourite.find({ userId: req.user._id });

    const productIds = favourites
      .filter((f) => f.targetType === 'PRODUCT')
      .map((f) => f.targetId);

    const sellerIds = favourites
      .filter((f) => f.targetType === 'SELLER')
      .map((f) => f.targetId);

    const savedProducts = await Product.find({
      _id: { $in: productIds },
      isPublished: true,
      isActive: true
    })
      .populate('sellerId', 'businessName sellerType city logo coordinates')
      .populate('categoryId', 'name slug icon');

    const savedSellers = await SellerProfile.find({
      _id: { $in: sellerIds },
      verificationStatus: 'APPROVED'
    });

    res.json({
      success: true,
      productsCount: savedProducts.length,
      sellersCount: savedSellers.length,
      products: savedProducts,
      sellers: savedSellers
    });
  } catch (err) {
    next(err);
  }
};
