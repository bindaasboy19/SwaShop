import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';

let server;
let baseUrl;

// Helper to make HTTP JSON requests
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
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Runner] Test server listening on ${baseUrl}`);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDB();
});

test('Health Check API returns ok', async () => {
  const res = await request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
  assert.equal(res.data.app, 'SwaShop API');
});

test('Public Categories listing returns seeded categories', async () => {
  const res = await request('GET', '/api/categories');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.categories.length >= 4);
});

test('Public Products listing returns published products with seller details', async () => {
  const res = await request('GET', '/api/products');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.products.length >= 1);
  const bamboo = res.data.products.find((p) => p.name.includes('Bamboo Basket'));
  assert.ok(bamboo, 'Handmade Bamboo Basket should be in products');
});

test('Nearby Search calculates distance with coordinates', async () => {
  // Test with Connaught Place coordinates (28.6304, 77.2177)
  const res = await request('GET', '/api/search/nearby?lat=28.6304&lng=77.2177&radiusKm=50');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.locationProvided, true);
  assert.ok(res.data.sellers.length > 0);
  assert.ok(res.data.sellers[0].distanceKm !== undefined);
});

test('Public Admin registration is STRICTLY FORBIDDEN (403)', async () => {
  const res = await request('POST', '/api/auth/register', {
    name: 'Malicious Admin',
    email: 'hacker@example.com',
    password: 'Password@123',
    role: 'ADMIN'
  });
  assert.equal(res.status, 403);
  assert.equal(res.data.success, false);
});

test('Customer Registration and Login workflow', async () => {
  const uniqueEmail = `test.customer.${Date.now()}@example.com`;
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Test Customer',
    email: uniqueEmail,
    password: 'Password@123',
    role: 'CUSTOMER'
  });
  assert.equal(regRes.status, 201);
  assert.equal(regRes.data.success, true);
  assert.ok(regRes.data.token);
  assert.equal(regRes.data.user.role, 'CUSTOMER');

  // Customer Login
  const loginRes = await request('POST', '/api/auth/login', {
    email: uniqueEmail,
    password: 'Password@123'
  });
  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.data.success, true);
  assert.ok(loginRes.data.token);
});

test('Customer cannot create a product (403 Forbidden)', async () => {
  // Login as Customer
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'customer@example.com',
    password: 'CustomerPass@123'
  });
  const customerToken = loginRes.data.token;

  const res = await request(
    'POST',
    '/api/products',
    {
      name: 'Unauthorized Product',
      price: 100,
      categoryId: '600000000000000000000001'
    },
    customerToken
  );
  assert.equal(res.status, 403);
});

test('Customer cannot access Admin Dashboard (403 Forbidden)', async () => {
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'customer@example.com',
    password: 'CustomerPass@123'
  });
  const res = await request('GET', '/api/admin/dashboard', null, loginRes.data.token);
  assert.equal(res.status, 403);
});

test('Seller cannot access Admin Dashboard (403 Forbidden)', async () => {
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'aarav.gifts@example.com',
    password: 'Password@123'
  });
  const res = await request('GET', '/api/admin/dashboard', null, loginRes.data.token);
  assert.equal(res.status, 403);
});

test('Admin Login & Dashboard real metrics verification', async () => {
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'admin@swashop.in',
    password: 'AdminPass@12345'
  });
  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.data.user.role, 'ADMIN');
  const adminToken = loginRes.data.token;

  const dashRes = await request('GET', '/api/admin/dashboard', null, adminToken);
  assert.equal(dashRes.status, 200);
  assert.equal(dashRes.data.success, true);
  assert.ok(dashRes.data.stats.totalUsers >= 4);
  assert.ok(dashRes.data.stats.totalProducts >= 5);
  assert.ok(dashRes.data.stats.totalSellers >= 4);
});

test('Admin can create additional Administrators securely', async () => {
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'admin@swashop.in',
    password: 'AdminPass@12345'
  });
  const adminToken = loginRes.data.token;

  const newAdminEmail = `secondary.admin.${Date.now()}@swashop.in`;
  const createRes = await request(
    'POST',
    '/api/admin/admins',
    {
      name: 'Secondary Operations Admin',
      email: newAdminEmail,
      password: 'OpsAdmin@12345'
    },
    adminToken
  );
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.success, true);
  assert.equal(createRes.data.admin.role, 'ADMIN');

  // Verify new admin can log in
  const newLoginRes = await request('POST', '/api/auth/login', {
    email: newAdminEmail,
    password: 'OpsAdmin@12345'
  });
  assert.equal(newLoginRes.status, 200);
  assert.equal(newLoginRes.data.user.role, 'ADMIN');
});

test('Reseller Flow: Seller A can create Reseller Listing from Seller B product', async () => {
  // 1. Login as Seller A (Aarav Gift Shop)
  const loginSellerA = await request('POST', '/api/auth/login', {
    email: 'aarav.gifts@example.com',
    password: 'Password@123'
  });
  const tokenA = loginSellerA.data.token;

  // 2. Find product from Seller B (Sharma Handicrafts Cane Fruit Tray)
  const productsRes = await request('GET', '/api/products');
  const caneTray = productsRes.data.products.find((p) => p.name.includes('Cane Fruit Tray'));
  assert.ok(caneTray, 'Source product from Seller B found');

  // 3. Create Reseller Listing ("Buy & Resell" action)
  const resellRes = await request(
    'POST',
    '/api/reseller-listings',
    {
      sourceProductId: caneTray._id,
      price: 499,
      quantity: 15
    },
    tokenA
  );
  assert.equal(resellRes.status, 201);
  assert.equal(resellRes.data.success, true);

  // 4. Verify combined catalogue shows OWN and RESELL products
  const catRes = await request('GET', '/api/reseller-listings/catalogue', null, tokenA);
  assert.equal(catRes.status, 200);
  assert.ok(catRes.data.resellProductsCount >= 1);
  const resoldItem = catRes.data.items.find((i) => i.isResellProduct && i.name.includes('Cane Fruit Tray'));
  assert.ok(resoldItem, 'Resold item appears in Seller A catalogue');
  assert.equal(resoldItem.price, 499);
  assert.ok(resoldItem.sourceSeller.businessName.includes('Sharma Handicrafts'));
});

test('Resource Ownership: Seller A CANNOT edit Seller B original product (403)', async () => {
  const loginSellerA = await request('POST', '/api/auth/login', {
    email: 'aarav.gifts@example.com',
    password: 'Password@123'
  });
  const tokenA = loginSellerA.data.token;

  const productsRes = await request('GET', '/api/products');
  const bambooBasket = productsRes.data.products.find((p) => p.name.includes('Bamboo Basket'));

  // Attempt to edit Sharma's original product as Aarav
  const editRes = await request(
    'PUT',
    `/api/products/${bambooBasket._id}`,
    { name: 'Hijacked Bamboo Basket' },
    tokenA
  );
  assert.equal(editRes.status, 403);
});

test('Seller as Customer: Seller can send enquiry and save items without logging out', async () => {
  const loginSellerA = await request('POST', '/api/auth/login', {
    email: 'aarav.gifts@example.com',
    password: 'Password@123'
  });
  const tokenA = loginSellerA.data.token;

  const productsRes = await request('GET', '/api/products');
  const targetProduct = productsRes.data.products[0];

  // Seller saves a product (customer capability)
  const favRes = await request('POST', `/api/favourites/products/${targetProduct._id}`, {}, tokenA);
  assert.equal(favRes.status, 200);

  // Seller sends an enquiry (customer capability)
  const enqRes = await request(
    'POST',
    '/api/enquiries',
    {
      sellerId: targetProduct.sellerId._id,
      productId: targetProduct._id,
      message: 'Can you supply this in bulk for our upcoming craft exhibition?'
    },
    tokenA
  );
  assert.equal(enqRes.status, 201);
  assert.equal(enqRes.data.success, true);
});
