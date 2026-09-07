import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('swashop_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    try {
      if (!localStorage.getItem('swashop_token')) {
        setUser(null);
        setSellerProfile(null);
        setIsLoading(false);
        return;
      }
      const data = await axiosClient.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        setSellerProfile(data.sellerProfile || null);
      }
    } catch (err) {
      console.warn('Authentication token invalid or expired:', err.message);
      localStorage.removeItem('swashop_token');
      setToken(null);
      setUser(null);
      setSellerProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthExpired = () => {
      setUser(null);
      setSellerProfile(null);
      setToken(null);
      showToast('Your session has expired. Please sign in again.', 'info');
    };

    window.addEventListener('swashop-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('swashop-auth-expired', handleAuthExpired);
  }, [fetchCurrentUser, showToast]);

  const login = async (email, password) => {
    try {
      const data = await axiosClient.post('/auth/login', { email, password });
      if (data.success) {
        localStorage.setItem('swashop_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setSellerProfile(data.sellerProfile || null);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        return data;
      }
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const data = await axiosClient.post('/auth/register', userData);
      if (data.success) {
        localStorage.setItem('swashop_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setSellerProfile(data.sellerProfile || null);
        showToast(`Welcome to SwaShop, ${data.user.name}!`, 'success');
        return data;
      }
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('swashop_token');
      setToken(null);
      setUser(null);
      setSellerProfile(null);
      showToast('You have been logged out.', 'info');
    }
  };

  const updateLocalUser = (updatedUser, updatedSellerProfile = null) => {
    if (updatedUser) setUser(updatedUser);
    if (updatedSellerProfile) setSellerProfile(updatedSellerProfile);
  };

  // Role Checks
  const role = user?.role || null;
  const isAuthenticated = Boolean(user && token);
  // Important: Sellers inherently possess Customer capabilities!
  const isCustomer = role === 'CUSTOMER' || role === 'SELLER';
  const isSeller = role === 'SELLER';
  const isAdmin = role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        sellerProfile,
        token,
        isLoading,
        isAuthenticated,
        role,
        isCustomer,
        isSeller,
        isAdmin,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        updateLocalUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
