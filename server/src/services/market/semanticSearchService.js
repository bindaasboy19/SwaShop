/**
 * SwaShop Phase 3: Semantic Search Abstraction Layer
 * Understands buyer search intent, expands synonyms, and maps to catalog concepts.
 */

const SEMANTIC_INTENT_MAP = {
  'corporate gift': {
    categories: ['Handicrafts & Bamboo', 'Handloom & Textiles', 'Gifts & Home Decor'],
    keywords: ['gift', 'bamboo', 'pen stand', 'planner', 'organizer', 'box', 'tray', 'brass', 'handcrafted']
  },
  'eco friendly': {
    categories: ['Handicrafts & Bamboo', 'Organic & Spices', 'Pottery & Clayware'],
    keywords: ['bamboo', 'jute', 'natural', 'clay', 'terracotta', 'organic', 'biodegradable', 'sustainable']
  },
  'sustainable': {
    categories: ['Handicrafts & Bamboo', 'Organic & Spices', 'Pottery & Clayware'],
    keywords: ['bamboo', 'earthen', 'organic', 'handmade', 'pure', 'natural']
  },
  'home decor': {
    categories: ['Handicrafts & Bamboo', 'Pottery & Clayware', 'Handloom & Textiles'],
    keywords: ['basket', 'vase', 'pot', 'cushion', 'runner', 'wall hanging', 'planter', 'mat']
  },
  'festive': {
    categories: ['Pottery & Clayware', 'Handicrafts & Bamboo', 'Handloom & Textiles'],
    keywords: ['diya', 'lamp', 'thali', 'brass', 'silk', 'decor', 'gift box']
  },
  'wellness': {
    categories: ['Organic & Spices'],
    keywords: ['honey', 'ayurveda', 'oil', 'turmeric', 'herbal', 'tea', 'spices']
  },
  'kitchen': {
    categories: ['Pottery & Clayware', 'Handicrafts & Bamboo'],
    keywords: ['clay pot', 'pan', 'wooden spoon', 'tray', 'matka', 'curd pot']
  }
};

/**
 * Expands a natural language search query into semantic concepts and keywords.
 */
export const expandSemanticQuery = (query = '') => {
  const normalized = (query || '').toLowerCase().trim();
  if (!normalized) {
    return {
      originalQuery: '',
      expandedKeywords: [],
      suggestedCategories: [],
      isSemantic: false
    };
  }

  const expandedKeywords = new Set();
  const suggestedCategories = new Set();
  let isSemantic = false;

  // Check intent map matches
  for (const [intentKey, data] of Object.entries(SEMANTIC_INTENT_MAP)) {
    if (normalized.includes(intentKey) || intentKey.includes(normalized)) {
      isSemantic = true;
      data.keywords.forEach((k) => expandedKeywords.add(k));
      data.categories.forEach((c) => suggestedCategories.add(c));
    }
  }

  // Tokenize
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 2);
  tokens.forEach((token) => {
    for (const [intentKey, data] of Object.entries(SEMANTIC_INTENT_MAP)) {
      if (intentKey.includes(token)) {
        data.keywords.forEach((k) => expandedKeywords.add(k));
        data.categories.forEach((c) => suggestedCategories.add(c));
      }
    }
  });

  return {
    originalQuery: query,
    tokens,
    expandedKeywords: Array.from(expandedKeywords),
    suggestedCategories: Array.from(suggestedCategories),
    isSemantic
  };
};

/**
 * Computes semantic similarity score (0.0 to 1.0) between product metadata and query
 */
export const computeSemanticRelevance = (product, semanticContext) => {
  if (!semanticContext || !semanticContext.isSemantic) return 0.5;

  let matches = 0;
  const targetText = [
    product.name,
    product.description,
    product.categoryId?.name,
    ...(product.tags || []),
    ...(product.keywords || []),
    ...(product.features || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  semanticContext.expandedKeywords.forEach((kw) => {
    if (targetText.includes(kw.toLowerCase())) matches++;
  });

  semanticContext.suggestedCategories.forEach((cat) => {
    if (targetText.includes(cat.toLowerCase())) matches += 2;
  });

  const maxExpected = Math.max(4, semanticContext.expandedKeywords.length + 2);
  return Math.min(1.0, matches / maxExpected);
};
