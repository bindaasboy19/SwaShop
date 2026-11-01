import express from 'express';
import {
  getBuyerProfile,
  updateBuyerProfile,
  createRequirement,
  getRequirements,
  getRequirementById,
  updateRequirement,
  getRequirementMatches,
  sendBulkEnquiry,
  aiAssistRequirement,
  updateSellerB2BProfile,
  getSellerB2BEnquiries
} from '../controllers/b2bController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireCustomerOrSeller, requireSeller } from '../middleware/roles.js';

import {
  submitQuote,
  getRequirementQuotes,
  getSellerSubmittedQuotes,
  acceptBuyerQuote,
  rejectBuyerQuote
} from '../controllers/quoteController.js';

const router = express.Router();

// Buyer Profile
router.get('/profile', authenticate, getBuyerProfile);
router.post('/profile', authenticate, updateBuyerProfile);

// Requirements
router.post('/requirements', authenticate, createRequirement);
router.get('/requirements', optionalAuth, getRequirements);
router.get('/requirements/:id', optionalAuth, getRequirementById);
router.put('/requirements/:id', authenticate, updateRequirement);

// Matching & Enquiries
router.post('/requirements/:id/matches', optionalAuth, getRequirementMatches);
router.post('/requirements/:id/enquiries', authenticate, sendBulkEnquiry);

// AI Assistant
router.post('/ai-assist', authenticate, aiAssistRequirement);

// Seller B2B Management
router.put('/seller/profile', authenticate, requireSeller, updateSellerB2BProfile);
router.get('/seller/enquiries', authenticate, requireSeller, getSellerB2BEnquiries);

// B2B RFQ Quotations Lifecycle
router.post('/quotes', authenticate, requireSeller, submitQuote);
router.get('/quotes/requirement/:id', authenticate, getRequirementQuotes);
router.get('/quotes/seller', authenticate, requireSeller, getSellerSubmittedQuotes);
router.patch('/quotes/:id/accept', authenticate, acceptBuyerQuote);
router.patch('/quotes/:id/reject', authenticate, rejectBuyerQuote);

export default router;
