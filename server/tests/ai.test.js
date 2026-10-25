import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import AIUsage from '../src/models/AIUsage.js';

import { seedDatabaseCore } from '../src/seeds/seedData.js';

let server;
let baseUrl;
let sellerToken;
let customerToken;
let adminToken;

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

  // Log in as Seller
  const sellerLogin = await request('POST', '/api/auth/login', {
    email: 'aarav.gifts@example.com',
    password: 'Password@123'
  });
  sellerToken = sellerLogin.data?.token;

  // Log in as Customer
  const customerLogin = await request('POST', '/api/auth/login', {
    email: 'customer@example.com',
    password: 'CustomerPass@123'
  });
  customerToken = customerLogin.data?.token;

  // Log in as Admin
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@swashop.in',
    password: 'AdminPass@12345'
  });
  adminToken = adminLogin.data?.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDB();
});

test('Customer cannot access Seller AI Title generation (403 Forbidden)', async () => {
  const res = await request(
    'POST',
    '/api/ai/title',
    { name: 'Handcrafted Clay Diya' },
    customerToken
  );
  assert.equal(res.status, 403);
  assert.equal(res.data.success, false);
});

test('Seller can generate high-conversion Product Title', async () => {
  const res = await request(
    'POST',
    '/api/ai/title',
    { name: 'bamboo basket for fruit handmade round' },
    sellerToken
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.title);
  assert.ok(res.data.title.length > 5);
});

test('Seller can generate Product Description and Bullet Features in English & Hindi', async () => {
  const resEn = await request(
    'POST',
    '/api/ai/description',
    { name: 'Pure Brass Pooja Bell', details: 'traditional carved ghanti', language: 'en' },
    sellerToken
  );
  assert.equal(resEn.status, 200);
  assert.equal(resEn.data.success, true);
  assert.ok(resEn.data.description);
  assert.ok(Array.isArray(resEn.data.features));
  assert.ok(resEn.data.features.length >= 2);

  const resHi = await request(
    'POST',
    '/api/ai/description',
    { name: 'Pure Brass Pooja Bell', details: 'traditional carved ghanti', language: 'hi' },
    sellerToken
  );
  assert.equal(resHi.status, 200);
  assert.equal(resHi.data.success, true);
  assert.ok(resHi.data.description);
  assert.ok(resHi.data.descriptionHi || resHi.data.description);
});

test('Seller can get Grounded Category Suggestion strictly mapped to DB', async () => {
  const res = await request(
    'POST',
    '/api/ai/category',
    { name: 'Organic Cold Pressed Mustard Oil Sarson Ka Tel' },
    sellerToken
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.categoryName);
  assert.ok(res.data.categorySlug);
  assert.ok(res.data.confidence);

  // Check that the returned category slug actually exists in DB
  const dbCat = await Category.findOne({ slug: res.data.categorySlug });
  assert.ok(dbCat, 'Suggested category slug must exist in Category collection');
});

test('Seller can generate Tags and Search Keywords', async () => {
  const res = await request(
    'POST',
    '/api/ai/tags',
    { name: 'Handloom Cotton Khadi Kurta', description: 'Breathable summer ethnic wear' },
    sellerToken
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.tags));
  assert.ok(res.data.tags.length >= 3);
  assert.ok(Array.isArray(res.data.keywords));
});

test('Seller can extract structured Product Attributes', async () => {
  const res = await request(
    'POST',
    '/api/ai/attributes',
    { name: 'Terracotta Tea Kulhad Set of 6', description: 'Made from natural clay in Varanasi, brown color' },
    sellerToken
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.attributes);
  assert.ok(typeof res.data.attributes === 'object');
});

test('Seller can generate Unified End-to-End Catalog from rough text', async () => {
  const res = await request(
    'POST',
    '/api/ai/catalog',
    { text: 'wooden hand carved wall hanging elephant motif traditional jodhpur craft', language: 'both' },
    sellerToken
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.catalog);
  assert.ok(res.data.catalog.title);
  assert.ok(res.data.catalog.description);
  assert.ok(Array.isArray(res.data.catalog.tags));
  assert.ok(Array.isArray(res.data.catalog.features));
});

test('Seller AI Image Enhancement returns non-destructive original + enhanced pair', async () => {
  const testImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
  const res = await request(
    'POST',
    '/api/ai/image/enhance',
    { imageUrl: testImageUrl },
    sellerToken
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.original, testImageUrl);
  assert.ok(res.data.enhanced);
  assert.notEqual(res.data.enhanced, testImageUrl, 'Enhanced image URL should apply Cloudinary transformations');
  assert.ok(res.data.enhanced.includes('e_improve'));
});

test('Seller can calculate Cost-Plus Craft Markup Price Recommendation with disclaimer', async () => {
  const res = await request(
    'POST',
    '/api/ai/price/suggest',
    {
      costData: {
        materialCost: 200,
        laborHours: 2,
        hourlyRate: 100,
        packagingCost: 30,
        overheadCost: 20
      },
      categorySlug: 'handicrafts'
    },
    sellerToken
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  // Base cost = 200 + (2 * 100) + 30 + 20 = 450
  assert.equal(res.data.baseCost, 450);
  assert.ok(res.data.recommendedPrice > 450, 'Recommended price must be higher than base cost');
  assert.ok(res.data.suggestedRange.min > 450);
  assert.ok(res.data.suggestedRange.max > res.data.suggestedRange.min);
  assert.ok(res.data.disclaimer, 'Must include advisory pricing disclaimer');
});

test('Catalog Quality Score computes deterministically on Product save', async () => {
  const category = await Category.findOne();
  const testProduct = new Product({
    sellerId: category._id, // placeholder id for schema
    name: 'Exquisite Terracotta Handpainted Vase',
    description: 'This is an authentic hand-molded clay vase crafted by local artisans with rich natural floral designs.',
    categoryId: category._id,
    images: ['https://example.com/vase1.jpg', 'https://example.com/vase2.jpg'],
    price: 499,
    tags: ['terracotta', 'pottery', 'handcrafted', 'vase'],
    features: ['100% natural clay', 'Hand-painted floral finish'],
    attributes: { material: 'Terracotta', color: 'Earthy Red' }
  });

  const score = testProduct.calculateQualityScore();
  assert.ok(score >= 80, `Expected quality score >= 80, got ${score}`);
  assert.equal(testProduct.catalogQualityScore, score);
});

test('Seller cannot view Admin AI Usage telemetry (403 Forbidden)', async () => {
  const res = await request('GET', '/api/ai/usage', null, sellerToken);
  assert.equal(res.status, 403);
});

test('Admin can view AI Usage and Telemetry Analytics', async () => {
  const res = await request('GET', '/api/ai/usage', null, adminToken);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.stats);
  assert.ok(res.data.stats.totalCalls >= 1);
  assert.ok(Array.isArray(res.data.stats.featureBreakdown));
  assert.ok(Array.isArray(res.data.stats.recentLogs));
});

test('Search ranks products with AI keywords and quality score', async () => {
  const res = await request('GET', '/api/search?q=bamboo&sort=relevance');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.products.length >= 1);
  assert.ok(res.data.products[0].searchRelevanceScore !== undefined);
});
