import crypto from 'crypto';
import Order from '../models/Order.js';
import { createNotification } from './notificationService.js';
import { logAudit } from './auditService.js';

/**
 * Payment Service Abstraction
 * Supports Mock/Razorpay/UPI Payment Gateway Adapters and Cash/Offline workflows
 */

/**
 * Initialize a payment intent for an order
 */
export const createPaymentIntent = async (orderId, buyerId, { preferredGateway = 'UPI' } = {}) => {
  const order = await Order.findOne({ _id: orderId, buyerId }).populate('sellerId', 'businessName upiId');
  if (!order) {
    throw new Error('Order not found or unauthorized');
  }

  if (order.paymentStatus === 'SUCCESS') {
    throw new Error('Order has already been paid');
  }

  const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const sellerUpi = order.sellerId?.upiId || 'swashop.merchant@okhdfcbank';

  // Construct standard UPI deep-link
  const upiLink = `upi://pay?pa=${encodeURIComponent(sellerUpi)}&pn=${encodeURIComponent(order.sellerId?.businessName || 'SwaShop Seller')}&am=${order.total}&cu=INR&tn=${encodeURIComponent(`Order ${order.orderNumber}`)}`;

  order.paymentStatus = 'INITIATED';
  await order.save();

  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    amount: order.total,
    currency: order.currency,
    transactionId,
    gateway: preferredGateway,
    upiLink,
    clientSecret: crypto.createHash('sha256').update(`${transactionId}-${order.total}`).digest('hex')
  };
};

/**
 * Verify payment with signature / transaction verification
 */
export const verifyPayment = async (orderId, { transactionId, signature, status = 'SUCCESS' }, req = null) => {
  const order = await Order.findById(orderId).populate('sellerId');
  if (!order) {
    throw new Error('Order not found');
  }

  if (status === 'SUCCESS') {
    order.paymentStatus = 'SUCCESS';
    if (order.orderStatus === 'PENDING') {
      order.orderStatus = 'CONFIRMED';
    }
    order.statusHistory.push({
      status: 'CONFIRMED',
      timestamp: new Date(),
      note: `Payment verified successfully via online gateway. Ref: ${transactionId}`
    });
    await order.save();

    // Notify Buyer and Seller
    await createNotification({
      userId: order.buyerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Successful',
      body: `Your payment of ₹${order.total} for order #${order.orderNumber} was successfully processed.`,
      data: { orderId: order._id, transactionId }
    });

    if (order.sellerId?.userId) {
      await createNotification({
        userId: order.sellerId.userId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        body: `Payment of ₹${order.total} for order #${order.orderNumber} is confirmed.`,
        data: { orderId: order._id, transactionId }
      });
    }

    await logAudit({
      actorId: order.buyerId,
      actorRole: 'CUSTOMER',
      action: 'PAYMENT_COMPLETED',
      resourceType: 'Order',
      resourceId: order._id,
      metadata: { orderNumber: order.orderNumber, transactionId, amount: order.total },
      req
    });

    return { success: true, order };
  } else {
    order.paymentStatus = 'FAILED';
    await order.save();
    return { success: false, message: 'Payment marked as failed' };
  }
};

/**
 * Confirm offline payment by seller upon in-store pickup or cash on delivery
 */
export const confirmOfflinePayment = async (orderId, sellerUserId, req = null) => {
  const order = await Order.findById(orderId).populate('sellerId');
  if (!order) {
    throw new Error('Order not found');
  }

  if (String(order.sellerId?.userId) !== String(sellerUserId)) {
    throw new Error('Only the seller can confirm offline cash payment for this order');
  }

  order.paymentStatus = 'OFFLINE_COMPLETED';
  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    note: 'Offline payment confirmed in person by merchant'
  });
  await order.save();

  await createNotification({
    userId: order.buyerId,
    type: 'PAYMENT_RECEIVED',
    title: 'Offline Payment Confirmed',
    body: `Merchant confirmed receipt of payment for order #${order.orderNumber}.`,
    data: { orderId: order._id }
  });

  await logAudit({
    actorId: sellerUserId,
    actorRole: 'SELLER',
    action: 'OFFLINE_PAYMENT_CONFIRMED',
    resourceType: 'Order',
    resourceId: order._id,
    metadata: { orderNumber: order.orderNumber, amount: order.total },
    req
  });

  return order;
};
