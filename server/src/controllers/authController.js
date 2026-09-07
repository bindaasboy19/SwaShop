import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'swashop_super_secret_jwt_key_phase1_2026';
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @desc    Register a new user (CUSTOMER or SELLER only)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    // Strictly enforce 3 roles and block public ADMIN registration
    const requestedRole = (role || 'CUSTOMER').toUpperCase();
    if (requestedRole === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Administrator accounts cannot be created via public registration.'
      });
    }

    if (!['CUSTOMER', 'SELLER'].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Allowed roles are CUSTOMER or SELLER.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: requestedRole
    });

    let sellerProfile = null;
    // If registering as SELLER, initialize pending seller profile
    if (requestedRole === 'SELLER') {
      sellerProfile = await SellerProfile.create({
        userId: user._id,
        businessName: req.body.businessName || `${name.trim()}'s Shop`,
        sellerType: req.body.sellerType || 'LOCAL_SHOP',
        phone: phone || '',
        verificationStatus: 'PENDING'
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user,
      sellerProfile
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    // Find user by email and explicitly include passwordHash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);

    let sellerProfile = null;
    if (user.role === 'SELLER') {
      sellerProfile = await SellerProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user,
      sellerProfile
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let sellerProfile = null;
    if (user.role === 'SELLER') {
      sellerProfile = await SellerProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user,
      sellerProfile
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user (client-side clears token, server confirms)
// @route   POST /api/auth/logout
// @access  Public
export const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};
