import express from 'express';
import { addReview, getProductReviews, getSellerReviews } from '../controllers/reviewController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, addReview);
router.get('/product/:id', getProductReviews);
router.get('/seller/:id', getSellerReviews);

export default router;
