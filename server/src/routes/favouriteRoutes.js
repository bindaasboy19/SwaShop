import express from 'express';
import {
  toggleProductFavourite,
  toggleSellerFavourite,
  getMyFavourites
} from '../controllers/favouriteController.js';
import { authenticate } from '../middleware/auth.js';
import { requireCustomerOrSeller } from '../middleware/roles.js';

const router = express.Router();

router.use(authenticate, requireCustomerOrSeller);

router.get('/', getMyFavourites);
router.post('/products/:id', toggleProductFavourite);
router.post('/sellers/:id', toggleSellerFavourite);

export default router;
