import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldAlert } from 'lucide-react';

/**
 * ProtectedRoute Guard
 * 
 * Rules:
 * 1. Authenticated check: Redirects unauthenticated visitors to /login
 * 2. Role Inheritance:
 *    - Role 'SELLER' inherits all 'CUSTOMER' capabilities.
 *    - Role 'CUSTOMER' cannot access 'SELLER' or 'ADMIN' areas.
 *    - Role 'ADMIN' governs platform and cannot be registered publicly.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-rose-100 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Account Suspended</h2>
          <p className="text-sm text-gray-600">
            Your account has been deactivated by a platform administrator. Please contact support if you believe this is in error.
          </p>
        </div>
      </div>
    );
  }

  if (allowedRoles.length > 0) {
    let hasAccess = false;

    // Check direct role match
    if (allowedRoles.includes(user.role)) {
      hasAccess = true;
    }

    // Role Inheritance: SELLER has all CUSTOMER access
    if (allowedRoles.includes('CUSTOMER') && user.role === 'SELLER') {
      hasAccess = true;
    }

    if (!hasAccess) {
      // If a CUSTOMER tries to access SELLER dashboard, guide them to onboarding
      if (allowedRoles.includes('SELLER') && user.role === 'CUSTOMER') {
        return <Navigate to="/seller/onboarding" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
