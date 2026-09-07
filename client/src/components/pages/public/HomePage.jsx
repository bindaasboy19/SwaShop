import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Sparkles,
  Store,
  ShieldCheck,
  Repeat,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  CheckCircle
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useLocation } from '../../context/LocationContext.jsx';
import ProductCard from '../../components/marketplace/ProductCard.jsx';
import SellerCard from '../../components/marketplace/SellerCard.jsx';
import headerBannerImg from '../../assets/website-header.png';
import LocationModal from '../../components/modals/LocationModal.jsx';

const HomePage = () => {
  const { coords, locationLabel, hasLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [nearbyProducts, setNearbyProducts] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Categories
        const catRes = await axiosClient.get('/categories');
        if (catRes.success) setCategories(catRes.categories);

        // 2. Fetch Nearby Products using coordinates
        const nearbyRes = await axiosClient.get(
          `/search/nearby?lat=${coords.lat}&lng=${coords.lng}&radiusKm=50`
        );
        if (nearbyRes.success) {
          setNearbyProducts(nearbyRes.products.slice(0, 8));
        }

        // 3. Fetch Featured Approved Sellers
        const sellersRes = await axiosClient.get(
          `/sellers?lat=${coords.lat}&lng=${coords.lng}&sort=distance`
        );
        if (sellersRes.success) {
          setFeaturedSellers(sellersRes.sellers.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load homepage marketplace data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [coords.lat, coords.lng]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Official SwaShop Brand Header Treatment */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/60 via-slate-50 to-white pt-6 pb-12 sm:pb-16 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Branded Official Website-Header Asset Integration */}
          <div className="mb-8 rounded-3xl overflow-hidden shadow-lg border border-amber-100 bg-white">
            <img
              src={headerBannerImg}
              alt="SwaShop — Smart Market Linkage Platform"
              className="w-full h-auto object-cover max-h-[340px]"
            />
          </div>

          {/* Hero Content & Discovery Bar */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Smart Market Linkage for Artisans & MSMEs</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Discover Authentic Local Crafts, Goods & Regional Makers
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Connect directly with nearby bamboo artisans, handloom weavers, terracotta potters, and organic micro-entrepreneurs.
            </p>

            {/* Main Search & Location Bar */}
            <div className="pt-3 max-w-2xl mx-auto">
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white p-2 rounded-2xl sm:rounded-full shadow-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-2"
              >
                {/* Search input */}
                <div className="relative flex-1 w-full pl-3 flex items-center">
                  <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bamboo baskets, clay matkas, raw honey..."
                    className="w-full py-2.5 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
                  />
                </div>

                {/* Location Chip */}
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="max-w-[140px] truncate">{locationLabel}</span>
                </button>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md transition shrink-0"
                >
                  Explore Now
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Explore Craft & Product Categories</h2>
            <p className="text-xs sm:text-sm text-slate-500">Handcrafted goods directly managed by platform categories</p>
          </div>
          <Link
            to="/explore"
            className="text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/explore?category=${cat.slug}`}
              className="group p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-brand-300 hover:shadow-md transition text-center flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 group-hover:bg-brand-500 text-brand-700 group-hover:text-white flex items-center justify-center transition shadow-2xs">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-brand-600 transition leading-snug">
                {cat.name}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {cat.productCount !== undefined ? `${cat.productCount} items` : 'Browse'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Nearby Products / Featured Marketplace */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Nearby & Local Highlights</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                Near {locationLabel}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Authentic products with real distance calculation from your selected location
            </p>
          </div>
          <Link
            to="/explore?nearby=true"
            className="text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>See Nearest</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : nearbyProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nearbyProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No nearby products within 50 km</h3>
            <p className="text-xs text-slate-500 mt-1">Try selecting New Delhi / NCR or adjusting your location filter.</p>
          </div>
        )}
      </section>

      {/* Featured Verified Artisans & Local Shops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Featured Local Shops & Artisans</h2>
            <p className="text-xs sm:text-sm text-slate-500">Verified makers and micro-entrepreneurs on SwaShop</p>
          </div>
          <Link
            to="/explore?view=sellers"
            className="text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>All Sellers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredSellers.map((seller) => (
            <SellerCard key={seller._id} seller={seller} />
          ))}
        </div>
      </section>

      {/* How SwaShop Works (Customer, Maker & Reseller System) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-3 mb-10">
            <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
              The SwaShop Ecosystem
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Empowering Artisans, Connecting Resellers, Serving Customers
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Phase 1 establishes the foundational marketplace where makers create products, sellers can acquire and resell items from other shops, and customers discover nearby treasures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300">
            {/* 1. Customer Discovery */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-white font-bold text-base">Hyperlocal Discovery</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Customers find unique local crafts, view precise distance in kilometers, check shop hours, and send direct product enquiries.
              </p>
            </div>

            {/* 2. Maker Digitize */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-white font-bold text-base">Artisan Digitization</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rural artisans and MSMEs easily create digital business profiles, upload pictures of their craft, and publish their catalogue.
              </p>
            </div>

            {/* 3. Buy & Resell Linkage */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-white font-bold text-base">Buy & Resell Linkage</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sellers can discover products from other artisans, set a resell price and quantity, and expand their catalogue with authentic source attribution.
              </p>
            </div>
          </div>

          {/* Seller CTA Banner inside */}
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white text-base">Ready to sell or resell on SwaShop?</p>
              <p className="text-xs text-slate-400">Join verified local merchants and expand your reach today.</p>
            </div>
            <Link
              to="/register?role=SELLER"
              className="px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition shrink-0"
            >
              Register as Seller
            </Link>
          </div>
        </div>
      </section>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
};

export default HomePage;
