import express from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getSellers,
  updateSellerVerification,
  getAdminProducts,
  updateProductStatus,
  getAdmins,
  createAdmin
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Strict Admin protection for all routes
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Seller verification & management
router.get('/sellers', getSellers);
router.patch('/sellers/:id/verification', updateSellerVerification);

// Product moderation
router.get('/products', getAdminProducts);
router.patch('/products/:id/status', updateProductStatus);

// Admin account management (authorized admin can create additional admins)
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);

export default router;
