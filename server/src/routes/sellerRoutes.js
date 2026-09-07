import express from 'express';
import {
  getMySellerProfile,
  updateSellerProfile,
  getSellerById,
  listSellers
} from '../controllers/sellerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSeller } from '../middleware/roles.js';

const router = express.Router();

// Public routes
router.get('/', listSellers);
router.get('/:id', getSellerById);

// Protected Seller routes
router.get('/profile/me', authenticate, requireSeller, getMySellerProfile);
router.put('/profile', authenticate, requireSeller, updateSellerProfile);

export default router;
