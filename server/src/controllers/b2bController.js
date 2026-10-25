/**
 * SwaShop Phase 3: B2B Market Linkage Controller
 * Handles B2B Buyer Onboarding, Requirements Posting, Intelligent Matching, and Bulk Enquiries.
 */

import User from '../models/User.js';
import BuyerRequirement from '../models/BuyerRequirement.js';
import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import Enquiry from '../models/Enquiry.js';
import { matchRequirementToSellers, extractRequirementFromText } from '../services/market/matchingService.js';
import { trackEvent } from '../services/market/analyticsService.js';

// @desc    Get or activate customer B2B Buyer Profile
// @route   GET /api/b2b/profile
// @access  Private
export const getBuyerProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name email phone buyerProfile');
    res.json({
      success: true,
      buyerProfile: user?.buyerProfile || { enabled: false }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update or activate B2B Buyer Profile
// @route   POST /api/b2b/profile
// @access  Private
export const updateBuyerProfile = async (req, res, next) => {
  try {
    const {
      enabled = true,
      businessName,
      businessType,
      industry,
      location,
      gstNumber
    } = req.body;

    const updatedProfile = {
      enabled: Boolean(enabled),
      businessName: businessName?.trim() || req.user.name,
      businessType: businessType || 'RETAILER',
      industry: industry || '',
      location: {
        city: location?.city || '',
        state: location?.state || '',
        country: location?.country || 'India',
        coordinates: location?.coordinates || { lat: 0, lng: 0 }
      },
      gstNumber: gstNumber || '',
      verificationStatus: 'VERIFIED'
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { buyerProfile: updatedProfile } },
      { new: true, runValidators: true }
    ).select('name email phone buyerProfile');

    res.json({
      success: true,
      message: 'B2B Buyer profile updated successfully.',
      buyerProfile: updatedUser.buyerProfile
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new B2B Buyer Requirement
// @route   POST /api/b2b/requirements
// @access  Private
export const createRequirement = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      quantity,
      budgetMin,
      budgetMax,
      targetPricePerUnit,
      location,
      deadline,
      requiredAttributes,
      preferredSellerTypes,
      bulkRequired = true
    } = req.body;

    if (!title || !description || !category || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and quantity are required.'
      });
    }

    const requirement = await BuyerRequirement.create({
      buyerId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      quantity: Number(quantity),
      budgetMin: budgetMin ? Number(budgetMin) : null,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      targetPricePerUnit: targetPricePerUnit ? Number(targetPricePerUnit) : null,
      location: {
        city: location?.city || '',
        state: location?.state || '',
        country: location?.country || 'India',
        coordinates: location?.coordinates || { lat: 0, lng: 0 }
      },
      deadline: deadline ? new Date(deadline) : null,
      requiredAttributes: Array.isArray(requiredAttributes) ? requiredAttributes : [],
      preferredSellerTypes: Array.isArray(preferredSellerTypes) ? preferredSellerTypes : [],
      bulkRequired: Boolean(bulkRequired),
      status: 'OPEN'
    });

    res.status(201).json({
      success: true,
      message: 'B2B requirement created successfully.',
      requirement
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all public B2B requirements (or current buyer's requirements)
// @route   GET /api/b2b/requirements
// @access  Public / Private
export const getRequirements = async (req, res, next) => {
  try {
    const { status, category, myOnly, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (myOnly === 'true' && req.user) {
      filter.buyerId = req.user._id;
    } else {
      filter.status = status || { $in: ['OPEN', 'MATCHED', 'IN_DISCUSSION'] };
    }

    if (category) {
      filter.category = new RegExp(category.trim(), 'i');
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const [total, requirements] = await Promise.all([
      BuyerRequirement.countDocuments(filter),
      BuyerRequirement.find(filter)
        .populate('buyerId', 'name buyerProfile.businessName buyerProfile.businessType buyerProfile.location')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      requirements
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single requirement with full details
// @route   GET /api/b2b/requirements/:id
// @access  Public / Private
export const getRequirementById = async (req, res, next) => {
  try {
    const requirement = await BuyerRequirement.findById(req.params.id)
      .populate('buyerId', 'name email phone buyerProfile')
      .lean();

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    // Protect private contact details if requester is not the buyer and not an admin
    const isOwner = req.user && req.user._id.toString() === requirement.buyerId?._id?.toString();
    const isAdmin = req.user && req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin && requirement.buyerId) {
      delete requirement.buyerId.email;
      delete requirement.buyerId.phone;
    }

    res.json({
      success: true,
      requirement,
      isOwner
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update requirement (Owner only)
// @route   PUT /api/b2b/requirements/:id
// @access  Private
export const updateRequirement = async (req, res, next) => {
  try {
    const requirement = await BuyerRequirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    if (requirement.buyerId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this requirement.' });
    }

    const {
      title,
      description,
      category,
      quantity,
      budgetMin,
      budgetMax,
      deadline,
      status
    } = req.body;

    if (title) requirement.title = title.trim();
    if (description) requirement.description = description.trim();
    if (category) requirement.category = category.trim();
    if (quantity) requirement.quantity = Number(quantity);
    if (budgetMin !== undefined) requirement.budgetMin = budgetMin ? Number(budgetMin) : null;
    if (budgetMax !== undefined) requirement.budgetMax = budgetMax ? Number(budgetMax) : null;
    if (deadline) requirement.deadline = new Date(deadline);
    if (status) requirement.status = status;

    await requirement.save();

    res.json({
      success: true,
      message: 'Requirement updated successfully.',
      requirement
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Run intelligent matching engine for a requirement
// @route   POST /api/b2b/requirements/:id/matches
// @access  Public / Private
export const getRequirementMatches = async (req, res, next) => {
  try {
    const requirement = await BuyerRequirement.findById(req.params.id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    // Fetch approved/verified sellers
    const sellers = await SellerProfile.find({
      verificationStatus: { $in: ['APPROVED', 'VERIFIED'] },
      isOpen: true
    }).lean();

    // Fetch products for these sellers to check category & catalog relevance
    const sellerIds = sellers.map((s) => s._id);
    const products = await Product.find({
      sellerId: { $in: sellerIds },
      isPublished: true,
      isActive: true
    })
      .populate('categoryId', 'name slug')
      .lean();

    // Group products by seller
    const sellersWithProducts = sellers.map((seller) => ({
      seller,
      products: products.filter((p) => p.sellerId?.toString() === seller._id.toString())
    }));

    // Run deterministic matching engine
    const matches = matchRequirementToSellers(requirement, sellersWithProducts);

    // Update requirement matchedSellerCount
    requirement.matchedSellerCount = matches.length;
    if (requirement.status === 'OPEN' && matches.length > 0) {
      requirement.status = 'MATCHED';
    }
    await requirement.save();

    // Track analytics match view
    trackEvent({
      eventType: 'B2B_MATCH_VIEW',
      userId: req.user?._id || null,
      metadata: { requirementId: requirement._id, matchesCount: matches.length },
      source: 'B2B'
    });

    res.json({
      success: true,
      requirementId: requirement._id,
      matchesCount: matches.length,
      matches
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send bulk enquiry to a matched seller from a requirement
// @route   POST /api/b2b/requirements/:id/enquiries
// @access  Private
export const sendBulkEnquiry = async (req, res, next) => {
  try {
    const { sellerId, quantity, message, contactPhone, contactEmail, targetPrice } = req.body;
    const requirementId = req.params.id;

    const requirement = await BuyerRequirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    const seller = await SellerProfile.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Enquiry message is required.' });
    }

    const enquiry = await Enquiry.create({
      customerId: req.user._id,
      sellerId,
      requirementId,
      enquiryType: 'B2B_REQUIREMENT',
      quantity: Number(quantity) || requirement.quantity || 1,
      message: message.trim(),
      contactPhone: contactPhone || req.user.phone || '',
      contactEmail: contactEmail || req.user.email || '',
      quotedPrice: targetPrice ? Number(targetPrice) : null,
      status: 'PENDING'
    });

    // Update requirement status and count
    requirement.enquiriesCount = (requirement.enquiriesCount || 0) + 1;
    requirement.status = 'IN_DISCUSSION';
    await requirement.save();

    // Track analytics event
    trackEvent({
      eventType: 'ENQUIRY_CREATED',
      sellerId,
      userId: req.user._id,
      source: 'B2B',
      metadata: { requirementId, enquiryId: enquiry._id }
    });

    res.status(201).json({
      success: true,
      message: `B2B Bulk Enquiry successfully sent to ${seller.businessName}.`,
      enquiry
    });
  } catch (err) {
    next(err);
  }
};

// @desc    AI Assistant for structuring B2B requirement from unstructured prompt
// @route   POST /api/b2b/ai-assist
// @access  Private
export const aiAssistRequirement = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a requirement description.' });
    }

    const extracted = await extractRequirementFromText(prompt);

    res.json({
      success: true,
      extracted
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seller updates their B2B Profile (capacity, MOQ, bulk available)
// @route   PUT /api/b2b/seller/profile
// @access  Private (Seller only)
export const updateSellerB2BProfile = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const {
      enabled,
      productionCapacity,
      minimumOrderQuantity,
      bulkAvailable,
      leadTimeDays,
      businessCategories,
      serviceLocations,
      catalogSummary
    } = req.body;

    seller.b2bProfile = {
      enabled: enabled !== undefined ? Boolean(enabled) : seller.b2bProfile?.enabled || false,
      productionCapacity: productionCapacity !== undefined ? Number(productionCapacity) : seller.b2bProfile?.productionCapacity || 0,
      minimumOrderQuantity: minimumOrderQuantity !== undefined ? Number(minimumOrderQuantity) : seller.b2bProfile?.minimumOrderQuantity || 1,
      bulkAvailable: bulkAvailable !== undefined ? Boolean(bulkAvailable) : seller.b2bProfile?.bulkAvailable || false,
      leadTimeDays: leadTimeDays !== undefined ? Number(leadTimeDays) : seller.b2bProfile?.leadTimeDays || 7,
      businessCategories: Array.isArray(businessCategories) ? businessCategories : seller.b2bProfile?.businessCategories || [],
      serviceLocations: Array.isArray(serviceLocations) ? serviceLocations : seller.b2bProfile?.serviceLocations || [],
      catalogSummary: catalogSummary !== undefined ? catalogSummary : seller.b2bProfile?.catalogSummary || ''
    };

    await seller.save();

    res.json({
      success: true,
      message: 'Seller B2B configuration updated successfully.',
      b2bProfile: seller.b2bProfile
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seller views incoming B2B Enquiries
// @route   GET /api/b2b/seller/enquiries
// @access  Private (Seller only)
export const getSellerB2BEnquiries = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const enquiries = await Enquiry.find({
      sellerId: seller._id,
      enquiryType: 'B2B_REQUIREMENT'
    })
      .populate('customerId', 'name email phone buyerProfile')
      .populate('requirementId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: enquiries.length,
      enquiries
    });
  } catch (err) {
    next(err);
  }
};
