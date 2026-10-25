import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireSeller, requireAdmin } from '../middleware/roles.js';
import { audioUpload } from '../middleware/upload.js';
import {
  generateTitleHandler,
  generateDescriptionHandler,
  suggestCategoryHandler,
  generateTagsHandler,
  extractAttributesHandler,
  generateCatalogHandler,
  enhanceImageHandler,
  transcribeAudioHandler,
  suggestPriceHandler,
  getAIUsageHandler
} from '../controllers/aiController.js';

const router = express.Router();

// Seller-facing AI Assistant Endpoints
router.post('/title', authenticate, requireSeller, generateTitleHandler);
router.post('/description', authenticate, requireSeller, generateDescriptionHandler);
router.post('/category', authenticate, requireSeller, suggestCategoryHandler);
router.post('/tags', authenticate, requireSeller, generateTagsHandler);
router.post('/attributes', authenticate, requireSeller, extractAttributesHandler);
router.post('/catalog', authenticate, requireSeller, generateCatalogHandler);
router.post('/image/enhance', authenticate, requireSeller, enhanceImageHandler);
router.post('/speech/transcribe', authenticate, requireSeller, audioUpload.single('audio'), transcribeAudioHandler);
router.post('/price/suggest', authenticate, requireSeller, suggestPriceHandler);

// Admin-facing AI Telemetry & Usage Analytics
router.get('/usage', authenticate, requireAdmin, getAIUsageHandler);

export default router;
