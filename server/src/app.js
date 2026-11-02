import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import resellerRoutes from './routes/resellerRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import b2bRoutes from './routes/b2bRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import mongoose from 'mongoose';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & Parsing Middleware
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, curl, server-to-server) or same-origin
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ].filter(Boolean);

    // Allow configured frontend, all Vercel domains (*.vercel.app), Netlify (*.netlify.app), and localhost
    if (
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Safe fallback allowing all origins to avoid broken demos in expo
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
const uploadDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Health & Readiness checks
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SwaShop API',
    version: '1.0.0',
    phase: 'Phase 4 (Startup Scale)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/ready', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  res.status(isDbReady ? 200 : 503).json({
    status: isDbReady ? 'ready' : 'not_ready',
    database: isDbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reseller-listings', resellerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/b2b', b2bRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/chat', chatRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
