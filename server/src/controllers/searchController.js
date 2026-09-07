import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';
import Category from '../models/Category.js';
import { calculateDistanceKm } from './sellerController.js';

// @desc    Main search across products, sellers, and categories
// @route   GET /api/search
// @access  Public
export const searchAll = async (req, res, next) => {
  try {
    const { q, category, sellerType, minPrice, maxPrice, lat, lng, sort = 'relevance' } = req.query;

    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        products: [],
        sellers: [],
        categories: []
      });
    }

    const cleanQ = q.trim();
    const regex = new RegExp(cleanQ, 'i');

    // 1. Search matching categories
    const categories = await Category.find({
      isActive: true,
      $or: [{ name: regex }, { description: regex }, { slug: regex }]
    }).limit(6);

    // 2. Search approved sellers
    const sellerQuery = {
      verificationStatus: 'APPROVED',
      $or: [
        { businessName: regex },
        { description: regex },
        { category: regex },
        { city: regex }
      ]
    };
    if (sellerType) {
      sellerQuery.sellerType = sellerType;
    }

    let sellers = await SellerProfile.find(sellerQuery)
      .populate('userId', 'name avatar')
      .limit(12)
      .lean();

    // 3. Search products
    const approvedSellers = await SellerProfile.find({ verificationStatus: 'APPROVED' }).select('_id coordinates');
    const approvedSellerIds = approvedSellers.map((s) => s._id);

    const productQuery = {
      sellerId: { $in: approvedSellerIds },
      isPublished: true,
      isActive: true,
      $or: [
        { name: regex },
        { description: regex },
        { tags: { $in: [regex] } }
      ]
    };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) productQuery.categoryId = cat._id;
    }

    if (minPrice || maxPrice) {
      productQuery.price = {};
      if (minPrice) productQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) productQuery.price.$lte = parseFloat(maxPrice);
    }

    let products = await Product.find(productQuery)
      .populate('sellerId', 'businessName sellerType city state coordinates logo')
      .populate('categoryId', 'name slug icon')
      .limit(30)
      .lean();

    // Attach distance if coordinates provided
    if (lat && lng) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);

      sellers = sellers.map((s) => {
        if (s.coordinates?.lat && s.coordinates?.lng) {
          s.distanceKm = calculateDistanceKm(uLat, uLng, s.coordinates.lat, s.coordinates.lng);
        } else {
          s.distanceKm = null;
        }
        return s;
      });

      products = products.map((p) => {
        if (p.sellerId?.coordinates?.lat && p.sellerId?.coordinates?.lng) {
          p.distanceKm = calculateDistanceKm(uLat, uLng, p.sellerId.coordinates.lat, p.sellerId.coordinates.lng);
        } else {
          p.distanceKm = null;
        }
        return p;
      });

      if (sort === 'distance') {
        products.sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
        sellers.sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      }
    }

    if (sort === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    }

    res.json({
      success: true,
      query: cleanQ,
      resultsCount: {
        products: products.length,
        sellers: sellers.length,
        categories: categories.length
      },
      products,
      sellers,
      categories
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Nearby discovery: Find nearby shops & products
// @route   GET /api/search/nearby
// @access  Public
export const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 50, category, sellerType } = req.query;

    // Graceful fallback if coordinates are missing/denied
    if (!lat || !lng) {
      // Return popular approved shops and products with flag indicating no location
      const fallbackSellers = await SellerProfile.find({
        verificationStatus: 'APPROVED',
        isOpen: true
      })
        .limit(10)
        .lean();

      const sellerIds = fallbackSellers.map((s) => s._id);
      const fallbackProducts = await Product.find({
        sellerId: { $in: sellerIds },
        isPublished: true,
        isActive: true
      })
        .populate('sellerId', 'businessName sellerType city logo')
        .populate('categoryId', 'name slug icon')
        .limit(20)
        .lean();

      return res.json({
        success: true,
        locationProvided: false,
        message: 'Location not provided. Showing featured local marketplace items.',
        sellers: fallbackSellers.map((s) => ({ ...s, distanceKm: null })),
        products: fallbackProducts.map((p) => ({ ...p, distanceKm: null }))
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radiusKm) || 50;

    const sellerFilter = {
      verificationStatus: 'APPROVED'
    };
    if (sellerType) {
      sellerFilter.sellerType = sellerType;
    }

    const allApprovedSellers = await SellerProfile.find(sellerFilter).lean();

    // Calculate distance for each seller and filter within radius
    const nearbySellers = [];
    const nearbySellerIds = [];

    for (const seller of allApprovedSellers) {
      if (seller.coordinates?.lat && seller.coordinates?.lng) {
        const dist = calculateDistanceKm(
          userLat,
          userLng,
          seller.coordinates.lat,
          seller.coordinates.lng
        );
        if (dist !== null && dist <= maxRadius) {
          nearbySellers.push({
            ...seller,
            distanceKm: dist
          });
          nearbySellerIds.push(seller._id);
        }
      }
    }

    // Sort sellers by distance
    nearbySellers.sort((a, b) => a.distanceKm - b.distanceKm);

    // Retrieve products from these nearby sellers
    const productQuery = {
      sellerId: { $in: nearbySellerIds },
      isPublished: true,
      isActive: true
    };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) productQuery.categoryId = cat._id;
    }

    let nearbyProducts = await Product.find(productQuery)
      .populate('sellerId', 'businessName sellerType city state coordinates logo')
      .populate('categoryId', 'name slug icon')
      .lean();

    // Attach distance to products
    nearbyProducts = nearbyProducts.map((p) => {
      const seller = nearbySellers.find(
        (s) => s._id.toString() === p.sellerId._id.toString()
      );
      return {
        ...p,
        distanceKm: seller ? seller.distanceKm : null
      };
    });

    // Sort products by distance
    nearbyProducts.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    res.json({
      success: true,
      locationProvided: true,
      userCoordinates: { lat: userLat, lng: userLng },
      radiusKm: maxRadius,
      sellersCount: nearbySellers.length,
      productsCount: nearbyProducts.length,
      sellers: nearbySellers,
      products: nearbyProducts
    });
  } catch (err) {
    next(err);
  }
};
