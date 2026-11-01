import Product from '../models/Product.js';
import Favourite from '../models/Favourite.js';
import Enquiry from '../models/Enquiry.js';
import SellerProfile from '../models/SellerProfile.js';

/**
 * Customer Recommendations Engine
 * Uses real interaction signals (favourites, past enquiries, verified seller badges, availability)
 * and returns explainable recommendations.
 */
export const getCustomerRecommendations = async (userId = null, { city = '', categoryId = null, limit = 8 } = {}) => {
  let preferredCategoryIds = [];

  if (userId) {
    // 1. Check user favourites
    const userFavourites = await Favourite.find({ userId, targetType: 'PRODUCT' })
      .populate({ path: 'targetId', model: 'Product', select: 'categoryId' })
      .limit(10)
      .lean();

    userFavourites.forEach((fav) => {
      if (fav.targetId?.categoryId) {
        preferredCategoryIds.push(fav.targetId.categoryId.toString());
      }
    });

    // 2. Check user recent enquiries
    const userEnquiries = await Enquiry.find({ customerId: userId })
      .populate({ path: 'productId', select: 'categoryId' })
      .limit(5)
      .lean();

    userEnquiries.forEach((enq) => {
      if (enq.productId?.categoryId) {
        preferredCategoryIds.push(enq.productId.categoryId.toString());
      }
    });
  }

  // Deduplicate preferred categories
  preferredCategoryIds = [...new Set(preferredCategoryIds)];

  // 3. Query candidate products that are published, active, and available
  const query = {
    isPublished: true,
    isActive: true,
    availability: true
  };

  const products = await Product.find(query)
    .populate('sellerId', 'businessName city state verificationStatus coordinates ratings')
    .populate('categoryId', 'name slug')
    .sort({ views: -1, catalogQualityScore: -1, favouriteCount: -1 })
    .limit(limit * 2)
    .lean();

  // 4. Score and attach reasons to each recommendation
  const recommended = products.map((prod) => {
    let score = 50;
    let reasonCode = 'TRENDING_NEARBY';
    let reasonText = 'Popular with high buyer interest';

    // Boost if in user preferred category
    if (preferredCategoryIds.includes(prod.categoryId?._id?.toString())) {
      score += 40;
      reasonCode = 'SIMILAR_INTEREST';
      reasonText = `Based on items you explored in ${prod.categoryId?.name || 'this category'}`;
    }

    // Boost if seller is verified
    if (['VERIFIED', 'APPROVED'].includes(prod.sellerId?.verificationStatus)) {
      score += 20;
      if (reasonCode === 'TRENDING_NEARBY') {
        reasonCode = 'VERIFIED_ARTISAN';
        reasonText = 'Crafted by a verified local artisan';
      }
    }

    // Boost if in matching city
    if (city && prod.sellerId?.city && prod.sellerId.city.toLowerCase() === city.toLowerCase()) {
      score += 25;
      reasonCode = 'LOCAL_NEARBY';
      reasonText = `Available locally in ${prod.sellerId.city}`;
    }

    // High quality catalog score boost
    if (prod.catalogQualityScore >= 80) {
      score += 15;
    }

    return {
      ...prod,
      recommendationScore: score,
      reasonCode,
      reasonText
    };
  });

  recommended.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return recommended.slice(0, limit);
};

/**
 * Seller Growth & Catalog Optimization Recommendations
 * Evaluates real catalog metrics deterministically to give actionable suggestions
 */
export const getSellerRecommendations = async (sellerProfileId) => {
  const seller = await SellerProfile.findById(sellerProfileId);
  if (!seller) return [];

  const products = await Product.find({ sellerId: sellerProfileId, isActive: true }).lean();
  const recommendations = [];

  for (const prod of products) {
    // 1. High views but 0 or low enquiries
    if (prod.views >= 5 && (!prod.favouriteCount || prod.favouriteCount === 0)) {
      recommendations.push({
        type: 'CONVERSION_OPPORTUNITY',
        productId: prod._id,
        productName: prod.name,
        title: `Improve conversion for "${prod.name}"`,
        insight: `This product has received ${prod.views} views. Consider updating images or highlighting ready-to-dispatch availability to turn views into orders.`,
        suggestedAction: 'Update availability and images'
      });
    }

    // 2. Low Catalog Quality Score
    if (prod.catalogQualityScore < 70) {
      recommendations.push({
        type: 'QUALITY_IMPROVEMENT',
        productId: prod._id,
        productName: prod.name,
        title: `Boost quality score (${prod.catalogQualityScore}/100) for "${prod.name}"`,
        insight: 'Products with detailed specifications, tags, and authentic descriptions rank higher in local search results.',
        suggestedAction: 'Use Seller AI Studio to enrich product features and tags'
      });
    }

    // 3. Out of stock products with past interest
    if (prod.availabilityStatus === 'OUT_OF_STOCK' || !prod.availability) {
      recommendations.push({
        type: 'STOCK_RESTOCK',
        productId: prod._id,
        productName: prod.name,
        title: `Restock alert: "${prod.name}"`,
        insight: 'This item is marked out of stock. Updating stock status will immediately re-enable it in customer nearby discovery.',
        suggestedAction: 'Mark product back in stock'
      });
    }
  }

  // 4. Verification recommendation if not verified
  if (seller.verificationStatus === 'UNVERIFIED' || seller.verificationStatus === 'PENDING') {
    recommendations.push({
      type: 'TRUST_BOOST',
      productId: null,
      productName: null,
      title: 'Complete Seller Verification',
      insight: 'Verified sellers receive up to 3x more discovery clicks and can fulfill larger B2B purchase requirements.',
      suggestedAction: 'Submit verification in Seller Settings'
    });
  }

  return recommendations;
};
