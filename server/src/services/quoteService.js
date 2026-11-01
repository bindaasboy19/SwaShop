import Quote from '../models/Quote.js';
import BuyerRequirement from '../models/BuyerRequirement.js';
import SellerProfile from '../models/SellerProfile.js';
import Order from '../models/Order.js';
import { createNotification } from './notificationService.js';
import { logAudit } from './auditService.js';

const generateQuoteNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `SWA-QT-${year}-${randomSuffix}`;
};

/**
 * Seller creates quotation in response to B2B Requirement
 */
export const createQuote = async ({
  requirementId,
  sellerId,
  items,
  totalAmount,
  leadTimeDays = 7,
  shippingIncluded = true,
  notes = '',
  req = null
}) => {
  const requirement = await BuyerRequirement.findById(requirementId);
  if (!requirement) {
    throw new Error('Buyer requirement not found');
  }

  const seller = await SellerProfile.findById(sellerId);
  if (!seller) {
    throw new Error('Seller profile not found');
  }

  const quoteNumber = generateQuoteNumber();

  const quote = await Quote.create({
    quoteNumber,
    requirementId,
    buyerId: requirement.buyerId,
    sellerId,
    items,
    totalAmount,
    leadTimeDays,
    shippingIncluded,
    notes,
    status: 'PENDING'
  });

  // Notify Buyer
  await createNotification({
    userId: requirement.buyerId,
    type: 'B2B_QUOTE_RECEIVED',
    title: `Quotation Received: ${quoteNumber}`,
    body: `${seller.businessName} has submitted a quote of ₹${totalAmount} for your requirement "${requirement.title}".`,
    data: { quoteId: quote._id, requirementId: requirement._id, quoteNumber }
  });

  await logAudit({
    actorId: seller.userId,
    actorRole: 'SELLER',
    action: 'B2B_QUOTE_CREATED',
    resourceType: 'Quote',
    resourceId: quote._id,
    metadata: { quoteNumber, totalAmount, requirementId },
    req
  });

  return quote;
};

/**
 * Get quotes for a buyer requirement
 */
export const getQuotesForRequirement = async (requirementId, buyerId) => {
  const requirement = await BuyerRequirement.findOne({ _id: requirementId, buyerId });
  if (!requirement) {
    throw new Error('Requirement not found or unauthorized');
  }

  const quotes = await Quote.find({ requirementId })
    .populate('sellerId', 'businessName phone city state verificationStatus logo')
    .sort({ createdAt: -1 })
    .lean();

  return quotes;
};

/**
 * Get seller's submitted quotes
 */
export const getSellerQuotes = async (sellerId) => {
  const quotes = await Quote.find({ sellerId })
    .populate('requirementId', 'title category quantity targetPrice timeline status')
    .populate('buyerId', 'name email phone buyerProfile')
    .sort({ createdAt: -1 })
    .lean();

  return quotes;
};

/**
 * Buyer accepts quotation -> Converts Quote directly into a confirmed Order
 */
export const acceptQuote = async (quoteId, buyerId, req = null) => {
  const quote = await Quote.findOne({ _id: quoteId, buyerId }).populate('sellerId');
  if (!quote) {
    throw new Error('Quotation not found or unauthorized');
  }

  if (quote.status !== 'PENDING') {
    throw new Error(`Quotation is already ${quote.status}`);
  }

  // 1. Create Order directly from Quote
  const orderNumber = `SWA-ORD-B2B-${Date.now().toString().slice(-6)}`;
  const orderItems = quote.items.map((item, idx) => ({
    productId: quote.sellerId._id, // References seller context or first product
    title: item.title,
    price: item.unitPrice,
    quantity: item.quantity,
    image: quote.sellerId.logo || ''
  }));

  const order = await Order.create({
    orderNumber,
    buyerId: quote.buyerId,
    sellerId: quote.sellerId._id,
    items: orderItems,
    subtotal: quote.totalAmount,
    deliveryFee: 0,
    total: quote.totalAmount,
    currency: 'INR',
    paymentStatus: 'OFFLINE_PENDING',
    paymentMethod: 'OFFLINE_STORE_PAY',
    orderStatus: 'CONFIRMED',
    fulfilmentType: quote.shippingIncluded ? 'SELLER_DELIVERY' : 'PICKUP',
    quotationId: quote._id,
    notes: `Converted from accepted B2B Quotation #${quote.quoteNumber}. ${quote.notes || ''}`,
    statusHistory: [
      {
        status: 'CONFIRMED',
        timestamp: new Date(),
        note: `B2B Quotation #${quote.quoteNumber} accepted by buyer.`
      }
    ]
  });

  // 2. Update Quote status
  quote.status = 'CONVERTED_TO_ORDER';
  quote.orderId = order._id;
  await quote.save();

  // 3. Update requirement status
  await BuyerRequirement.findByIdAndUpdate(quote.requirementId, {
    $set: { status: 'FULFILLED' }
  });

  // 4. Notify Seller
  if (quote.sellerId?.userId) {
    await createNotification({
      userId: quote.sellerId.userId,
      type: 'B2B_QUOTE_ACCEPTED',
      title: `Quote Accepted: ${quote.quoteNumber}`,
      body: `Buyer accepted your quote! Order #${orderNumber} for ₹${quote.totalAmount} has been generated.`,
      data: { quoteId: quote._id, orderId: order._id, orderNumber }
    });
  }

  await logAudit({
    actorId: buyerId,
    actorRole: 'CUSTOMER',
    action: 'B2B_QUOTE_ACCEPTED_CONVERTED_ORDER',
    resourceType: 'Quote',
    resourceId: quote._id,
    metadata: { quoteNumber: quote.quoteNumber, orderNumber, total: quote.totalAmount },
    req
  });

  return { quote, order };
};

/**
 * Buyer rejects quotation
 */
export const rejectQuote = async (quoteId, buyerId, reason = '', req = null) => {
  const quote = await Quote.findOne({ _id: quoteId, buyerId }).populate('sellerId');
  if (!quote) {
    throw new Error('Quotation not found or unauthorized');
  }

  quote.status = 'REJECTED';
  if (reason) {
    quote.notes = `${quote.notes ? quote.notes + ' | ' : ''}Rejection Reason: ${reason}`;
  }
  await quote.save();

  if (quote.sellerId?.userId) {
    await createNotification({
      userId: quote.sellerId.userId,
      type: 'B2B_QUOTE_REJECTED',
      title: `Quote Update: ${quote.quoteNumber}`,
      body: `Buyer declined quote #${quote.quoteNumber}.`,
      data: { quoteId: quote._id }
    });
  }

  await logAudit({
    actorId: buyerId,
    actorRole: 'CUSTOMER',
    action: 'B2B_QUOTE_REJECTED',
    resourceType: 'Quote',
    resourceId: quote._id,
    metadata: { quoteNumber: quote.quoteNumber, reason },
    req
  });

  return quote;
};
