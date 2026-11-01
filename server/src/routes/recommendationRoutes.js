import express from 'express';
import {
  getCustomerRecs,
  getSellerRecs,
  getMarketDemandForecast
} from '../controllers/recommendationController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { requireSeller } from '../middleware/roles.js';

const router = express.Router();

router.get('/customer', optionalAuth, getCustomerRecs);
router.get('/seller', requireAuth, requireSeller, getSellerRecs);
router.get('/demand-forecast', getMarketDemandForecast);

export default router;
