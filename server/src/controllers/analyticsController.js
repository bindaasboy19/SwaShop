/**
 * SwaShop Phase 3: Marketplace Analytics & Intelligence Controller
 */

import SellerProfile from '../models/SellerProfile.js';
import { trackEvent, getSellerAnalytics, getProductAnalytics } from '../services/market/analyticsService.js';
import { getSellerDemandInsights, getPlatformMarketOverview } from '../services/market/demandService.js';

// @desc    Ingest discovery or interaction event from client
// @route   POST /api/analytics/events
// @access  Public / Private
export const recordClientEvent = async (req, res, next) => {
  try {
    const { eventType, sellerId, productId, metadata, source } = req.body;
    if (!eventType) {
      return res.status(400).json({ success: false, message: 'Event type is required.' });
    }

    // Fire-and-forget ingestion
    trackEvent({
      eventType,
      sellerId: sellerId || null,
      productId: productId || null,
      userId: req.user?._id || null,
      metadata: metadata || {},
      source: source || 'DIRECT'
    });

    res.status(202).json({ success: true, message: 'Event accepted.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get aggregated discovery metrics for logged-in seller
// @route   GET /api/analytics/seller
// @access  Private (Seller only)
export const getSellerOverview = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const days = parseInt(req.query.days, 10) || 30;
    const analytics = await getSellerAnalytics(seller._id, days);

    res.json({
      success: true,
      sellerId: seller._id,
      businessName: seller.businessName,
      analytics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get discovery analytics for a specific product
// @route   GET /api/analytics/seller/product/:id
// @access  Private (Seller only)
export const getProductAnalyticsReport = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const report = await getProductAnalytics(req.params.id, seller._id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Product not found or not owned by seller.' });
    }

    res.json({
      success: true,
      report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get market demand intelligence and local opportunity insights
// @route   GET /api/analytics/seller/insights
// @access  Private (Seller only)
export const getDemandInsights = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const insights = await getSellerDemandInsights(seller._id);

    res.json({
      success: true,
      insights
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin Platform Market Overview
// @route   GET /api/analytics/admin/overview
// @access  Private (Admin only)
export const getAdminMarketOverview = async (req, res, next) => {
  try {
    const overview = await getPlatformMarketOverview();
    res.json({
      success: true,
      overview
    });
  } catch (err) {
    next(err);
  }
};
