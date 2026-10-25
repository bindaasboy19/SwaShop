import express from 'express';
import {
  recordClientEvent,
  getSellerOverview,
  getProductAnalyticsReport,
  getDemandInsights,
  getAdminMarketOverview
} from '../controllers/analyticsController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireSeller, requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Event tracking
router.post('/events', optionalAuth, recordClientEvent);

// Seller Analytics
router.get('/seller', authenticate, requireSeller, getSellerOverview);
router.get('/seller/product/:id', authenticate, requireSeller, getProductAnalyticsReport);
router.get('/seller/insights', authenticate, requireSeller, getDemandInsights);

// Admin Market Overview
router.get('/admin/overview', authenticate, requireAdmin, getAdminMarketOverview);

export default router;
