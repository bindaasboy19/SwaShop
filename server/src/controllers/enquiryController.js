import Enquiry from '../models/Enquiry.js';
import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';

// @desc    Send a new enquiry to a seller (Customer or Seller acting as Customer)
// @route   POST /api/enquiries
// @access  Private (Customer or Seller)
export const createEnquiry = async (req, res, next) => {
  try {
    const { sellerId, productId, message, contactPhone, contactEmail } = req.body;

    if (!sellerId || !message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide seller ID and enquiry message.'
      });
    }

    // Verify seller exists
    const seller = await SellerProfile.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'The seller you are trying to contact could not be found.'
      });
    }

    // If productId provided, verify it exists
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Referenced product not found.'
        });
      }
    }

    const enquiry = await Enquiry.create({
      customerId: req.user._id, // Works for CUSTOMER and SELLER!
      sellerId,
      productId: productId || null,
      message: message.trim(),
      contactPhone: contactPhone ? contactPhone.trim() : (req.user.phone || ''),
      contactEmail: contactEmail ? contactEmail.trim() : req.user.email,
      status: 'PENDING'
    });

    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('sellerId', 'businessName sellerType city phone logo')
      .populate('productId', 'name price images');

    res.status(201).json({
      success: true,
      message: 'Your enquiry has been sent to the seller successfully.',
      enquiry: populatedEnquiry
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all enquiries sent by the current user (Customer or Seller acting as Customer)
// @route   GET /api/enquiries/sent
// @access  Private (Customer or Seller)
export const getMySentEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find({ customerId: req.user._id })
      .populate('sellerId', 'businessName sellerType city phone logo')
      .populate('productId', 'name price images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: enquiries.length,
      enquiries
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all enquiries received by the current seller's shop
// @route   GET /api/enquiries/received
// @access  Private (Seller only)
export const getMyReceivedEnquiries = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const enquiries = await Enquiry.find({ sellerId: req.sellerProfile._id })
      .populate('customerId', 'name email phone avatar')
      .populate('productId', 'name price images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: enquiries.length,
      enquiries
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update enquiry status and add seller response
// @route   PATCH /api/enquiries/:id
// @access  Private (Seller only)
export const updateEnquiryStatus = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Seller profile required.'
      });
    }

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    // Ensure only the recipient seller can respond
    if (enquiry.sellerId.toString() !== req.sellerProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot modify an enquiry sent to another seller.'
      });
    }

    const { status, responseMessage } = req.body;
    if (status) {
      if (!['PENDING', 'RESPONDED', 'CLOSED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Allowed values: PENDING, RESPONDED, CLOSED.'
        });
      }
      enquiry.status = status;
    }

    if (responseMessage !== undefined) {
      enquiry.responseMessage = responseMessage.trim();
      if (!status) {
        enquiry.status = 'RESPONDED';
      }
    }

    await enquiry.save();

    const updatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('customerId', 'name email phone avatar')
      .populate('productId', 'name price images');

    res.json({
      success: true,
      message: 'Enquiry updated successfully.',
      enquiry: updatedEnquiry
    });
  } catch (err) {
    next(err);
  }
};
