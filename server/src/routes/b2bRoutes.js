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

export default router;
