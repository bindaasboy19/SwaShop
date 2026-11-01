import express from 'express';
import {
  placeOrder,
  listOrders,
  getOrderDetail,
  changeOrderStatus,
  initiatePayment,
  confirmPayment,
  markOfflinePaymentDone
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Order lifecycle routes (Authenticated)
router.post('/', requireAuth, placeOrder);
router.get('/', requireAuth, listOrders);
router.get('/:id', requireAuth, getOrderDetail);
router.patch('/:id/status', requireAuth, changeOrderStatus);

// Payment endpoints
router.post('/:id/pay', requireAuth, initiatePayment);
router.post('/:id/verify-payment', requireAuth, confirmPayment);
router.post('/:id/confirm-offline-payment', requireAuth, markOfflinePaymentDone);

export default router;
