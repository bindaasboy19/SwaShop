import express from 'express';
import {
  createResellerListing,
  getSellerCombinedCatalogue,
  getMyResellerListings,
  updateResellerListing,
  togglePublishResellerListing,
  deleteResellerListing
} from '../controllers/resellerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSeller } from '../middleware/roles.js';

const router = express.Router();

router.use(authenticate, requireSeller);

router.post('/', createResellerListing);
router.get('/catalogue', getSellerCombinedCatalogue);
router.get('/', getMyResellerListings);
router.put('/:id', updateResellerListing);
router.patch('/:id/publish', togglePublishResellerListing);
router.delete('/:id', deleteResellerListing);

export default router;
