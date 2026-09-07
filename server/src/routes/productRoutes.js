import express from 'express';
import {
  createProduct,
  listProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  togglePublish,
  deleteProduct,
  uploadImage
} from '../controllers/productController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireSeller, requireCustomerOrSeller } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes (optionalAuth allows detecting if viewer is seller/customer)
router.get('/', listProducts);
router.get('/my-catalogue', authenticate, requireSeller, getMyProducts);
router.get('/:id', optionalAuth, getProductById);

// Seller protected routes
router.post('/', authenticate, requireSeller, createProduct);
router.put('/:id', authenticate, requireSeller, updateProduct);
router.patch('/:id/publish', authenticate, requireSeller, togglePublish);
router.delete('/:id', authenticate, requireSeller, deleteProduct);

// Upload image route
router.post('/upload', authenticate, requireCustomerOrSeller, upload.single('image'), uploadImage);

export default router;
