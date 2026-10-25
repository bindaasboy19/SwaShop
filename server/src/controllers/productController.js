import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';
import ResellerListing from '../models/ResellerListing.js';
import Category from '../models/Category.js';
import { calculateDistanceKm } from './sellerController.js';

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Seller only)
export const createProduct = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'You must complete your Seller Profile before adding products.'
      });
    }

    const {
      name,
      description,
      categoryId,
      images,
      price,
      discountPrice,
      availability,
      stockStatus,
      tags,
      features,
      attributes,
      keywords,
      multilingual,
      aiMetadata,
      enhancedImages,
      isPublished
    } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product name, price, and category.'
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category specified.'
      });
    }

    const product = await Product.create({
      sellerId: req.sellerProfile._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      categoryId,
      images: Array.isArray(images) ? images : [],
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      availability: availability !== undefined ? Boolean(availability) : true,
      stockStatus: stockStatus || 'AVAILABLE',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []),
      features: Array.isArray(features) ? features : [],
      attributes: typeof attributes === 'object' && attributes !== null ? attributes : {},
      keywords: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map((k) => k.trim()) : []),
      multilingual: multilingual || { title: { en: '', hi: '' }, description: { en: '', hi: '' } },
      aiMetadata: aiMetadata || {},
      enhancedImages: Array.isArray(enhancedImages) ? enhancedImages : [],
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('sellerId', 'businessName sellerType verificationStatus city logo coordinates')
      .populate('categoryId', 'name slug icon');

    res.status(201).json({
      success: true,
      message: 'Product added successfully.',
      product: populatedProduct
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all products with filtering, search, and distance sorting
// @route   GET /api/products
// @access  Public
export const listProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      sellerType,
      minPrice,
      maxPrice,
      stockStatus,
      availability,
      lat,
      lng,
      maxDistanceKm,
      sort = 'newest',
      page = 1,
      limit = 24
    } = req.query;

    // Filter approved and active sellers first
    const sellerFilter = { verificationStatus: { $in: ['APPROVED', 'VERIFIED'] }, isOpen: true };
    if (sellerType) {
      sellerFilter.sellerType = sellerType;
    }
    const approvedSellers = await SellerProfile.find(sellerFilter).select('_id coordinates');
    const approvedSellerIds = approvedSellers.map((s) => s._id);

    // Build Product Query
    const query = {
      sellerId: { $in: approvedSellerIds },
      isPublished: true,
      isActive: true
    };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        query.categoryId = cat._id;
      }
    }

    if (stockStatus) {
      query.stockStatus = stockStatus;
    }

    if (availability !== undefined) {
      query.availability = availability === 'true' || availability === true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search && search.trim() !== '') {
      const sRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: sRegex },
        { description: sRegex },
        { tags: { $in: [sRegex] } },
        { keywords: { $in: [sRegex] } },
        { features: { $in: [sRegex] } },
        { 'multilingual.title.hi': sRegex },
        { 'multilingual.description.hi': sRegex }
      ];
    }

    let products = await Product.find(query)
      .populate('sellerId', 'businessName sellerType verificationStatus city state coordinates logo')
      .populate('categoryId', 'name slug icon image')
      .lean();

    // Attach distanceKm if user coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      products = products.map((p) => {
        if (p.sellerId?.coordinates?.lat && p.sellerId?.coordinates?.lng) {
          p.distanceKm = calculateDistanceKm(
            userLat,
            userLng,
            p.sellerId.coordinates.lat,
            p.sellerId.coordinates.lng
          );
        } else {
          p.distanceKm = null;
        }
        return p;
      });

      // Filter by maxDistanceKm if specified
      if (maxDistanceKm) {
        const maxDist = parseFloat(maxDistanceKm);
        products = products.filter((p) => p.distanceKm !== null && p.distanceKm <= maxDist);
      }
    }

    // Sorting logic
    if (sort === 'distance' && lat && lng) {
      products.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sort === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'popular') {
      products.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      // Default: newest
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 24;
    const totalCount = products.length;
    const paginatedProducts = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      count: paginatedProducts.length,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      products: paginatedProducts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product details by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'businessName sellerType verificationStatus city state address phone coordinates businessHours logo coverImage isOpen')
      .populate('categoryId', 'name slug icon image');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or has been removed.'
      });
    }

    // Increment views count asynchronously
    Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec();

    const productObj = product.toObject();

    // Distance calculation if user coords provided
    const { lat, lng } = req.query;
    if (lat && lng && product.sellerId?.coordinates?.lat && product.sellerId?.coordinates?.lng) {
      productObj.distanceKm = calculateDistanceKm(
        parseFloat(lat),
        parseFloat(lng),
        product.sellerId.coordinates.lat,
        product.sellerId.coordinates.lng
      );
    }

    // Check if the current user is a seller who can resell this product
    productObj.canResell = false;
    if (req.user && req.user.role === 'SELLER' && req.sellerProfile) {
      const isOwner = product.sellerId._id.toString() === req.sellerProfile._id.toString();
      productObj.isOwnProduct = isOwner;
      productObj.canResell = !isOwner;
    }

    res.json({
      success: true,
      product: productObj
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current seller's own products
// @route   GET /api/products/my-catalogue
// @access  Private (Seller only)
export const getMyProducts = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const products = await Product.find({ sellerId: req.sellerProfile._id })
      .populate('categoryId', 'name slug icon')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product (Seller ownership check strictly enforced)
// @route   PUT /api/products/:id
// @access  Private (Seller only)
export const updateProduct = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // STRICT RESOURCE OWNERSHIP CHECK
    if (product.sellerId.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to modify another seller’s product.'
      });
    }

    const {
      name,
      description,
      categoryId,
      images,
      price,
      discountPrice,
      availability,
      stockStatus,
      tags,
      features,
      attributes,
      keywords,
      multilingual,
      aiMetadata,
      enhancedImages,
      isPublished
    } = req.body;

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (categoryId) product.categoryId = categoryId;
    if (images && Array.isArray(images)) product.images = images;
    if (price !== undefined) product.price = parseFloat(price);
    if (discountPrice !== undefined) product.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
    if (availability !== undefined) product.availability = Boolean(availability);
    if (stockStatus) product.stockStatus = stockStatus;
    if (tags && Array.isArray(tags)) product.tags = tags;
    if (features && Array.isArray(features)) product.features = features;
    if (attributes && typeof attributes === 'object') product.attributes = attributes;
    if (keywords && Array.isArray(keywords)) product.keywords = keywords;
    if (multilingual) product.multilingual = multilingual;
    if (aiMetadata) product.aiMetadata = { ...product.aiMetadata, ...aiMetadata };
    if (enhancedImages && Array.isArray(enhancedImages)) product.enhancedImages = enhancedImages;
    if (isPublished !== undefined) product.isPublished = Boolean(isPublished);

    await product.save();

    const updatedProduct = await Product.findById(product._id)
      .populate('sellerId', 'businessName sellerType')
      .populate('categoryId', 'name slug icon');

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product: updatedProduct
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle product publish state (ownership enforced)
// @route   PATCH /api/products/:id/publish
// @access  Private (Seller only)
export const togglePublish = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // STRICT RESOURCE OWNERSHIP CHECK
    if (product.sellerId.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot alter publication of products you do not own.'
      });
    }

    product.isPublished = !product.isPublished;
    await product.save();

    res.json({
      success: true,
      message: `Product is now ${product.isPublished ? 'published' : 'hidden'}.`,
      isPublished: product.isPublished
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product (ownership enforced)
// @route   DELETE /api/products/:id
// @access  Private (Seller only)
export const deleteProduct = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // STRICT RESOURCE OWNERSHIP CHECK
    if (product.sellerId.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot delete products created by another seller.'
      });
    }

    // Clean up or deactivate any reseller listings referencing this source product
    await ResellerListing.updateMany(
      { sourceProductId: product._id },
      { isActive: false, isPublished: false }
    );

    await Product.findByIdAndDelete(product._id);

    res.json({
      success: true,
      message: 'Product removed from your catalogue.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload product or profile image
// @route   POST /api/products/upload
// @access  Private (Customer or Seller)
export const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded.'
    });
  }

  // Construct accessible URL
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Image uploaded successfully.',
    url: fileUrl
  });
};
