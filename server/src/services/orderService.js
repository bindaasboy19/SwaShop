import Order from '../models/Order.js';
import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';
import Shipment from '../models/Shipment.js';
import { createNotification } from './notificationService.js';
import { logAudit } from './auditService.js';

/**
 * Generate a unique, readable order number
 */
const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `SWA-ORD-${year}-${randomSuffix}`;
};

/**
 * Create a new order with idempotency protection and atomic calculation
 */
export const createOrder = async ({
  buyerId,
  sellerId,
  items,
  fulfilmentType = 'PICKUP',
  paymentMethod = 'CASH_ON_DELIVERY',
  shippingAddress = {},
  quotationId = null,
  notes = '',
  idempotencyKey = null,
  req = null
}) => {
  // 1. Idempotency check
  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey, buyerId });
    if (existing) {
      return { order: existing, isDuplicate: true };
    }
  }

  // 2. Verify seller
  const seller = await SellerProfile.findById(sellerId);
  if (!seller) {
    throw new Error('Seller profile not found');
  }

  // 3. Process items and calculate totals
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
    const quantity = Number(item.quantity) || 1;
    const itemTotal = price * quantity;
    subtotal += itemTotal;

    verifiedItems.push({
      productId: product._id,
      title: product.name,
      price,
      quantity,
      image: product.images?.[0] || '',
      selectedVariant: item.selectedVariant || ''
    });

    // Increment product order count
    await Product.findByIdAndUpdate(product._id, { $inc: { orderCount: 1 } });
  }

  // Calculate delivery fee
  let deliveryFee = 0;
  if (fulfilmentType === 'SELLER_DELIVERY') {
    deliveryFee = subtotal >= 1000 ? 0 : 50;
  } else if (fulfilmentType === 'THIRD_PARTY_DELIVERY') {
    deliveryFee = subtotal >= 1500 ? 0 : 90;
  }

  const total = subtotal + deliveryFee;
  const orderNumber = generateOrderNumber();

  const initialStatus = paymentMethod === 'ONLINE_UPI_CARD' ? 'PENDING' : 'CONFIRMED';
  const initialPaymentStatus = paymentMethod === 'CASH_ON_DELIVERY' || paymentMethod === 'OFFLINE_STORE_PAY' 
    ? 'OFFLINE_PENDING' 
    : 'PENDING';

  // 4. Create Order
  const order = await Order.create({
    orderNumber,
    buyerId,
    sellerId,
    items: verifiedItems,
    subtotal,
    deliveryFee,
    total,
    currency: 'INR',
    paymentStatus: initialPaymentStatus,
    paymentMethod,
    orderStatus: initialStatus,
    fulfilmentType,
    shippingAddress,
    quotationId,
    idempotencyKey,
    notes,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: new Date(),
        note: `Order placed via ${paymentMethod} (${fulfilmentType})`
      }
    ]
  });

  // 5. Create initial shipment tracking record
  try {
    const providerMap = {
      PICKUP: 'LOCAL_STORE_PICKUP',
      SELLER_DELIVERY: 'SELLER_FLEET',
      THIRD_PARTY_DELIVERY: 'STANDARD_COURIER'
    };
    await Shipment.create({
      orderId: order._id,
      sellerId,
      buyerId,
      provider: providerMap[fulfilmentType] || 'LOCAL_STORE_PICKUP',
      trackingNumber: `TRK-${orderNumber.slice(-8)}`,
      status: 'LABEL_CREATED',
      pickupAddress: {
        businessName: seller.businessName,
        address: seller.address,
        city: seller.city,
        state: seller.state,
        pincode: seller.pincode,
        phone: seller.phone
      },
      deliveryAddress: shippingAddress,
      statusUpdates: [
        {
          status: 'LABEL_CREATED',
          timestamp: new Date(),
          location: seller.city || 'Origin',
          message: `Order received. Fulfilment type: ${fulfilmentType}`
        }
      ]
    });
  } catch (err) {
    console.warn('[OrderService] Could not create initial shipment:', err.message);
  }

  // 6. Notify Seller
  if (seller.userId) {
    await createNotification({
      userId: seller.userId,
      type: 'ORDER_CREATED',
      title: `New Order #${orderNumber}`,
      body: `You received a new order for ₹${total} (${verifiedItems.length} items).`,
      data: { orderId: order._id, orderNumber }
    });
  }

  // 7. Audit log
  await logAudit({
    actorId: buyerId,
    actorRole: 'CUSTOMER',
    action: 'ORDER_CREATED',
    resourceType: 'Order',
    resourceId: order._id,
    metadata: { orderNumber, total, itemsCount: verifiedItems.length, fulfilmentType },
    req
  });

  return { order, isDuplicate: false };
};

/**
 * Transition order status
 */
export const updateOrderStatus = async (orderId, newStatus, actorId, actorRole, note = '', req = null) => {
  const order = await Order.findById(orderId).populate('sellerId');
  if (!order) {
    throw new Error('Order not found');
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid order status: ${newStatus}`);
  }

  order.orderStatus = newStatus;
  order.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || `Status transitioned to ${newStatus}`
  });

  // If marked delivered, update offline payment status if pending
  if (newStatus === 'DELIVERED' && order.paymentStatus === 'OFFLINE_PENDING') {
    order.paymentStatus = 'OFFLINE_COMPLETED';
  }

  await order.save();

  // Update associated shipment status if exists
  const shipmentStatusMap = {
    CONFIRMED: 'LABEL_CREATED',
    PROCESSING: 'LABEL_CREATED',
    READY: 'PICKED_UP',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'RETURNED'
  };

  if (shipmentStatusMap[newStatus]) {
    await Shipment.findOneAndUpdate(
      { orderId: order._id },
      {
        $set: { status: shipmentStatusMap[newStatus] },
        $push: {
          statusUpdates: {
            status: shipmentStatusMap[newStatus],
            timestamp: new Date(),
            message: note || `Package status updated to ${newStatus}`
          }
        }
      }
    );
  }

  // Notify Buyer
  await createNotification({
    userId: order.buyerId,
    type: 'ORDER_STATUS_UPDATED',
    title: `Order Update #${order.orderNumber}`,
    body: `Your order status is now: ${newStatus}. ${note ? `Note: ${note}` : ''}`,
    data: { orderId: order._id, orderNumber: order.orderNumber, status: newStatus }
  });

  // Log Audit
  await logAudit({
    actorId,
    actorRole,
    action: 'ORDER_STATUS_CHANGED',
    resourceType: 'Order',
    resourceId: order._id,
    metadata: { orderNumber: order.orderNumber, newStatus, note },
    req
  });

  return order;
};

/**
 * Get orders with pagination and role filtering
 */
export const getOrders = async ({ userId, userRole, sellerProfileId = null, status = null, page = 1, limit = 20 }) => {
  const query = {};
  if (userRole === 'SELLER' && sellerProfileId) {
    query.sellerId = sellerProfileId;
  } else if (userRole === 'CUSTOMER' || !sellerProfileId) {
    query.buyerId = userId;
  }

  if (status) {
    query.orderStatus = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('sellerId', 'businessName phone city state logo')
      .populate('buyerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query)
  ]);

  return { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};
