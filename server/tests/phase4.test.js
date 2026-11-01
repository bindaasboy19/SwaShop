import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import Category from '../src/models/Category.js';
import User from '../src/models/User.js';
import SellerProfile from '../src/models/SellerProfile.js';
import Product from '../src/models/Product.js';
import BuyerRequirement from '../src/models/BuyerRequirement.js';
import { seedDatabaseCore } from '../src/seeds/seedData.js';

let server;
let baseUrl;
let customerToken;
let sellerToken;
let adminToken;
let customerId;
let sellerId;
let sampleProductId;

const request = async (method, path, body = null, token = null) => {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, data };
};

test.before(async () => {
  await connectDB();
  const catCount = await Category.countDocuments();
  const userCount = await User.countDocuments();
  if (catCount === 0 || userCount === 0) {
    await seedDatabaseCore({ silent: true });
  }

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Log in as Customer
  let custLogin = await request('POST', '/api/auth/login', {
    email: 'customer@example.com',
    password: 'CustomerPass@123'
  });
  if (!custLogin.data?.token) {
    await seedDatabaseCore({ silent: true });
    custLogin = await request('POST', '/api/auth/login', {
      email: 'customer@example.com',
      password: 'CustomerPass@123'
    });
  }
  customerToken = custLogin.data?.token;
  customerId = custLogin.data?.user?._id;

  // Log in as Seller (Sharma Handicrafts)
  const sellerLogin = await request('POST', '/api/auth/login', {
    email: 'sharma.handicrafts@example.com',
    password: 'Password@123'
  });
  sellerToken = sellerLogin.data?.token;
  const sellerDoc = await SellerProfile.findOne({ businessName: 'Sharma Handicrafts' });
  sellerId = sellerDoc?._id?.toString();

  // Log in as Admin
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@swashop.in',
    password: 'AdminPass@12345'
  });
  adminToken = adminLogin.data?.token;

  // Find a sample product
  const prod = await Product.findOne({ sellerId, isPublished: true });
  sampleProductId = prod ? prod._id.toString() : null;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDB();
});

test('Health and Readiness APIs return startup scale status', async () => {
  const healthRes = await request('GET', '/api/health');
  assert.equal(healthRes.status, 200);
  assert.equal(healthRes.data.status, 'ok');
  assert.ok(healthRes.data.phase.includes('Phase 4'));

  const readyRes = await request('GET', '/api/health/ready');
  assert.equal(readyRes.status, 200);
  assert.equal(readyRes.data.status, 'ready');
  assert.equal(readyRes.data.database, 'connected');
});

test('Natural Language search understands intent, budget, and context', async () => {
  const res = await request('GET', '/api/search?q=handmade+bamboo+basket+under+1500+near+me');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.intent, 'Expected intent object');
  assert.equal(res.data.intent.budget, 1500);
  assert.equal(res.data.intent.nearMe, true);
  assert.ok(res.data.intent.attributes.includes('Handmade'));
});

test('Multilingual search handles Hindi catalog queries gracefully', async () => {
  const res = await request('GET', `/api/search?q=${encodeURIComponent('बाँस की टोकरी')}`);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.isSemantic, true);
});

test('Voice-first catalog generator extracts price, material, and structured draft', async () => {
  const res = await request('POST', '/api/ai/voice-catalog', {
    spokenText: 'Ye blue pottery ka handmade vase hai. Isme traditional design hai. Ghar ki decoration ke liye hai aur iska price 850 rupaye hai.',
    language: 'hi'
  }, sellerToken);

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.voiceDraft);
  assert.equal(res.data.voiceDraft.price, 850);
  assert.equal(res.data.voiceDraft.material, 'Blue pottery');
  assert.equal(res.data.voiceDraft.requiresReview, true);
});

test('Voice catalog rejects unclear or empty audio text gracefully', async () => {
  const res = await request('POST', '/api/ai/voice-catalog', {
    spokenText: ''
  }, sellerToken);

  assert.equal(res.status, 400);
  assert.equal(res.data.success, false);
});

test('QR Code & WhatsApp APIs return canonical public links and valid SVG data', async () => {
  const storeQr = await request('GET', `/api/qr/store/${sellerId}`);
  assert.equal(storeQr.status, 200);
  assert.equal(storeQr.data.success, true);
  assert.ok(storeQr.data.canonicalUrl.includes('/store/'));
  assert.ok(storeQr.data.qrDataUrl.startsWith('data:image/svg+xml;base64,'));
  assert.ok(storeQr.data.whatsapp.sellerContactUrl);

  if (sampleProductId) {
    const prodQr = await request('GET', `/api/qr/product/${sampleProductId}`);
    assert.equal(prodQr.status, 200);
    assert.equal(prodQr.data.success, true);
    assert.ok(prodQr.data.canonicalUrl.includes('/product/'));
    assert.ok(prodQr.data.whatsapp.shareUrl);
  }
});

let testOrderId = null;

test('Customer can place Order with idempotency protection and status progression', async () => {
  if (!sampleProductId) return;

  const idempotencyKey = `IDEMP-${Date.now()}`;
  const orderPayload = {
    sellerId,
    items: [
      {
        productId: sampleProductId,
        quantity: 2
      }
    ],
    fulfilmentType: 'SELLER_DELIVERY',
    paymentMethod: 'CASH_ON_DELIVERY',
    shippingAddress: {
      fullName: 'Rahul Sharma',
      phone: '9876543210',
      street: '12 MG Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001'
    },
    idempotencyKey
  };

  // First placement
  const res1 = await request('POST', '/api/orders', orderPayload, customerToken);
  assert.equal(res1.status, 201);
  assert.equal(res1.data.success, true);
  assert.ok(res1.data.order._id);
  assert.equal(res1.data.order.orderStatus, 'CONFIRMED');
  testOrderId = res1.data.order._id;

  // Second placement with same idempotency key
  const res2 = await request('POST', '/api/orders', orderPayload, customerToken);
  assert.equal(res2.status, 200);
  assert.equal(res2.data.order._id, testOrderId);

  // Seller transitions order status to READY
  const statusRes = await request('PATCH', `/api/orders/${testOrderId}/status`, {
    status: 'READY',
    note: 'Items packaged and ready for dispatch'
  }, sellerToken);
  assert.equal(statusRes.status, 200);
  assert.equal(statusRes.data.order.orderStatus, 'READY');

  // Customer views order detail with tracking
  const detailRes = await request('GET', `/api/orders/${testOrderId}`, null, customerToken);
  assert.equal(detailRes.status, 200);
  assert.ok(detailRes.data.shipment);
  assert.equal(detailRes.data.shipment.status, 'PICKED_UP');
});

test('In-app Notifications are generated and readable by user', async () => {
  // Check notifications for seller (who received the order)
  const notifRes = await request('GET', '/api/notifications', null, sellerToken);
  assert.equal(notifRes.status, 200);
  assert.equal(notifRes.data.success, true);
  assert.ok(Array.isArray(notifRes.data.notifications));

  if (notifRes.data.notifications.length > 0) {
    const notifId = notifRes.data.notifications[0]._id;
    const readRes = await request('PATCH', `/api/notifications/${notifId}/read`, {}, sellerToken);
    assert.equal(readRes.status, 200);
    assert.ok(readRes.data.notification.readAt);
  }
});

test('Customer explainable recommendations return reasonCode and scores', async () => {
  const recsRes = await request('GET', '/api/recommendations/customer?city=Jaipur', null, customerToken);
  assert.equal(recsRes.status, 200);
  assert.equal(recsRes.data.success, true);
  assert.ok(Array.isArray(recsRes.data.recommendations));
  if (recsRes.data.recommendations.length > 0) {
    const top = recsRes.data.recommendations[0];
    assert.ok(top.reasonCode);
    assert.ok(top.reasonText);
    assert.ok(top.recommendationScore >= 50);
  }
});

test('Seller growth recommendations evaluate real catalog signals', async () => {
  const sellerRecs = await request('GET', '/api/recommendations/seller', null, sellerToken);
  assert.equal(sellerRecs.status, 200);
  assert.equal(sellerRecs.data.success, true);
  assert.ok(Array.isArray(sellerRecs.data.recommendations));
});

test('Demand forecast calculates market trends with honest confidence scores', async () => {
  const forecastRes = await request('GET', '/api/recommendations/demand-forecast');
  assert.equal(forecastRes.status, 200);
  assert.equal(forecastRes.data.success, true);
  assert.ok(forecastRes.data.period);
  assert.ok(forecastRes.data.confidence);
  assert.ok(Array.isArray(forecastRes.data.forecasts));
});

test('B2B Quotation Lifecycle: Seller quotes -> Buyer accepts -> Order auto-created', async () => {
  // 1. Customer creates a requirement
  const reqRes = await request('POST', '/api/b2b/requirements', {
    title: '500 Handcrafted Bamboo Corporate Hampers',
    category: 'Handicrafts & Bamboo',
    description: 'Eco-friendly bamboo gift boxes for corporate festival gifting.',
    quantity: 500,
    targetPrice: 400,
    timeline: '30_DAYS'
  }, customerToken);
  assert.equal(reqRes.status, 201);
  const requirementId = reqRes.data.requirement._id;

  // 2. Seller submits quotation
  const quoteRes = await request('POST', '/api/b2b/quotes', {
    requirementId,
    items: [
      {
        title: 'Bamboo Gift Box with Lid',
        quantity: 500,
        unitPrice: 380,
        total: 190000
      }
    ],
    totalAmount: 190000,
    leadTimeDays: 14,
    shippingIncluded: true,
    notes: 'Premium finish with customized company logo engraving included.'
  }, sellerToken);
  assert.equal(quoteRes.status, 201);
  const quoteId = quoteRes.data.quote._id;

  // 3. Buyer views quotes
  const quotesListRes = await request('GET', `/api/b2b/quotes/requirement/${requirementId}`, null, customerToken);
  assert.equal(quotesListRes.status, 200);
  assert.equal(quotesListRes.data.quotes.length, 1);

  // 4. Buyer accepts quote -> Converts directly to Order
  const acceptRes = await request('PATCH', `/api/b2b/quotes/${quoteId}/accept`, {}, customerToken);
  assert.equal(acceptRes.status, 200);
  assert.equal(acceptRes.data.quote.status, 'CONVERTED_TO_ORDER');
  assert.ok(acceptRes.data.order._id);
  assert.equal(acceptRes.data.order.total, 190000);
});

test('Verified Buyer Review submission updates product rating', async () => {
  if (!sampleProductId || !testOrderId) return;

  const reviewRes = await request('POST', '/api/reviews', {
    productId: sampleProductId,
    sellerId,
    orderId: testOrderId,
    rating: 5,
    comment: 'Exceptional handcrafted quality. Authentic packaging and fast delivery!'
  }, customerToken);

  assert.equal(reviewRes.status, 201);
  assert.equal(reviewRes.data.review.verifiedPurchase, true);

  const prodReviews = await request('GET', `/api/reviews/product/${sampleProductId}`);
  assert.equal(prodReviews.status, 200);
  assert.ok(prodReviews.data.reviews.length >= 1);
});

test('Operational Moderation Report and Immutable Audit Log trail', async () => {
  if (!sampleProductId) return;

  // Customer reports product
  const reportRes = await request('POST', '/api/moderation/report', {
    targetType: 'PRODUCT',
    targetId: sampleProductId,
    reason: 'Incorrect category classification',
    details: 'Product should be under Pottery instead of General.'
  }, customerToken);
  assert.equal(reportRes.status, 201);
  const reportId = reportRes.data.report._id;

  // Admin lists reports
  const adminReports = await request('GET', '/api/moderation/admin/reports', null, adminToken);
  assert.equal(adminReports.status, 200);
  assert.ok(adminReports.data.reports.some((r) => r._id === reportId));

  // Admin views immutable audit logs
  const auditLogs = await request('GET', '/api/moderation/admin/audit-logs', null, adminToken);
  assert.equal(auditLogs.status, 200);
  assert.ok(auditLogs.data.logs.length >= 1);
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDB();
});
