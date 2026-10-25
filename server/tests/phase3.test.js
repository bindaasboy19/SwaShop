import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import Category from '../src/models/Category.js';
import User from '../src/models/User.js';
import SellerProfile from '../src/models/SellerProfile.js';
import BuyerRequirement from '../src/models/BuyerRequirement.js';
import { seedDatabaseCore } from '../src/seeds/seedData.js';

let server;
let baseUrl;
let customerToken;
let sellerToken;
let adminToken;
let customerId;
let sellerId;

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
  if (catCount === 0) {
    await seedDatabaseCore({ silent: true });
  }

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Log in as Customer
  const custLogin = await request('POST', '/api/auth/login', {
    email: 'customer@example.com',
    password: 'CustomerPass@123'
  });
  customerToken = custLogin.data.token;
  customerId = custLogin.data.user._id;

  // Log in as Seller B (Ramesh Sharma)
  const sellerLogin = await request('POST', '/api/auth/login', {
    email: 'sharma.handicrafts@example.com',
    password: 'Password@123'
  });
  sellerToken = sellerLogin.data.token;

  // Find Seller B's profile ID
  const sellerBProfile = await SellerProfile.findOne({ businessName: 'Sharma Handicrafts' });
  sellerId = sellerBProfile._id.toString();

  // Log in as Admin
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@swashop.in',
    password: 'AdminPass@12345'
  });
  adminToken = adminLogin.data.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDB();
});

// ==========================================
// 1. INTELLIGENT SEARCH & DISCOVERY TESTS
// ==========================================

test('Search suggestions API returns fast completions as user types', async () => {
  const res = await request('GET', '/api/search/suggestions?q=bamb');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.suggestions));
  assert.ok(res.data.suggestions.length > 0);
  const hasBamboo = res.data.suggestions.some((s) => s.text.toLowerCase().includes('bamboo'));
  assert.ok(hasBamboo, 'Suggestions should include bamboo items or categories');
});

test('Multi-factor ranking prioritizes text match, availability, and verified sellers', async () => {
  const res = await request('GET', '/api/search?q=bamboo&lat=28.57&lng=77.20');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.products.length > 0);
  const topProduct = res.data.products[0];
  assert.ok(topProduct.rankingDetails, 'Ranked product must have rankingDetails');
  assert.ok(topProduct.rankingDetails.compositeScore > 0);
  assert.ok(topProduct.rankingDetails.availabilityScore > 0);
});

test('Semantic search recognizes buyer intent (e.g., eco friendly gift for corporate event)', async () => {
  const res = await request('GET', '/api/search?q=eco+friendly+gift+for+corporate+event');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.isSemantic, true);
  assert.ok(res.data.products.length > 0, 'Semantic expansion should find relevant gift/bamboo products');
});

test('Zero-result experience provides category suggestions and B2B requirement bridge', async () => {
  const res = await request('GET', '/api/search?q=quantum+antigravity+device+9988');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.products.length, 0);
  assert.ok(res.data.zeroResultsHelp, 'Zero result must include zeroResultsHelp');
  assert.ok(res.data.zeroResultsHelp.b2bBridge.canPostRequirement);
});

test('Nearby radius search respects distance limits', async () => {
  const res = await request('GET', '/api/search/nearby?lat=28.57&lng=77.20&radiusKm=10');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.sellers.length > 0);
  // Verify all returned sellers are within 10 km
  res.data.sellers.forEach((s) => {
    assert.ok(s.distanceKm <= 10, `Seller ${s.businessName} at ${s.distanceKm}km exceeds 10km radius`);
  });
});

// ==========================================
// 2. CUSTOMER FAVOURITES TESTS
// ==========================================

test('Customer can toggle product and seller favourites with persistence', async () => {
  const productsRes = await request('GET', '/api/products');
  const targetProduct = productsRes.data.products.find((p) => !p.name.includes('Bamboo Basket')) || productsRes.data.products[1];

  // 1. Save product
  const saveRes = await request('POST', `/api/favourites/products/${targetProduct._id}`, null, customerToken);
  assert.equal(saveRes.status, 200);
  assert.equal(saveRes.data.success, true);
  assert.equal(saveRes.data.saved, true);

  // 2. Check saved list
  const listRes = await request('GET', '/api/favourites', null, customerToken);
  assert.equal(listRes.status, 200);
  assert.ok(listRes.data.products.some((p) => p._id.toString() === targetProduct._id.toString()));

  // 3. Toggle off (unsave)
  const unsaveRes = await request('POST', `/api/favourites/products/${targetProduct._id}`, null, customerToken);
  assert.equal(unsaveRes.status, 200);
  assert.equal(unsaveRes.data.saved, false);
});

// ==========================================
// 3. SELLER TRUST & VERIFICATION WORKFLOW
// ==========================================

test('Seller can submit verification request and check status', async () => {
  const submitRes = await request(
    'POST',
    '/api/sellers/verification/request',
    {
      documentType: 'UDYAM',
      documentNumber: 'UDYAM-DL-01-0004928',
      reviewNotes: 'Small enterprise registration certificate attached.'
    },
    sellerToken
  );
  assert.equal(submitRes.status, 200);
  assert.equal(submitRes.data.success, true);
  assert.equal(submitRes.data.verificationStatus, 'PENDING');

  const statusRes = await request('GET', '/api/sellers/verification/status', null, sellerToken);
  assert.equal(statusRes.status, 200);
  assert.equal(statusRes.data.verificationStatus, 'PENDING');
});

test('Admin can review and approve seller verification', async () => {
  const approveRes = await request(
    'PATCH',
    `/api/admin/sellers/${sellerId}/verification`,
    {
      status: 'VERIFIED',
      reviewNotes: 'Verified against national MSME Udyam portal.'
    },
    adminToken
  );
  assert.equal(approveRes.status, 200);
  assert.equal(approveRes.data.success, true);
  assert.equal(approveRes.data.seller.verificationStatus, 'VERIFIED');
});

// ==========================================
// 4. B2B MARKET LINKAGE TESTS
// ==========================================

test('Customer can activate B2B Buyer Profile on existing account without separate login', async () => {
  const profileRes = await request(
    'POST',
    '/api/b2b/profile',
    {
      enabled: true,
      businessName: 'Sharma Enterprise Procurement',
      businessType: 'CORPORATE',
      industry: 'Hospitality',
      location: { city: 'Lucknow', state: 'Uttar Pradesh' }
    },
    customerToken
  );

  assert.equal(profileRes.status, 200);
  assert.equal(profileRes.data.success, true);
  assert.equal(profileRes.data.buyerProfile.enabled, true);
  assert.equal(profileRes.data.buyerProfile.businessName, 'Sharma Enterprise Procurement');
});

test('Buyer can post requirement and run intelligent matching engine with reasons', async () => {
  // 1. Post Requirement
  const createRes = await request(
    'POST',
    '/api/b2b/requirements',
    {
      title: 'Need 500 handmade bamboo baskets for summit',
      description: 'Requirement for 500 eco-friendly woven bamboo hampers with handles.',
      category: 'Handicrafts & Bamboo',
      quantity: 500,
      budgetMin: 150,
      budgetMax: 250,
      location: { city: 'Lucknow', state: 'Uttar Pradesh' },
      bulkRequired: true
    },
    customerToken
  );

  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.success, true);
  const requirementId = createRes.data.requirement._id;

  // 2. Run Match Engine
  const matchRes = await request('POST', `/api/b2b/requirements/${requirementId}/matches`);
  assert.equal(matchRes.status, 200);
  assert.equal(matchRes.data.success, true);
  assert.ok(matchRes.data.matches.length > 0);

  const topMatch = matchRes.data.matches[0];
  assert.ok(topMatch.matchScore >= 50, 'Match score should be calculated');
  assert.ok(Array.isArray(topMatch.reasons), 'Match must have explainable reasons');
  assert.ok(topMatch.reasons.length > 0, 'Must have at least one match reason');

  // 3. Buyer sends bulk enquiry to top matched seller
  const enquiryRes = await request(
    'POST',
    `/api/b2b/requirements/${requirementId}/enquiries`,
    {
      sellerId: topMatch.sellerId,
      quantity: 500,
      message: 'Interested in partnering with your workshop for 500 gift hampers.',
      targetPrice: 200
    },
    customerToken
  );

  assert.equal(enquiryRes.status, 201);
  assert.equal(enquiryRes.data.success, true);
  assert.equal(enquiryRes.data.enquiry.enquiryType, 'B2B_REQUIREMENT');
});

test('Seller can view incoming B2B Enquiries and update B2B capacity', async () => {
  // Update seller B2B capacity
  const updateB2BRes = await request(
    'PUT',
    '/api/b2b/seller/profile',
    {
      enabled: true,
      productionCapacity: 2000,
      minimumOrderQuantity: 50,
      bulkAvailable: true,
      leadTimeDays: 12
    },
    sellerToken
  );

  assert.equal(updateB2BRes.status, 200);
  assert.equal(updateB2BRes.data.b2bProfile.productionCapacity, 2000);

  // View incoming enquiries
  const enquiriesRes = await request('GET', '/api/b2b/seller/enquiries', null, sellerToken);
  assert.equal(enquiriesRes.status, 200);
  assert.equal(enquiriesRes.data.success, true);
  assert.ok(Array.isArray(enquiriesRes.data.enquiries));
});

// ==========================================
// 5. SELLER DISCOVERY ANALYTICS & DEMAND SIGNALS
// ==========================================

test('Seller can view aggregated discovery analytics without fabricated metrics', async () => {
  const analyticsRes = await request('GET', '/api/analytics/seller', null, sellerToken);
  assert.equal(analyticsRes.status, 200);
  assert.equal(analyticsRes.data.success, true);
  assert.ok(analyticsRes.data.analytics.metrics);
  assert.ok(typeof analyticsRes.data.analytics.metrics.productViews === 'number');
  assert.ok(typeof analyticsRes.data.analytics.metrics.searchImpressions === 'number');
  assert.ok(Array.isArray(analyticsRes.data.analytics.topProducts));
  assert.ok(Array.isArray(analyticsRes.data.analytics.discoverySources));
});

test('Seller can view market demand insights and opportunity signals', async () => {
  const demandRes = await request('GET', '/api/analytics/seller/insights', null, sellerToken);
  assert.equal(demandRes.status, 200);
  assert.equal(demandRes.data.success, true);
  assert.ok(Array.isArray(demandRes.data.insights.popularTerms));
  assert.ok(Array.isArray(demandRes.data.insights.insights));
});

// ==========================================
// 6. SECURITY & AUTHORIZATION TESTS
// ==========================================

test('Customer CANNOT approve seller verification (403 Forbidden)', async () => {
  const forbiddenRes = await request(
    'PATCH',
    `/api/admin/sellers/${sellerId}/verification`,
    { status: 'VERIFIED' },
    customerToken
  );
  assert.equal(forbiddenRes.status, 403);
});

test('Customer CANNOT access seller private analytics (403 Forbidden)', async () => {
  const forbiddenRes = await request('GET', '/api/analytics/seller', null, customerToken);
  assert.equal(forbiddenRes.status, 403);
});
