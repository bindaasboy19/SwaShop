import {
  createQuote,
  getQuotesForRequirement,
  getSellerQuotes,
  acceptQuote,
  rejectQuote
} from '../services/quoteService.js';
import SellerProfile from '../models/SellerProfile.js';

// @desc    Seller submits quotation for B2B requirement
// @route   POST /api/b2b/quotes
// @access  Private (SELLER)
export const submitQuote = async (req, res, next) => {
  try {
    const {
      requirementId,
      items,
      totalAmount,
      leadTimeDays,
      shippingIncluded,
      notes
    } = req.body;

    if (!requirementId || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Requirement ID, items, and total amount are required'
      });
    }

    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Only registered sellers can submit quotations'
      });
    }

    const quote = await createQuote({
      requirementId,
      sellerId: seller._id,
      items,
      totalAmount,
      leadTimeDays,
      shippingIncluded,
      notes,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Quotation submitted successfully to buyer',
      quote
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Buyer views quotations for their requirement
// @route   GET /api/b2b/quotes/requirement/:id
// @access  Private (Buyer)
export const getRequirementQuotes = async (req, res, next) => {
  try {
    const quotes = await getQuotesForRequirement(req.params.id, req.user._id);
    res.json({
      success: true,
      quotes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seller views all quotes they have submitted
// @route   GET /api/b2b/quotes/seller
// @access  Private (Seller)
export const getSellerSubmittedQuotes = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(403).json({ success: false, message: 'Seller profile required' });
    }

    const quotes = await getSellerQuotes(seller._id);
    res.json({
      success: true,
      quotes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Buyer accepts quotation -> Converts to Order
// @route   PATCH /api/b2b/quotes/:id/accept
// @access  Private (Buyer)
export const acceptBuyerQuote = async (req, res, next) => {
  try {
    const result = await acceptQuote(req.params.id, req.user._id, req);
    res.json({
      success: true,
      message: 'Quotation accepted and order created successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Buyer declines quotation
// @route   PATCH /api/b2b/quotes/:id/reject
// @access  Private (Buyer)
export const rejectBuyerQuote = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const quote = await rejectQuote(req.params.id, req.user._id, reason, req);
    res.json({
      success: true,
      message: 'Quotation rejected',
      quote
    });
  } catch (err) {
    next(err);
  }
};
