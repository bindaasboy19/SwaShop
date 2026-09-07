import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';

// Public Pages
import HomePage from '../components/pages/public/HomePage.jsx';
import ExplorePage from '../components/pages/public/ExplorePage.jsx';
import CategoryProductsPage from '../components/pages/public/CategoryProductsPage.jsx';
import ProductDetailPage from '../components/pages/public/ProductDetailPage.jsx';
import SellerDetailPage from '../components/pages/public/SellerDetailPage.jsx';
import LoginPage from '../components/pages/public/LoginPage.jsx';
import RegisterPage from '../components/pages/public/RegisterPage.jsx';

// Customer Pages
import SavedItemsPage from '../components/pages/customer/SavedItemsPage.jsx';
import CustomerEnquiriesPage from '../components/pages/customer/CustomerEnquiriesPage.jsx';
import CustomerProfilePage from '../components/pages/customer/CustomerProfilePage.jsx';

// Seller Pages
import SellerOnboardingPage from '../components/pages/seller/SellerOnboardingPage.jsx';
import SellerDashboardPage from '../components/pages/seller/SellerDashboardPage.jsx';
import SellerCataloguePage from '../components/pages/seller/SellerCataloguePage.jsx';
import AddProductPage from '../components/pages/seller/AddProductPage.jsx';
import EditProductPage from '../components/pages/seller/EditProductPage.jsx';
import SellerResellingPage from '../components/pages/seller/SellerResellingPage.jsx';
import SellerEnquiriesPage from '../components/pages/seller/SellerEnquiriesPage.jsx';
import SellerSettingsPage from '../components/pages/seller/SellerSettingsPage.jsx';

// Admin Pages
import AdminDashboardPage from '../components/pages/admin/AdminDashboardPage.jsx';
import AdminUsersPage from '../components/pages/admin/AdminUsersPage.jsx';
import AdminSellersPage from '../components/pages/admin/AdminSellersPage.jsx';
import AdminProductsPage from '../components/pages/admin/AdminProductsPage.jsx';
import AdminCategoriesPage from '../components/pages/admin/AdminCategoriesPage.jsx';
import AdminAdminsPage from '../components/pages/admin/AdminAdminsPage.jsx';

// 404 Fallback
const NotFoundPage = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
    <h1 className="text-7xl font-extrabold text-slate-200 mb-2">404</h1>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h2>
    <p className="text-sm text-slate-500 max-w-md mb-6">
      The page or listing you are looking for might have been moved, deactivated, or does not exist.
    </p>
    <Link
      to="/"
      className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-full shadow-xs transition"
    >
      Return to Marketplace
    </Link>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/categories/:slug" element={<CategoryProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/sellers/:id" element={<SellerDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Customer Routes (Inherited by SELLER as well) */}
      <Route
        path="/customer/saved"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <SavedItemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <SavedItemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/enquiries"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerEnquiriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enquiries"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerEnquiriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Seller Onboarding (Customer can upgrade to Seller) */}
      <Route
        path="/seller/onboarding"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <SellerOnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Seller Dedicated Portal */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <SellerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/dashboard"
        element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <SellerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/products"
        element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <SellerCataloguePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/products/new"
        element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <AddProductPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/products/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <EditProductPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/reselling"
        element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <SellerResellingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/enquiries"
        element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <SellerEnquiriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/settings"
        element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <SellerSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Operations Console */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sellers"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminSellersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminCategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/admins"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminAdminsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
