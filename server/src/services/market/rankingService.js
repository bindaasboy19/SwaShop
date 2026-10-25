/**
 * SwaShop Phase 3: Centralized Search Ranking Engine
 * Computes deterministic multi-factor relevance scores for products & sellers.
 */

export const SEARCH_WEIGHTS = {
  textRelevance: 30,
  semanticRelevance: 20,
  location: 20,
  availability: 15,
  verification: 10,
  popularity: 5
};

/**
 * Calculates distance in kilometers between two geo coordinates using Haversine formula
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Ranks and scores a list of products based on query, location, availability, and trust signals.
 */
export const rankProducts = (products, options = {}) => {
  const {
    query = '',
    userLat = null,
    userLng = null,
    category = null,
    weights = SEARCH_WEIGHTS
  } = options;

  const normalizedQuery = (query || '').toLowerCase().trim();
  const queryTokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

  return products
    .map((product) => {
      let textScore = 0;
      let semanticScore = 0;
      let locationScore = 0;
      let availabilityScore = 0;
      let verificationScore = 0;
      let popularityScore = 0;

      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();
      const tags = (product.tags || []).map((t) => (t || '').toLowerCase());
      const keywords = (product.keywords || []).map((k) => (k || '').toLowerCase());
      const categoryName = (product.categoryId?.name || '').toLowerCase();
      const seller = product.sellerId || {};

      // 1. Text Relevance (0 - 100)
      if (queryTokens.length > 0) {
        if (productName === normalizedQuery) {
          textScore = 100;
        } else if (productName.includes(normalizedQuery)) {
          textScore = 80;
        } else {
          let tokenMatches = 0;
          queryTokens.forEach((token) => {
            if (productName.includes(token)) tokenMatches += 3;
            else if (tags.some((t) => t.includes(token))) tokenMatches += 2;
            else if (keywords.some((k) => k.includes(token))) tokenMatches += 2;
            else if (categoryName.includes(token)) tokenMatches += 2;
            else if (productDesc.includes(token)) tokenMatches += 1;
          });
          textScore = Math.min(100, (tokenMatches / (queryTokens.length * 3)) * 100);
        }
      } else {
        textScore = 70; // baseline if no query filter
      }

      // 2. Semantic Relevance (0 - 100)
      if (product.semanticScore !== undefined && product.semanticScore !== null) {
        semanticScore = Math.min(100, Math.max(0, product.semanticScore * 100));
      } else {
        // Fallback: check matching intent terms
        const intentMatches = tags.concat(keywords).filter((k) =>
          queryTokens.some((qt) => k.includes(qt) || qt.includes(k))
        );
        semanticScore = intentMatches.length > 0 ? Math.min(100, intentMatches.length * 25) : 50;
      }

      // 3. Location Proximity (0 - 100)
      let distanceKm = null;
      if (userLat !== null && userLng !== null && seller.coordinates?.lat && seller.coordinates?.lng) {
        distanceKm = calculateHaversineDistance(
          userLat,
          userLng,
          seller.coordinates.lat,
          seller.coordinates.lng
        );
        if (distanceKm <= 5) locationScore = 100;
        else if (distanceKm <= 10) locationScore = 80;
        else if (distanceKm <= 25) locationScore = 60;
        else if (distanceKm <= 50) locationScore = 40;
        else locationScore = 20;
      } else {
        locationScore = 50; // neutral if location is not provided
      }

      // 4. Availability Score (0 - 100)
      const stock = product.availabilityStatus || product.stockStatus || 'AVAILABLE';
      if (stock === 'AVAILABLE' && product.availability !== false) {
        availabilityScore = 100;
      } else if (stock === 'LOW_STOCK') {
        availabilityScore = 60;
      } else {
        availabilityScore = 10;
      }

      // Freshness bonus: if updated in the last 7 days
      if (product.availabilityUpdatedAt) {
        const daysOld = (Date.now() - new Date(product.availabilityUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 2) availabilityScore = Math.min(100, availabilityScore + 10);
      }

      // 5. Seller Verification (0 - 100)
      const verStatus = seller.verificationStatus;
      if (verStatus === 'VERIFIED' || verStatus === 'APPROVED') {
        verificationScore = 100;
      } else if (verStatus === 'PENDING') {
        verificationScore = 50;
      } else {
        verificationScore = 30;
      }

      // 6. Popularity & Engagement (0 - 100)
      const views = product.views || 0;
      const favs = product.favouriteCount || 0;
      const qualityScore = product.catalogQualityScore || 50;
      popularityScore = Math.min(100, Math.round((views * 0.4) + (favs * 5) + (qualityScore * 0.4)));

      // Compute Total Weighted Composite Score
      const totalWeight =
        weights.textRelevance +
        weights.semanticRelevance +
        weights.location +
        weights.availability +
        weights.verification +
        weights.popularity;

      const compositeScore = Math.round(
        (textScore * weights.textRelevance +
          semanticScore * weights.semanticRelevance +
          locationScore * weights.location +
          availabilityScore * weights.availability +
          verificationScore * weights.verification +
          popularityScore * weights.popularity) /
          totalWeight
      );

      return {
        ...product,
        distanceKm,
        searchRelevanceScore: compositeScore,
        rankingDetails: {
          compositeScore,
          textScore,
          semanticScore,
          locationScore,
          availabilityScore,
          verificationScore,
          popularityScore
        }
      };
    })
    .sort((a, b) => b.rankingDetails.compositeScore - a.rankingDetails.compositeScore);
};
