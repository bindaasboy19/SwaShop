import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';
import Category from '../models/Category.js';
import { calculateDistanceKm } from './sellerController.js';
import { rankProducts, calculateHaversineDistance } from '../services/market/rankingService.js';
import { expandSemanticQuery, computeSemanticRelevance } from '../services/market/semanticSearchService.js';
import { recordSearchDemand } from '../services/market/demandService.js';
import { trackEvent } from '../services/market/analyticsService.js';

// Valid approved seller statuses
const APPROVED_STATUSES = ['APPROVED', 'VERIFIED'];

// @desc    Main search across products, sellers, and categories with multi-factor ranking & semantic intent
// @route   GET /api/search
// @access  Public
export const searchAll = async (req, res, next) => {
  try {
    const {
      q,
      category,
      sellerType,
      minPrice,
      maxPrice,
      lat,
      lng,
      radiusKm,
      availability,
      verifiedOnly,
      b2bOnly,
      city,
      sort = 'relevance',
      page = 1,
      limit = 30
    } = req.query;

    const cleanQ = (q || '').trim();
    const uLat = lat ? parseFloat(lat) : null;
    const uLng = lng ? parseFloat(lng) : null;
    const maxRadius = radiusKm ? parseFloat(radiusKm) : null;

    // 1. Semantic query expansion
    const semanticContext = expandSemanticQuery(cleanQ);

    // Build seller filter
    const sellerQuery = {
      verificationStatus: verifiedOnly === 'true' ? { $in: ['VERIFIED', 'APPROVED'] } : { $in: APPROVED_STATUSES }
    };

    if (sellerType) {
      sellerQuery.sellerType = sellerType;
    }
    if (city) {
      sellerQuery.city = new RegExp(city.trim(), 'i');
    }
    if (b2bOnly === 'true') {
      sellerQuery['b2bProfile.bulkAvailable'] = true;
    }

    // Find eligible sellers
    let eligibleSellers = await SellerProfile.find(sellerQuery)
      .populate('userId', 'name avatar')
      .lean();

    // Distance filtering on sellers if coordinates and radius provided
    if (uLat !== null && uLng !== null) {
      eligibleSellers = eligibleSellers.map((s) => {
        if (s.coordinates?.lat && s.coordinates?.lng) {
          s.distanceKm = calculateHaversineDistance(uLat, uLng, s.coordinates.lat, s.coordinates.lng);
        } else {
          s.distanceKm = null;
        }
        return s;
      });

      if (maxRadius) {
        eligibleSellers = eligibleSellers.filter((s) => s.distanceKm !== null && s.distanceKm <= maxRadius);
      }
    }

    const sellerIds = eligibleSellers.map((s) => s._id);

    // Build product filter
    const productQuery = {
      sellerId: { $in: sellerIds },
      isPublished: true,
      isActive: true
    };

    // Category filter
    let matchedCategoryDoc = null;
    if (category) {
      matchedCategoryDoc = await Category.findOne({ slug: category });
      if (matchedCategoryDoc) {
        productQuery.categoryId = matchedCategoryDoc._id;
      }
    }

    // Availability filter
    if (availability && availability !== 'ALL') {
      productQuery.$or = [
        { availabilityStatus: availability },
        { stockStatus: availability }
      ];
    }

    // Price range
    if (minPrice || maxPrice) {
      productQuery.price = {};
      if (minPrice) productQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) productQuery.price.$lte = parseFloat(maxPrice);
    }

    // B2B Only product flag
    if (b2bOnly === 'true') {
      productQuery['b2b.enabled'] = true;
    }

    // Query matching
    if (cleanQ) {
      const regex = new RegExp(cleanQ, 'i');
      const searchConditions = [
        { name: regex },
        { description: regex },
        { tags: { $in: [regex] } },
        { keywords: { $in: [regex] } },
        { features: { $in: [regex] } },
        { 'multilingual.title.hi': regex },
        { 'multilingual.description.hi': regex }
      ];

      // Add semantic keywords if present
      if (semanticContext.isSemantic && semanticContext.expandedKeywords.length > 0) {
        semanticContext.expandedKeywords.forEach((kw) => {
          const kwRegex = new RegExp(kw, 'i');
          searchConditions.push({ tags: { $in: [kwRegex] } });
          searchConditions.push({ keywords: { $in: [kwRegex] } });
          searchConditions.push({ name: kwRegex });
        });
      }

      productQuery.$or = searchConditions;
    }

    // Fetch candidate products
    let products = await Product.find(productQuery)
      .populate('sellerId', 'businessName sellerType city state coordinates logo verificationStatus b2bProfile isOpen')
      .populate('categoryId', 'name slug icon')
      .lean();

    // Attach semantic similarity scores
    if (cleanQ && semanticContext.isSemantic) {
      products = products.map((p) => ({
        ...p,
        semanticScore: computeSemanticRelevance(p, semanticContext)
      }));
    }

    // Rank products with centralized ranking engine
    if (sort === 'relevance' || !sort) {
      products = rankProducts(products, {
        query: cleanQ,
        userLat: uLat,
        userLng: uLng,
        category: matchedCategoryDoc?.name
      });
    } else if (sort === 'distance' && uLat !== null && uLng !== null) {
      products = products
        .map((p) => {
          const s = p.sellerId;
          const dist = (s?.coordinates?.lat && s?.coordinates?.lng)
            ? calculateHaversineDistance(uLat, uLng, s.coordinates.lat, s.coordinates.lng)
            : null;
          return { ...p, distanceKm: dist };
        })
        .sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
    } else if (sort === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    }

    // Matching sellers list
    let matchedSellers = eligibleSellers;
    if (cleanQ) {
      const qRegex = new RegExp(cleanQ, 'i');
      matchedSellers = eligibleSellers.filter((s) =>
        qRegex.test(s.businessName) ||
        qRegex.test(s.description) ||
        qRegex.test(s.category) ||
        qRegex.test(s.city)
      );
    }

    // Related categories
    let relatedCategories = [];
    if (cleanQ) {
      const catRegex = new RegExp(cleanQ, 'i');
      relatedCategories = await Category.find({
        isActive: true,
        $or: [{ name: catRegex }, { description: catRegex }]
      }).limit(5);
    }

    // Asynchronously log search demand event
    if (cleanQ) {
      recordSearchDemand({
        query: cleanQ,
        category: matchedCategoryDoc?.name || '',
        city: city || '',
        resultsCount: products.length,
        userId: req.user?._id || null,
        searchType: semanticContext.isSemantic ? 'SEMANTIC' : 'KEYWORD'
      });

      // Track search impression events for top products
      products.slice(0, 10).forEach((p) => {
        trackEvent({
          eventType: 'PRODUCT_SEARCH_IMPRESSION',
          sellerId: p.sellerId?._id || p.sellerId,
          productId: p._id,
          source: 'SEARCH',
          metadata: { query: cleanQ }
        });
      });
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 30;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = products.slice(startIndex, startIndex + limitNum);

    // Zero result suggestions & B2B Bridge
    const zeroResultsHelp = products.length === 0 ? {
      suggestedCategories: (await Category.find({ isActive: true }).limit(4)).map((c) => ({
        name: c.name,
        slug: c.slug
      })),
      b2bBridge: {
        canPostRequirement: true,
        suggestedTitle: cleanQ ? `Looking for ${cleanQ}` : '',
        message: 'No exact matches found nearby. Need custom quantities or bulk procurement? Post a B2B requirement to receive direct quotes from verified local artisans & makers.'
      }
    } : null;

    res.json({
      success: true,
      query: cleanQ,
      isSemantic: semanticContext.isSemantic,
      resultsCount: {
        products: products.length,
        sellers: matchedSellers.length,
        categories: relatedCategories.length
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(products.length / limitNum) || 1
      },
      products: paginatedProducts,
      sellers: matchedSellers.slice(0, 8),
      categories: relatedCategories,
      zeroResultsHelp
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Fast search suggestions as user types
// @route   GET /api/search/suggestions
// @access  Public
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const cleanQ = q.trim();
    const regex = new RegExp(cleanQ, 'i');

    const [products, categories, sellers] = await Promise.all([
      Product.find({ name: regex, isPublished: true, isActive: true })
        .select('name price')
        .limit(5)
        .lean(),
      Category.find({ name: regex, isActive: true })
        .select('name slug')
        .limit(3)
        .lean(),
      SellerProfile.find({
        businessName: regex,
        verificationStatus: { $in: APPROVED_STATUSES }
      })
        .select('businessName sellerType city')
        .limit(3)
        .lean()
    ]);

    const suggestions = [
      ...products.map((p) => ({ type: 'PRODUCT', text: p.name, id: p._id, price: p.price })),
      ...categories.map((c) => ({ type: 'CATEGORY', text: c.name, slug: c.slug })),
      ...sellers.map((s) => ({ type: 'SELLER', text: s.businessName, id: s._id, subtitle: `${s.sellerType} • ${s.city}` }))
    ];

    res.json({
      success: true,
      query: cleanQ,
      suggestions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Nearby discovery: Find nearby shops & products with radius querying
// @route   GET /api/search/nearby
// @access  Public
export const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 50, category, sellerType, availability, verifiedOnly } = req.query;

    if (!lat || !lng) {
      const fallbackSellers = await SellerProfile.find({
        verificationStatus: { $in: APPROVED_STATUSES },
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
        .populate('sellerId', 'businessName sellerType city logo verificationStatus')
        .populate('categoryId', 'name slug icon')
        .limit(20)
        .lean();

      return res.json({
        success: true,
        locationProvided: false,
        message: 'Location coordinates not provided. Showing featured local marketplace items.',
        sellers: fallbackSellers.map((s) => ({ ...s, distanceKm: null })),
        products: fallbackProducts.map((p) => ({ ...p, distanceKm: null }))
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radiusKm) || 50;

    const sellerFilter = {
      verificationStatus: verifiedOnly === 'true' ? { $in: ['VERIFIED', 'APPROVED'] } : { $in: APPROVED_STATUSES }
    };
    if (sellerType) {
      sellerFilter.sellerType = sellerType;
    }

    const allApprovedSellers = await SellerProfile.find(sellerFilter).lean();

    const nearbySellers = [];
    const nearbySellerIds = [];

    for (const seller of allApprovedSellers) {
      if (seller.coordinates?.lat && seller.coordinates?.lng) {
        const dist = calculateHaversineDistance(
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

    nearbySellers.sort((a, b) => a.distanceKm - b.distanceKm);

    const productQuery = {
      sellerId: { $in: nearbySellerIds },
      isPublished: true,
      isActive: true
    };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) productQuery.categoryId = cat._id;
    }

    if (availability && availability !== 'ALL') {
      productQuery.$or = [
        { availabilityStatus: availability },
        { stockStatus: availability }
      ];
    }

    let nearbyProducts = await Product.find(productQuery)
      .populate('sellerId', 'businessName sellerType city state coordinates logo verificationStatus')
      .populate('categoryId', 'name slug icon')
      .lean();

    nearbyProducts = nearbyProducts.map((p) => {
      const seller = nearbySellers.find(
        (s) => s._id.toString() === p.sellerId?._id?.toString()
      );
      return {
        ...p,
        distanceKm: seller ? seller.distanceKm : null
      };
    });

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
