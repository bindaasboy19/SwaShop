import {
  createOrder,
  updateOrderStatus,
  getOrders
} from '../services/orderService.js';
import {
  createPaymentIntent,
  verifyPayment,
  confirmOfflinePayment
} from '../services/paymentService.js';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import SellerProfile from '../models/SellerProfile.js';

// @desc    Create a new order (with idempotency protection)
// @route   POST /api/orders
// @access  Private (CUSTOMER or SELLER)
export const placeOrder = async (req, res, next) => {
  try {
    const {
      sellerId,
      items,
      fulfilmentType,
      paymentMethod,
      shippingAddress,
      quotationId,
      notes,
      idempotencyKey
    } = req.body;

    if (!sellerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID and at least one item are required'
      });
    }

    const result = await createOrder({
      buyerId: req.user._id,
      sellerId,
      items,
      fulfilmentType,
      paymentMethod,
      shippingAddress,
      quotationId,
      notes,
      idempotencyKey,
      req
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      message: result.isDuplicate ? 'Order retrieved (idempotent)' : 'Order created successfully',
      order: result.order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's orders (Customer orders or Seller store orders)
// @route   GET /api/orders
// @access  Private
export const listOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, viewAs } = req.query;

    let sellerProfileId = null;
    if (viewAs === 'seller' || req.user.role === 'SELLER') {
      const seller = await SellerProfile.findOne({ userId: req.user._id });
      if (seller) {
        sellerProfileId = seller._id;
      }
    }

    const result = await getOrders({
      userId: req.user._id,
      userRole: sellerProfileId && viewAs === 'seller' ? 'SELLER' : 'CUSTOMER',
      sellerProfileId: viewAs === 'seller' ? sellerProfileId : null,
      status,
      page,
      limit
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order details with tracking shipment
// @route   GET /api/orders/:id
// @access  Private
export const getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('sellerId', 'businessName phone city state address upiId logo')
      .populate('buyerId', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify access permission
    const isBuyer = String(order.buyerId?._id) === String(req.user._id);
    const isSeller = String(order.sellerId?.userId || order.sellerId) === String(req.user._id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    const shipment = await Shipment.findOne({ orderId: order._id });

    res.json({
      success: true,
      order,
      shipment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Seller or Admin)
export const changeOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const order = await Order.findById(req.params.id).populate('sellerId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isSeller = String(order.sellerId?.userId) === String(req.user._id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the merchant or admin can update order status' });
    }

    const updated = await updateOrderStatus(
      order._id,
      status,
      req.user._id,
      req.user.role,
      note,
      req
    );

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create payment intent for order
// @route   POST /api/orders/:id/pay
// @access  Private (Buyer)
export const initiatePayment = async (req, res, next) => {
  try {
    const { gateway } = req.body;
    const paymentData = await createPaymentIntent(req.params.id, req.user._id, { preferredGateway: gateway });

    res.json({
      success: true,
      payment: paymentData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify payment completion
// @route   POST /api/orders/:id/verify-payment
// @access  Private
export const confirmPayment = async (req, res, next) => {
  try {
    const { transactionId, signature, status } = req.body;
    const result = await verifyPayment(req.params.id, { transactionId, signature, status }, req);

    res.json({
      success: result.success,
      order: result.order,
      message: result.message || 'Payment verified'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seller confirms offline/cash payment
// @route   POST /api/orders/:id/confirm-offline-payment
// @access  Private (Seller)
export const markOfflinePaymentDone = async (req, res, next) => {
  try {
    const order = await confirmOfflinePayment(req.params.id, req.user._id, req);
    res.json({
      success: true,
      message: 'Offline payment verified and recorded',
      order
    });
  } catch (err) {
    next(err);
  }
};
