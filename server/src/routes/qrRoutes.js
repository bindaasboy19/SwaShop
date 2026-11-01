import express from 'express';
import { getSellerStoreQR, getProductPageQR } from '../controllers/qrController.js';

const router = express.Router();

router.get('/store/:identifier', getSellerStoreQR);
router.get('/product/:id', getProductPageQR);

export default router;
