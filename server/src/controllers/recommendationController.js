import { getCustomerRecommendations, getSellerRecommendations } from '../services/recommendationService.js';
import { getDemandForecast } from '../services/demandPredictionService.js';
import SellerProfile from '../models/SellerProfile.js';

// @desc    Get customer personalized & explainable recommendations
// @route   GET /api/recommendations/customer
// @access  Public (Optional Auth for personalization)
export const getCustomerRecs = async (req, res, next) => {
  try {
    const { city, categoryId, limit = 8 } = req.query;
    const userId = req.user?._id || null;

    const recommendations = await getCustomerRecommendations(userId, {
      city,
      categoryId,
      limit: parseInt(limit, 10)
    });

    res.json({
      success: true,
      recommendations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get seller catalog & growth recommendations
// @route   GET /api/recommendations/seller
// @access  Private (Seller)
export const getSellerRecs = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const recommendations = await getSellerRecommendations(seller._id);

    res.json({
      success: true,
      recommendations
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get 30-day demand forecast with confidence scores
// @route   GET /api/demand/forecast
// @access  Public
export const getMarketDemandForecast = async (req, res, next) => {
  try {
    const { categoryId, city } = req.query;
    const forecast = await getDemandForecast({ categoryId, city });

    res.json({
      success: true,
      ...forecast
    });
  } catch (err) {
    next(err);
  }
};
