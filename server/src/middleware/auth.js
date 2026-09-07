import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const secret = process.env.JWT_SECRET || 'swashop_super_secret_jwt_key_phase1_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    req.user = user;

    // If user is a SELLER, also attach sellerProfile if it exists
    if (user.role === 'SELLER') {
      const profile = await SellerProfile.findOne({ userId: user._id });
      req.sellerProfile = profile || null;
    }

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.'
      });
    }
    next(err);
  }
};

// Optional authentication (for discovery/public endpoints where logged-in users get extra details like distance, saved status, or reselling buttons)
export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET || 'swashop_super_secret_jwt_key_phase1_2026';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
      if (user.role === 'SELLER') {
        const profile = await SellerProfile.findOne({ userId: user._id });
        req.sellerProfile = profile || null;
      }
    }
    next();
  } catch (err) {
    // If optional auth fails, proceed as guest
    next();
  }
};
