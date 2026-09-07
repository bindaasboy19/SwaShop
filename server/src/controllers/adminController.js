import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Enquiry from '../models/Enquiry.js';
import ResellerListing from '../models/ResellerListing.js';

// @desc    Get real-time Admin Dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalSellers,
      activeSellers,
      pendingSellers,
      totalProducts,
      publishedProducts,
      totalCategories,
      totalEnquiries,
      totalResellerListings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'CUSTOMER' }),
      User.countDocuments({ role: 'SELLER' }),
      SellerProfile.countDocuments({ verificationStatus: 'APPROVED', isOpen: true }),
      SellerProfile.countDocuments({ verificationStatus: 'PENDING' }),
      Product.countDocuments(),
      Product.countDocuments({ isPublished: true, isActive: true }),
      Category.countDocuments(),
      Enquiry.countDocuments(),
      ResellerListing.countDocuments({ isActive: true })
    ]);

    // Recent 5 pending sellers for quick approval
    const recentPendingSellers = await SellerProfile.find({ verificationStatus: 'PENDING' })
      .populate('userId', 'name email phone createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 products
    const recentProducts = await Product.find()
      .populate('sellerId', 'businessName')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCustomers,
        totalSellers,
        activeSellers,
        pendingSellers,
        totalProducts,
        publishedProducts,
        totalCategories,
        totalEnquiries,
        totalResellerListings
      },
      recentPendingSellers,
      recentProducts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get users list with role filter and search
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (role) {
      query.role = role.toUpperCase();
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Activate or deactivate user account
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const targetUserId = req.params.id;

    // Prevent self-deactivation by active admin
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.'
      });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    res.json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get sellers list with verification status filter
// @route   GET /api/admin/sellers
// @access  Private (Admin only)
export const getSellers = async (req, res, next) => {
  try {
    const { status, sellerType, search } = req.query;
    const query = {};

    if (status) {
      query.verificationStatus = status.toUpperCase();
    }

    if (sellerType) {
      query.sellerType = sellerType;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ businessName: regex }, { city: regex }, { phone: regex }];
    }

    const sellers = await SellerProfile.find(query)
      .populate('userId', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: sellers.length,
      sellers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update seller verification status (APPROVE, REJECT, SUSPEND, PENDING)
// @route   PATCH /api/admin/sellers/:id/verification
// @access  Private (Admin only)
export const updateSellerVerification = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${allowed.join(', ')}`
      });
    }

    const seller = await SellerProfile.findById(req.params.id).populate('userId');
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found.'
      });
    }

    seller.verificationStatus = status;
    await seller.save();

    res.json({
      success: true,
      message: `Seller '${seller.businessName}' verification status updated to ${status}.`,
      seller
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all products for moderation
// @route   GET /api/admin/products
// @access  Private (Admin only)
export const getAdminProducts = async (req, res, next) => {
  try {
    const { search, isPublished, isActive, categoryId } = req.query;
    const query = {};

    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (categoryId) query.categoryId = categoryId;

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { description: regex }];
    }

    const products = await Product.find(query)
      .populate('sellerId', 'businessName sellerType verificationStatus city')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Moderate product status (hide or deactivate product)
// @route   PATCH /api/admin/products/:id/status
// @access  Private (Admin only)
export const updateProductStatus = async (req, res, next) => {
  try {
    const { isActive, isPublished } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    if (isActive !== undefined) product.isActive = Boolean(isActive);
    if (isPublished !== undefined) product.isPublished = Boolean(isPublished);

    await product.save();

    res.json({
      success: true,
      message: 'Product status updated successfully.',
      product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    List all platform Administrators
// @route   GET /api/admin/admins
// @access  Private (Admin only)
export const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'ADMIN' }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new Administrator account (Authorized Admin only)
// @route   POST /api/admin/admins
// @access  Private (Admin only)
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and temporary password for the new administrator.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const passwordHash = await User.hashPassword(password);

    const newAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'ADMIN',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'New Administrator account created successfully.',
      admin: newAdmin
    });
  } catch (err) {
    next(err);
  }
};
