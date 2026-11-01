import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import SellerProfile from '../src/models/SellerProfile.js';
import Product from '../src/models/Product.js';
import { seedDatabaseCore } from '../src/seeds/seedData.js';

let server;
let baseUrl;
let customerToken;
let sellerToken;
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
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await seedDatabaseCore({ silent: true });
  }

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Log in Customer
  const custLogin = await request('POST', '/api/auth/login', {
    email: 'customer@example.com',
    password: 'CustomerPass@123'
  });
  customerToken = custLogin.data?.token;
  customerId = custLogin.data?.user?._id;

  // Log in Seller
  const sellerLogin = await request('POST', '/api/auth/login', {
    email: 'aarav.gifts@example.com',
    password: 'Password@123'
  });
  sellerToken = sellerLogin.data?.token;

  const sellerUser = await User.findOne({ email: 'aarav.gifts@example.com' });
  const sellerProfile = await SellerProfile.findOne({ userId: sellerUser._id });
  sellerId = sellerProfile?._id?.toString();

  const prod = await Product.findOne({ sellerId: sellerProfile?._id });
  sampleProductId = prod?._id?.toString();
});

test.after(async () => {
  if (server) {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDB();
});

test('Customer can initiate conversation with Seller about a product', async () => {
  const res = await request('POST', '/api/chat/conversations', {
    sellerId,
    productId: sampleProductId
  }, customerToken);

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.conversation._id);
  assert.equal(res.data.conversation.sellerId._id.toString(), sellerId);
});

test('Customer can send a message in the conversation', async () => {
  // First get or create conversation
  const convRes = await request('POST', '/api/chat/conversations', {
    sellerId,
    productId: sampleProductId
  }, customerToken);
  const conversationId = convRes.data.conversation._id;

  const msgRes = await request('POST', `/api/chat/conversations/${conversationId}/messages`, {
    text: 'Hello, is this handicraft item currently available in stock for store visit today?'
  }, customerToken);

  assert.equal(msgRes.status, 201);
  assert.equal(msgRes.data.success, true);
  assert.equal(msgRes.data.message.text, 'Hello, is this handicraft item currently available in stock for store visit today?');
  assert.equal(msgRes.data.message.senderRole, 'CUSTOMER');
});

test('Seller can view conversations and reply to customer message', async () => {
  // Seller lists conversations
  const listRes = await request('GET', '/api/chat/conversations', null, sellerToken);
  assert.equal(listRes.status, 200);
  assert.equal(listRes.data.success, true);
  assert.ok(listRes.data.conversations.length >= 1);

  const conversation = listRes.data.conversations.find((c) => c.sellerId._id.toString() === sellerId);
  assert.ok(conversation, 'Expected seller to find customer conversation');

  // Seller replies
  const replyRes = await request('POST', `/api/chat/conversations/${conversation._id}/messages`, {
    text: 'Yes! We have 8 pieces in stock right now at our shop. You are welcome to visit anytime between 10 AM and 8 PM!'
  }, sellerToken);

  assert.equal(replyRes.status, 201);
  assert.equal(replyRes.data.success, true);
  assert.equal(replyRes.data.message.senderRole, 'SELLER');

  // Customer fetches messages and sees seller reply
  const msgsRes = await request('GET', `/api/chat/conversations/${conversation._id}/messages`, null, customerToken);
  assert.equal(msgsRes.status, 200);
  assert.ok(msgsRes.data.messages.length >= 2);
  const lastMsg = msgsRes.data.messages[msgsRes.data.messages.length - 1];
  assert.ok(lastMsg.text.includes('We have 8 pieces in stock'));
});

test('Unauthorized guest CANNOT access or send chat messages (401)', async () => {
  const res = await request('GET', '/api/chat/conversations');
  assert.equal(res.status, 401);
});
