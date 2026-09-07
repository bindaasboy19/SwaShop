import express from 'express';
import {
  createEnquiry,
  getMySentEnquiries,
  getMyReceivedEnquiries,
  updateEnquiryStatus
} from '../controllers/enquiryController.js';
import { authenticate } from '../middleware/auth.js';
import { requireCustomerOrSeller, requireSeller } from '../middleware/roles.js';

const router = express.Router();

router.use(authenticate);

// Buyer capabilities (available to Customers and Sellers)
router.post('/', requireCustomerOrSeller, createEnquiry);
router.get('/sent', requireCustomerOrSeller, getMySentEnquiries);

// Seller capabilities
router.get('/received', requireSeller, getMyReceivedEnquiries);
router.patch('/:id', requireSeller, updateEnquiryStatus);

export default router;
