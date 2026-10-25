import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Helper to calculate distance in km using Haversine formula
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// @desc    Get current seller profile
// @route   GET /api/sellers/profile
// @access  Private (Seller only)
export const getMySellerProfile = async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      // Auto-create initial profile for seller if missing
      profile = await SellerProfile.create({
        userId: req.user._id,
        businessName: `${req.user.name}'s Shop`,
        sellerType: 'LOCAL_SHOP',
        phone: req.user.phone || '',
        verificationStatus: 'PENDING'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update current seller business profile
// @route   PUT /api/sellers/profile
// @access  Private (Seller only)
export const updateSellerProfile = async (req, res, next) => {
  try {
    const {
      businessName,
      sellerType,
      description,
      category,
      phone,
      address,
      city,
      state,
      pincode,
      coordinates,
      businessHours,
      isOpen,
      logo,
      coverImage
    } = req.body;

    let profile = await SellerProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = new SellerProfile({ userId: req.user._id });
    }

    if (businessName) profile.businessName = businessName.trim();
    if (sellerType) profile.sellerType = sellerType;
    if (description !== undefined) profile.description = description.trim();
    if (category !== undefined) profile.category = category.trim();
    if (phone !== undefined) profile.phone = phone.trim();
    if (address !== undefined) profile.address = address.trim();
    if (city !== undefined) profile.city = city.trim();
    if (state !== undefined) profile.state = state.trim();
    if (pincode !== undefined) profile.pincode = pincode.trim();
    if (businessHours !== undefined) profile.businessHours = businessHours;
    if (isOpen !== undefined) profile.isOpen = Boolean(isOpen);
    if (logo !== undefined) profile.logo = logo;
    if (coverImage !== undefined) profile.coverImage = coverImage;

    if (coordinates && coordinates.lat !== undefined && coordinates.lng !== undefined) {
      profile.coordinates = {
        lat: parseFloat(coordinates.lat) || 0,
        lng: parseFloat(coordinates.lng) || 0
      };
      profile.location = {
        type: 'Point',
        coordinates: [profile.coordinates.lng, profile.coordinates.lat]
      };
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Seller profile updated successfully.',
      profile
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public seller profile by ID with products and distance
// @route   GET /api/sellers/:id
// @access  Public
export const getSellerById = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findById(req.params.id).populate('userId', 'name email avatar');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller shop not found.'
      });
    }

    // Retrieve active and published products for this seller
    const products = await Product.find({
      sellerId: seller._id,
      isPublished: true,
      isActive: true
    }).populate('categoryId', 'name slug icon');

    // Calculate distance if user coords provided in query
    let distanceKm = null;
    const { lat, lng } = req.query;
    if (lat && lng && seller.coordinates?.lat && seller.coordinates?.lng) {
      distanceKm = calculateDistanceKm(
        parseFloat(lat),
        parseFloat(lng),
        seller.coordinates.lat,
        seller.coordinates.lng
      );
    }

    res.json({
      success: true,
      seller,
      products,
      distanceKm
    });
  } catch (err) {
    next(err);
  }
};

// @desc    List all approved sellers (with optional type, city, search)
// @route   GET /api/sellers
// @access  Public
export const listSellers = async (req, res, next) => {
  try {
    const { sellerType, city, search, lat, lng } = req.query;
    const query = { verificationStatus: { $in: ['APPROVED', 'VERIFIED'] } };

    if (sellerType) {
      query.sellerType = sellerType;
    }

    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    let sellers = await SellerProfile.find(query).populate('userId', 'name email avatar');

    // Attach distance if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      sellers = sellers.map((s) => {
        const obj = s.toObject();
        if (s.coordinates?.lat && s.coordinates?.lng) {
          obj.distanceKm = calculateDistanceKm(userLat, userLng, s.coordinates.lat, s.coordinates.lng);
        } else {
          obj.distanceKm = null;
        }
        return obj;
      });

      // Sort by distance if requested
      if (req.query.sort === 'distance') {
        sellers.sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      }
    }

    res.json({
      success: true,
      count: sellers.length,
      sellers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seller requests verification badge
// @route   POST /api/sellers/verification/request
// @access  Private (Seller only)
export const requestVerification = async (req, res, next) => {
  try {
    const { documentType, documentNumber, reviewNotes, documentUrl } = req.body;

    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    seller.verificationStatus = 'PENDING';
    seller.verificationDetails = {
      requestedAt: new Date(),
      verifiedAt: null,
      reviewedBy: null,
      reviewNotes: reviewNotes || '',
      documentType: documentType || 'UDYAM',
      documentNumber: documentNumber || '',
      documentUrl: documentUrl || ''
    };

    await seller.save();

    res.json({
      success: true,
      message: 'Verification request submitted successfully. Our team will review your details.',
      verificationStatus: seller.verificationStatus,
      requestedAt: seller.verificationDetails.requestedAt
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current seller's verification status & timeline
// @route   GET /api/sellers/verification/status
// @access  Private (Seller only)
export const getVerificationStatus = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user._id });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    res.json({
      success: true,
      verificationStatus: seller.verificationStatus,
      verificationDetails: {
        requestedAt: seller.verificationDetails?.requestedAt,
        verifiedAt: seller.verificationDetails?.verifiedAt,
        documentType: seller.verificationDetails?.documentType,
        reviewNotes: seller.verificationDetails?.reviewNotes
      }
    });
  } catch (err) {
    next(err);
  }
};
