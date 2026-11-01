import * as aiService from '../services/ai/aiService.js';
import Product from '../models/Product.js';

/**
 * 1. POST /api/ai/title
 * Suggest clean, high-conversion, professional marketplace product title.
 */
export const generateTitleHandler = async (req, res, next) => {
  try {
    const { name, text, productId } = req.body;
    if (!name && !text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either product name keywords or a rough description.'
      });
    }

    const result = await aiService.generateTitle({
      name,
      text,
      userId: req.user?._id,
      productId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 2. POST /api/ai/description
 * Generate rich, formatted product description, artisan story, and bullet features.
 */
export const generateDescriptionHandler = async (req, res, next) => {
  try {
    const { name, details, text, language = 'en', productId } = req.body;
    if (!name && !text) {
      return res.status(400).json({
        success: false,
        message: 'Product name or details are required to generate description.'
      });
    }

    const result = await aiService.generateDescription({
      name,
      details,
      text,
      language,
      userId: req.user?._id,
      productId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 3. POST /api/ai/category
 * Grounded category recommendation strictly mapped to existing DB categories.
 */
export const suggestCategoryHandler = async (req, res, next) => {
  try {
    const { name, description, text, productId } = req.body;
    if (!name && !description && !text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title or description to suggest category.'
      });
    }

    const result = await aiService.suggestCategory({
      name,
      description,
      text,
      userId: req.user?._id,
      productId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 4. POST /api/ai/tags
 * Generate high-relevance search tags and keywords.
 */
export const generateTagsHandler = async (req, res, next) => {
  try {
    const { name, description, text, productId } = req.body;
    if (!name && !description && !text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title or description to generate tags.'
      });
    }

    const result = await aiService.generateTagsAndKeywords({
      name,
      description,
      text,
      userId: req.user?._id,
      productId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 5. POST /api/ai/attributes
 * Extract structured attributes (material, dimensions, care, origin, color).
 */
export const extractAttributesHandler = async (req, res, next) => {
  try {
    const { name, description, text, productId } = req.body;
    if (!name && !description && !text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title or description to extract attributes.'
      });
    }

    const result = await aiService.extractAttributes({
      name,
      description,
      text,
      userId: req.user?._id,
      productId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 6. POST /api/ai/catalog
 * Unified End-to-End Catalog Generation from rough seller notes or voice transcripts.
 */
export const generateCatalogHandler = async (req, res, next) => {
  try {
    const { text, language = 'en', categoryId, productId } = req.body;
    if (!text || text.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a short description or voice transcript (min 3 characters).'
      });
    }

    const result = await aiService.generateUnifiedCatalog({
      text: text.trim(),
      language,
      categoryId,
      userId: req.user?._id,
      productId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 7. POST /api/ai/image/enhance
 * Non-destructive AI image enhancement preserving original asset.
 */
export const enhanceImageHandler = async (req, res, next) => {
  try {
    const { imageUrl, productId } = req.body;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required for enhancement.'
      });
    }

    const result = await aiService.enhanceImage({
      imageUrl,
      userId: req.user?._id,
      productId
    });

    // If productId is provided, optionally save to product enhancedImages
    if (productId && result.success && req.sellerProfile) {
      try {
        const product = await Product.findById(productId);
        if (product && product.sellerId.toString() === req.sellerProfile._id.toString()) {
          product.enhancedImages.push({
            original: result.original,
            enhanced: result.enhanced,
            enhancedAt: new Date()
          });
          await product.save();
        }
      } catch (saveErr) {
        console.warn('Could not save enhanced image directly to product:', saveErr.message);
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 8. POST /api/ai/speech/transcribe
 * Audio transcription handler for audio uploads.
 */
export const transcribeAudioHandler = async (req, res, next) => {
  try {
    const language = req.body.language || 'hi';
    const audioBuffer = req.file ? req.file.buffer : null;
    const mimeType = req.file ? req.file.mimetype : 'audio/webm';

    const result = await aiService.transcribeAudio({
      audioBuffer,
      mimeType,
      language,
      userId: req.user?._id
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 9. POST /api/ai/price/suggest
 * Deterministic cost calculation + AI artisan markup pricing assistant.
 */
export const suggestPriceHandler = async (req, res, next) => {
  try {
    const { costData, categorySlug, productId } = req.body;
    if (!costData) {
      return res.status(400).json({
        success: false,
        message: 'Cost data is required (materialCost, laborHours, hourlyRate, packagingCost, overheadCost).'
      });
    }

    const result = await aiService.calculatePriceRecommendation({
      costData,
      categorySlug,
      userId: req.user?._id,
      productId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 10. GET /api/ai/usage
 * Telemetry and audit log analytics for Administrators.
 */
export const getAIUsageHandler = async (req, res, next) => {
  try {
    const stats = await aiService.getAIUsageStats();
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 11. POST /api/ai/voice-catalog
 * Voice-first catalog generation for sellers speaking Hindi, Hinglish, or English.
 * Extracts product title, material, features, and price with reviewable draft and graceful fallbacks.
 */
export const voiceCatalogHandler = async (req, res, next) => {
  try {
    const { spokenText, language = 'hi', categoryId } = req.body;
    if (!spokenText || spokenText.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'No clear speech detected. Please speak clearly or type details manually.'
      });
    }

    const text = spokenText.trim();

    // 1. Extract price if spoken (e.g., "850 rupaye", "price 850", "₹1200", "rate 450")
    let extractedPrice = null;
    const priceMatch = text.match(/(?:price|kimat|rate|daam|₹|rs\.?)\s*(?:is|hai|ke|hota)?\s*(\d+)/i) ||
                       text.match(/(\d+)\s*(?:rupaye|rupees|rs|inr)/i);
    if (priceMatch && priceMatch[1]) {
      extractedPrice = parseInt(priceMatch[1], 10);
    }

    // 2. Extract material
    let extractedMaterial = null;
    const materials = ['blue pottery', 'terracotta', 'bamboo', 'jute', 'clay', 'silk', 'brass', 'wood', 'copper', 'cotton'];
    for (const mat of materials) {
      if (text.toLowerCase().includes(mat)) {
        extractedMaterial = mat.charAt(0).toUpperCase() + mat.slice(1);
        break;
      }
    }

    // 3. Generate structured draft using Unified Catalog Generator
    const catalogResult = await aiService.generateUnifiedCatalog({
      text,
      language: language === 'hi' ? 'both' : language,
      categoryId,
      userId: req.user?._id
    });

    const catalog = catalogResult.catalog || {};

    const voiceDraft = {
      title: catalog.title || 'Handcrafted Artisan Product',
      titleHi: catalog.titleHi || null,
      description: catalog.description || text,
      descriptionHi: catalog.descriptionHi || null,
      price: extractedPrice || catalog.price || null,
      material: extractedMaterial || catalog.attributes?.material || null,
      features: catalog.features || ['Handmade authentic craft', 'Traditional Indian design', 'Artisan quality'],
      categorySlug: catalog.categorySlug || null,
      categoryId: catalogResult.matchedCategoryId || null,
      tags: catalog.tags || ['handcrafted', 'artisan', 'local'],
      attributes: {
        ...(catalog.attributes || {}),
        ...(extractedMaterial ? { material: extractedMaterial } : {})
      },
      sourceTranscript: text,
      requiresReview: true
    };

    res.json({
      success: true,
      message: 'Voice catalog drafted successfully. Review before publishing.',
      voiceDraft
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 12. POST /api/ai/product/enhance
 * Consolidated endpoint for Phase 2 Embedded AI Listing Assistant.
 * Accepts rough title, rough details, image URL, categoryId and returns
 * professional structured product content, multilingual translations,
 * and non-destructive enhanced image.
 */
export const enhanceProductHandler = async (req, res, next) => {
  try {
    const { name, roughDetails, text, imageUrl, categoryId, productId } = req.body;
    if (!name && !roughDetails && !text && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rough product name, details, or an image to enhance.'
      });
    }

    const result = await aiService.enhanceProductListing({
      name: name || '',
      roughDetails: roughDetails || text || '',
      text: text || '',
      imageUrl: imageUrl || null,
      categoryId: categoryId || null,
      userId: req.user?._id,
      productId: productId || null
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

