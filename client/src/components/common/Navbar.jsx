import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import {
  Search,
  MapPin,
  Heart,
  MessageSquare,
  Store,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShoppingBag,
  PlusCircle,
  Repeat,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import logoImg from '../../assets/logo.png';
import LocationModal from '../modals/LocationModal.jsx';

const Navbar = () => {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const { locationLabel } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (path) => routerLocation.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        {/* Top announcement / Role highlight bar */}
        {isSeller && (
          <div className="bg-amber-500 text-white text-xs py-1.5 px-4 font-medium flex items-center justify-between">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                Seller Mode Active: You have full access to both Buyer Marketplace & Seller Shop!
              </span>
              <div className="flex items-center gap-3">
                <Link to="/seller/ai-studio" className="underline hover:text-amber-100 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                  AI Studio
                </Link>
                <span className="opacity-50">|</span>
                <Link to="/seller" className="underline hover:text-amber-100 font-semibold">
                  Go to Shop Dashboard →
                </Link>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 font-medium flex items-center justify-between">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                Administrator Console Access
              </span>
              <Link to="/admin" className="underline hover:text-white font-semibold text-amber-300">
                Admin Dashboard →
              </Link>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 gap-3 sm:gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src={logoImg}
                alt="SwaShop"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>

            {/* Location Selector Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition shrink-0"
              title="Change location for nearby discovery"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="max-w-[130px] truncate">{locationLabel}</span>
            </button>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search bamboo crafts, khadi, honey, clay pots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-full border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-slate-700">
              <Link
                to="/explore"
                className={`px-3 py-1.5 rounded-lg transition ${
                  isActive('/explore') ? 'text-brand-600 bg-brand-50 font-semibold' : 'hover:text-brand-600'
                }`}
              >
                Explore
              </Link>
              <Link
                to="/explore?nearby=true"
                className="px-3 py-1.5 rounded-lg hover:text-brand-600 transition flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                Nearby
              </Link>
              <Link
                to="/b2b"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  isActive('/b2b') ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-slate-700 hover:text-indigo-600'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>B2B Bulk</span>
              </Link>

              {/* Customer Specific (also visible to Seller) */}
              {isAuthenticated && (
                <>
                  <Link
                    to="/customer/saved"
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                      isActive('/customer/saved') ? 'text-brand-600 bg-brand-50 font-semibold' : 'hover:text-brand-600'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    Saved
                  </Link>
                  <Link
                    to="/customer/enquiries"
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                      isActive('/customer/enquiries') ? 'text-brand-600 bg-brand-50 font-semibold' : 'hover:text-brand-600'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    Enquiries
                  </Link>
                </>
              )}

              {/* Seller Quick Links */}
              {isSeller && (
                <>
                  <Link
                    to="/seller/ai-studio"
                    className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold transition flex items-center gap-1.5 border border-purple-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                    AI Studio
                  </Link>
                  <Link
                    to="/seller"
                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition flex items-center gap-1.5 border border-amber-200"
                  >
                    <Store className="w-4 h-4 text-amber-600" />
                    My Shop
                  </Link>
                </>
              )}

              {/* Admin Console Link */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-amber-400 hover:bg-slate-800 font-semibold transition flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Admin
                </Link>
              )}
            </nav>

            {/* User Auth Section */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 hidden md:block max-w-[100px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-sm"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 uppercase">
                          {user.role}
                        </span>
                      </div>

                      {/* Role-based navigation inside menu */}
                      {isSeller ? (
                        <>
                          <Link to="/seller/ai-studio" className="flex items-center gap-2.5 px-4 py-2 text-purple-700 bg-purple-50/70 hover:bg-purple-100 font-semibold rounded-lg mx-2 my-0.5">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            Seller AI Studio
                          </Link>
                          <Link to="/seller" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-medium">
                            <Store className="w-4 h-4 text-amber-600" />
                            Seller Dashboard
                          </Link>
                          <Link to="/seller/products" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-medium">
                            <ShoppingBag className="w-4 h-4 text-amber-600" />
                            My Catalogue
                          </Link>
                          <Link to="/seller/products/new" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-medium">
                            <PlusCircle className="w-4 h-4 text-amber-600" />
                            Add New Product
                          </Link>
                          <Link to="/seller/reselling" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-medium">
                            <Repeat className="w-4 h-4 text-amber-600" />
                            Reseller Listings
                          </Link>
                          <Link to="/seller/enquiries" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-medium">
                            <MessageSquare className="w-4 h-4 text-amber-600" />
                            Shop Enquiries
                          </Link>
                          <div className="border-t border-slate-100 my-1"></div>
                        </>
                      ) : null}

                      {isAdmin ? (
                        <>
                          <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium">
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            Admin Dashboard
                          </Link>
                          <div className="border-t border-slate-100 my-1"></div>
                        </>
                      ) : null}

                      {/* Customer actions */}
                      <Link to="/customer/profile" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium">
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        Account Profile
                      </Link>
                      <Link to="/customer/saved" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium">
                        <Heart className="w-4 h-4 text-rose-500" />
                        Saved Items
                      </Link>
                      <Link to="/customer/enquiries" className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        My Sent Enquiries
                      </Link>

                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={logout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-brand-600 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-full shadow-xs transition"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 lg:hidden hover:text-slate-900"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products, crafts, sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 rounded-full border border-slate-200 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>

            <button
              onClick={() => {
                setIsLocationModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Location: {locationLabel}</span>
              </span>
              <span className="text-brand-600 font-bold">Change</span>
            </button>

            <div className="flex flex-col space-y-1 font-medium text-slate-700 pt-2">
              <Link to="/explore" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                Explore Marketplace
              </Link>
              <Link to="/explore?nearby=true" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                Nearby Artisans & Shops
              </Link>
              <Link to="/b2b" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>B2B Market Linkage & Bulk</span>
              </Link>

              {isSeller && (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  <p className="text-xs font-bold uppercase text-amber-700 px-3 py-1">Seller Features</p>
                  <Link to="/seller/ai-studio" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    AI Studio
                  </Link>
                  <Link to="/seller" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                    Seller Dashboard
                  </Link>
                  <Link to="/seller/products" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                    My Catalogue
                  </Link>
                  <Link to="/seller/products/new" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                    Add Product
                  </Link>
                  <Link to="/seller/reselling" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                    Reseller Listings
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  <p className="text-xs font-bold uppercase text-slate-500 px-3 py-1">Admin Controls</p>
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg bg-slate-900 text-amber-400 font-semibold">
                    Admin Dashboard
                  </Link>
                </>
              )}

              {isAuthenticated ? (
                <>
                  <div className="border-t border-slate-100 my-1"></div>
                  <Link to="/customer/saved" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                    Saved Products & Shops
                  </Link>
                  <Link to="/customer/enquiries" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
                    My Sent Enquiries
                  </Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-left px-3 py-2 rounded-lg text-rose-600 font-semibold">
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center py-2.5 rounded-xl bg-brand-600 text-white font-semibold">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
