/**
 * SwaShop Phase 3: B2B Requirement Matching Engine
 * Deterministic rule-based matching with explainable reasons and AI-assisted extraction.
 */

import { calculateHaversineDistance } from './rankingService.js';
import aiService from '../ai/aiService.js';

/**
 * Matches a B2B BuyerRequirement against eligible sellers.
 */
export const matchRequirementToSellers = (requirement, sellersWithProducts = []) => {
  const reqCategory = (requirement.category || '').toLowerCase();
  const reqQty = Number(requirement.quantity) || 1;
  const reqCity = (requirement.location?.city || '').toLowerCase();
  const reqLat = requirement.location?.coordinates?.lat || null;
  const reqLng = requirement.location?.coordinates?.lng || null;
  const reqBudgetMax = requirement.budgetMax ? Number(requirement.budgetMax) : null;
  const reqDeadline = requirement.deadline ? new Date(requirement.deadline) : null;

  const matches = sellersWithProducts.map((sellerItem) => {
    const seller = sellerItem.seller || sellerItem;
    const products = sellerItem.products || [];
    const b2b = seller.b2bProfile || {};

    let score = 0;
    const reasons = [];
    const gaps = [];

    // 1. Category Compatibility (Weight: 25)
    const sellerCat = (seller.category || '').toLowerCase();
    const b2bCats = (b2b.businessCategories || []).map((c) => (c || '').toLowerCase());
    const productCats = products.map((p) => (p.categoryId?.name || '').toLowerCase());

    const hasCategoryMatch =
      sellerCat.includes(reqCategory) ||
      reqCategory.includes(sellerCat) ||
      b2bCats.some((c) => c.includes(reqCategory) || reqCategory.includes(c)) ||
      productCats.some((c) => c.includes(reqCategory) || reqCategory.includes(c));

    if (hasCategoryMatch) {
      score += 25;
      reasons.push(`Category match: relevant products and experience in ${requirement.category}`);
    } else {
      score += 5;
      gaps.push(`Category differs from primary business category`);
    }

    // 2. Bulk Availability & Minimum Order Quantity (Weight: 20)
    const moq = b2b.minimumOrderQuantity || 1;
    if (b2b.bulkAvailable) {
      score += 10;
      reasons.push('Seller officially supports bulk & B2B procurement');
    } else {
      score += 5;
    }

    if (reqQty >= moq) {
      score += 10;
      reasons.push(`MOQ requirement met: seller MOQ is ${moq} units (you need ${reqQty})`);
    } else {
      gaps.push(`Required quantity (${reqQty}) is below seller MOQ (${moq})`);
    }

    // 3. Production Capacity (Weight: 20)
    const capacity = b2b.productionCapacity || 0;
    if (capacity >= reqQty) {
      score += 20;
      reasons.push(`Sufficient capacity: seller produces up to ${capacity.toLocaleString()} units/month`);
    } else if (capacity > 0) {
      const partialRatio = Math.min(1, capacity / reqQty);
      score += Math.round(15 * partialRatio);
      gaps.push(`Monthly capacity (${capacity}) may require staggered delivery for ${reqQty} units`);
    } else {
      score += 10; // unspecified capacity
      reasons.push('Active local producer with scalable workshop capacity');
    }

    // 4. Location & Geographic Proximity (Weight: 15)
    const sellerCity = (seller.city || '').toLowerCase();
    let distanceKm = null;

    if (reqLat && reqLng && seller.coordinates?.lat && seller.coordinates?.lng) {
      distanceKm = calculateHaversineDistance(
        reqLat,
        reqLng,
        seller.coordinates.lat,
        seller.coordinates.lng
      );
    }

    if (reqCity && sellerCity && (reqCity.includes(sellerCity) || sellerCity.includes(reqCity))) {
      score += 15;
      reasons.push(`Local seller located in ${seller.city}`);
    } else if (distanceKm !== null && distanceKm <= 50) {
      score += 15;
      reasons.push(`Within convenient regional radius (${distanceKm} km away)`);
    } else if (distanceKm !== null && distanceKm <= 150) {
      score += 10;
      reasons.push(`Regional proximity: ${distanceKm} km away in ${seller.city}`);
    } else {
      score += 5;
      if (seller.city) reasons.push(`Ships from ${seller.city}, ${seller.state}`);
    }

    // 5. Verification & Platform Trust (Weight: 10)
    const isVerified = seller.verificationStatus === 'VERIFIED' || seller.verificationStatus === 'APPROVED';
    if (isVerified) {
      score += 10;
      reasons.push('Verified SwaShop Seller with authenticated business credentials');
    } else {
      score += 3;
    }

    // 6. Lead Time Feasibility (Weight: 10)
    const leadTimeDays = b2b.leadTimeDays || 7;
    if (reqDeadline) {
      const daysUntilDeadline = (reqDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilDeadline >= leadTimeDays) {
        score += 10;
        reasons.push(`Lead time compatible: ~${leadTimeDays} days estimate fits your deadline`);
      } else {
        gaps.push(`Estimated lead time (${leadTimeDays} days) is tight for your deadline`);
      }
    } else {
      score += 10;
      reasons.push(`Estimated standard turnaround: ~${leadTimeDays} business days`);
    }

    // Normalize final score between 10 and 100
    const finalScore = Math.min(100, Math.max(10, score));

    let tier = 'POTENTIAL';
    if (finalScore >= 80) tier = 'STRONG';
    else if (finalScore >= 60) tier = 'GOOD';

    return {
      sellerId: seller._id,
      businessName: seller.businessName,
      sellerType: seller.sellerType,
      city: seller.city,
      state: seller.state,
      logo: seller.logo,
      verificationStatus: seller.verificationStatus,
      isVerified,
      distanceKm,
      b2bProfile: {
        minimumOrderQuantity: moq,
        productionCapacity: capacity,
        bulkAvailable: b2b.bulkAvailable || false,
        leadTimeDays
      },
      relevantProducts: products.slice(0, 3).map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        images: p.images
      })),
      matchScore: finalScore,
      tier,
      reasons,
      gaps
    };
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * AI-assisted requirement extraction from natural language text
 */
export const extractRequirementFromText = async (text) => {
  if (!text || typeof text !== 'string') {
    return {
      title: '',
      category: '',
      quantity: 100,
      description: text || '',
      requiredAttributes: [],
      location: { city: '', state: '' }
    };
  }

  // Attempt AI extraction first if AI is active
  try {
    const prompt = `You are a B2B requirement extraction assistant for an Indian local commerce marketplace.
Extract structured requirement fields from the following buyer request:
"${text}"

Respond with ONLY valid JSON without markdown fences:
{
  "title": "Short descriptive requirement title",
  "category": "One of: Handicrafts & Bamboo, Handloom & Textiles, Organic & Spices, Pottery & Clayware, or Gifts & Home Decor",
  "quantity": 500,
  "budgetMin": 100,
  "budgetMax": 250,
  "city": "Extracted city or empty string",
  "deadlineDays": 20,
  "requiredAttributes": ["eco-friendly", "handmade", "custom branding"]
}`;

    const aiRes = await aiService.generateChat({ prompt, workspace: 'b2b-assistant' });
    if (aiRes && aiRes.text) {
      let rawJson = aiRes.text.trim();
      if (rawJson.startsWith('```json')) rawJson = rawJson.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (rawJson.startsWith('```')) rawJson = rawJson.replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(rawJson);
      return {
        title: parsed.title || text.slice(0, 60),
        category: parsed.category || 'Handicrafts & Bamboo',
        quantity: Number(parsed.quantity) || 100,
        budgetMin: parsed.budgetMin ? Number(parsed.budgetMin) : null,
        budgetMax: parsed.budgetMax ? Number(parsed.budgetMax) : null,
        description: text,
        requiredAttributes: Array.isArray(parsed.requiredAttributes) ? parsed.requiredAttributes : [],
        location: { city: parsed.city || '', state: '' },
        deadlineDays: parsed.deadlineDays || 14
      };
    }
  } catch (err) {
    console.warn('[MatchingService] AI requirement extraction failed, using heuristic extraction:', err.message);
  }

  // Fallback: Deterministic Regex/Heuristic parser
  const lower = text.toLowerCase();
  
  // Extract quantity
  let quantity = 100;
  const qtyMatch = text.match(/(\d+)\s*(pcs|pieces|units|items|bags|sets|boxes|nos)?/i);
  if (qtyMatch && Number(qtyMatch[1]) > 0) {
    quantity = Number(qtyMatch[1]);
  }

  // Extract category
  let category = 'Handicrafts & Bamboo';
  if (lower.includes('bag') || lower.includes('textile') || lower.includes('cotton') || lower.includes('saree') || lower.includes('fabric')) {
    category = 'Handloom & Textiles';
  } else if (lower.includes('pot') || lower.includes('clay') || lower.includes('terracotta') || lower.includes('ceramic')) {
    category = 'Pottery & Clayware';
  } else if (lower.includes('spice') || lower.includes('honey') || lower.includes('organic') || lower.includes('tea')) {
    category = 'Organic & Spices';
  } else if (lower.includes('gift') || lower.includes('basket') || lower.includes('bamboo') || lower.includes('decor')) {
    category = 'Handicrafts & Bamboo';
  }

  // Extract city
  let city = '';
  const indianCities = ['lucknow', 'delhi', 'noida', 'gurugram', 'gurgaon', 'mumbai', 'varanasi', 'jaipur', 'bengaluru', 'bangalore', 'kolkata', 'chennai', 'hyderabad'];
  for (const c of indianCities) {
    if (lower.includes(c)) {
      city = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Attributes
  const attributes = [];
  if (lower.includes('eco') || lower.includes('sustainable')) attributes.push('eco-friendly');
  if (lower.includes('handmade') || lower.includes('handcrafted')) attributes.push('handmade');
  if (lower.includes('corporate') || lower.includes('event')) attributes.push('corporate-gifting');
  if (lower.includes('custom') || lower.includes('logo')) attributes.push('customization-available');

  return {
    title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
    category,
    quantity,
    budgetMin: null,
    budgetMax: null,
    description: text,
    requiredAttributes: attributes,
    location: { city, state: '' },
    deadlineDays: 14
  };
};
