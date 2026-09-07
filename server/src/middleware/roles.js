/**
 * Role-Based Access Control Middleware
 * Roles: CUSTOMER, SELLER, ADMIN
 * Rule: SELLER inherently inherits all CUSTOMER capabilities!
 */

// Endpoints requiring Customer capabilities (both CUSTOMER and SELLER are allowed)
export const requireCustomerOrSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role === 'CUSTOMER' || req.user.role === 'SELLER') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Only customers and sellers can perform this action.'
  });
};

// Endpoints requiring Seller capabilities (only SELLER is allowed)
export const requireSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'SELLER') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only registered sellers can access this resource.'
    });
  }

  next();
};

// Endpoints requiring Admin capabilities (only ADMIN is allowed)
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }

  next();
};
