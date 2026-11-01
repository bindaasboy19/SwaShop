/**
 * SwaShop Phase 4: Advanced Semantic & Multilingual Search Abstraction Layer
 * Understands natural language buyer intent (budget, context, quantity, nearby),
 * bridges multilingual queries (Hindi <-> English), expands synonyms, and maps to catalog concepts.
 */

const MULTILINGUAL_EQUIVALENTS = {
  // Hindi to English keywords
  'बाँस': ['bamboo'],
  'बांस': ['bamboo'],
  'टोकरी': ['basket'],
  'मिट्टी': ['clay', 'terracotta', 'pottery', 'earthen'],
  'उपहार': ['gift', 'present', 'hampers'],
  'तोहफा': ['gift'],
  'गिफ्ट': ['gift'],
  'हस्तशिल्प': ['handicrafts', 'artisan', 'craft'],
  'हस्तनिर्मित': ['handmade', 'handcrafted'],
  'हैंडमेड': ['handmade'],
  'साड़ी': ['saree', 'sari'],
  'शॉल': ['shawl', 'stole'],
  'दीया': ['diya', 'lamp'],
  'कुर्ता': ['kurta', 'tunic'],
  'मसाले': ['spices', 'organic spices'],
  'शहद': ['honey', 'organic honey'],
  'बर्तन': ['cookware', 'utensils', 'pot'],
  'कपड़े': ['textiles', 'handloom', 'fabric'],

  // English to Hindi / Synonyms
  'bamboo': ['बाँस', 'बांस', 'cane'],
  'basket': ['टोकरी', 'storage basket'],
  'clay': ['मिट्टी', 'terracotta', 'earthen'],
  'terracotta': ['मिट्टी', 'clay', 'pottery'],
  'gift': ['उपहार', 'तोहफा', 'hampers', 'corporate gift'],
  'handmade': ['हस्तनिर्मित', 'handcrafted', 'artisan'],
  'saree': ['साड़ी', 'silk saree', 'cotton saree'],
  'pot': ['मिट्टी का बर्तन', 'planter', 'matka'],
  'lamp': ['दीया', 'diya', 'brass lamp']
};

const SEMANTIC_INTENT_MAP = {
  'corporate gift': {
    categories: ['Handicrafts & Bamboo', 'Handloom & Textiles', 'Gifts & Home Decor'],
    keywords: ['gift', 'bamboo', 'pen stand', 'planner', 'organizer', 'box', 'tray', 'brass', 'handcrafted', 'corporate']
  },
  'birthday gift': {
    categories: ['Handicrafts & Bamboo', 'Gifts & Home Decor', 'Handloom & Textiles'],
    keywords: ['gift', 'handcrafted', 'decor', 'souvenir', 'handmade', 'special', 'gift box']
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
 * Extracts structured intent attributes from natural language queries
 * e.g. "I need a good birthday gift under ₹1500 near me"
 * e.g. "Find handmade eco-friendly corporate gifts for 100 people"
 */
export const extractNaturalLanguageIntent = (query = '') => {
  const text = query.toLowerCase();
  const intent = {
    budget: null,
    context: null,
    quantity: null,
    nearMe: false,
    attributes: []
  };

  // 1. Budget extraction (under 1500, under ₹1500, below 2000, 1500 ke andar, <= 1500)
  const budgetMatch = text.match(/(?:under|below|less than|within|ke andar|₹|rs\.?)\s*(\d+)/i) ||
                      text.match(/(\d+)\s*(?:rupaye|rupees|rs|inr)/i);
  if (budgetMatch && budgetMatch[1]) {
    const val = parseInt(budgetMatch[1], 10);
    if (!isNaN(val) && val > 0 && val < 500000) {
      intent.budget = val;
    }
  }

  // 2. Quantity extraction (for 100 people, 50 units, 100 pieces, 200 pcs)
  const qtyMatch = text.match(/(?:for|order|quantity|of)\s*(\d+)\s*(?:people|persons|pieces|units|pcs|items)/i) ||
                   text.match(/(\d+)\s*(?:pieces|units|pcs|items|people)/i);
  if (qtyMatch && qtyMatch[1]) {
    const qty = parseInt(qtyMatch[1], 10);
    if (!isNaN(qty) && qty > 0) {
      intent.quantity = qty;
    }
  }

  // 3. Context extraction (birthday, wedding, corporate, diwali, anniversary)
  if (/birthday|janmadin/i.test(text)) intent.context = 'Birthday';
  else if (/corporate|office|business/i.test(text)) intent.context = 'Corporate';
  else if (/wedding|shaadi|marriage/i.test(text)) intent.context = 'Wedding';
  else if (/festive|diwali|festival|pooja/i.test(text)) intent.context = 'Festive';
  else if (/anniversary/i.test(text)) intent.context = 'Anniversary';

  // 4. Near Me detection
  if (/near me|nearby|paas|local/i.test(text)) {
    intent.nearMe = true;
  }

  // 5. Attributes (handmade, eco-friendly, natural, sustainable)
  if (/handmade|handcrafted|hastshilp/i.test(text)) intent.attributes.push('Handmade');
  if (/eco-friendly|eco friendly|sustainable|natural/i.test(text)) intent.attributes.push('Eco-Friendly');

  return intent;
};

/**
 * Expands a natural language and multilingual search query into semantic concepts and keywords.
 */
export const expandSemanticQuery = (query = '') => {
  const normalized = (query || '').toLowerCase().trim();
  if (!normalized) {
    return {
      originalQuery: '',
      expandedKeywords: [],
      suggestedCategories: [],
      isSemantic: false,
      intent: extractNaturalLanguageIntent('')
    };
  }

  const expandedKeywords = new Set();
  const suggestedCategories = new Set();
  let isSemantic = false;

  // Extract structured intent (budget, context, quantity, nearby)
  const intent = extractNaturalLanguageIntent(normalized);
  if (intent.budget || intent.context || intent.quantity || intent.attributes.length > 0) {
    isSemantic = true;
  }

  // Check intent map matches
  for (const [intentKey, data] of Object.entries(SEMANTIC_INTENT_MAP)) {
    if (normalized.includes(intentKey) || intentKey.includes(normalized)) {
      isSemantic = true;
      data.keywords.forEach((k) => expandedKeywords.add(k));
      data.categories.forEach((c) => suggestedCategories.add(c));
    }
  }

  // Multilingual expansion (Hindi <-> English)
  for (const [term, equivalents] of Object.entries(MULTILINGUAL_EQUIVALENTS)) {
    if (normalized.includes(term.toLowerCase())) {
      isSemantic = true;
      equivalents.forEach((eq) => expandedKeywords.add(eq));
    }
  }

  // Tokenize
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 1);
  tokens.forEach((token) => {
    // Check intent map tokens
    for (const [intentKey, data] of Object.entries(SEMANTIC_INTENT_MAP)) {
      if (intentKey.includes(token)) {
        data.keywords.forEach((k) => expandedKeywords.add(k));
        data.categories.forEach((c) => suggestedCategories.add(c));
      }
    }
    // Check multilingual tokens
    for (const [term, equivalents] of Object.entries(MULTILINGUAL_EQUIVALENTS)) {
      if (term.toLowerCase() === token) {
        equivalents.forEach((eq) => expandedKeywords.add(eq));
      }
    }
  });

  return {
    originalQuery: query,
    tokens,
    expandedKeywords: Array.from(expandedKeywords),
    suggestedCategories: Array.from(suggestedCategories),
    isSemantic,
    intent
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
    product.multilingual?.title?.hi,
    product.multilingual?.description?.hi,
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

  // Intent attribute match
  if (semanticContext.intent?.attributes?.length > 0) {
    semanticContext.intent.attributes.forEach((attr) => {
      if (targetText.includes(attr.toLowerCase())) matches += 2;
    });
  }

  const maxExpected = Math.max(4, semanticContext.expandedKeywords.length + 2);
  return Math.min(1.0, matches / maxExpected);
};
