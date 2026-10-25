import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Package,
  Store,
  X,
  RotateCcw,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useLocation } from '../../context/LocationContext.jsx';
import ProductCard from '../../marketplace/ProductCard.jsx';
import SellerCard from '../../marketplace/SellerCard.jsx';

const SELLER_TYPES = [
  { value: '', label: 'All Seller Types' },
  { value: 'ARTISAN', label: 'Artisan Makers' },
  { value: 'LOCAL_SHOP', label: 'Local Shops' },
  { value: 'MSME', label: 'MSME Enterprises' },
  { value: 'MICRO_ENTREPRENEUR', label: 'Micro-Entrepreneurs' }
];

const AVAILABILITY_OPTIONS = [
  { value: 'ALL', label: 'All Stock' },
  { value: 'AVAILABLE', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' }
];

const RADIUS_OPTIONS = [
  { label: 'Any Distance', value: '' },
  { label: '< 2 km', value: '2' },
  { label: '< 5 km', value: '5' },
  { label: '< 10 km', value: '10' },
  { label: '< 25 km', value: '25' },
  { label: '< 50 km', value: '50' }
];

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { coords, locationLabel } = useLocation();

  // Search parameters
  const [search, setSearch] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSellerType, setSelectedSellerType] = useState(searchParams.get('sellerType') || '');
  const [selectedAvailability, setSelectedAvailability] = useState(searchParams.get('availability') || 'ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verifiedOnly') === 'true');
  const [b2bOnly, setB2bOnly] = useState(searchParams.get('b2bOnly') === 'true');
  const [radiusKm, setRadiusKm] = useState(searchParams.get('radiusKm') || searchParams.get('maxDistance') || '');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'relevance');
  const [activeTab, setActiveTab] = useState(searchParams.get('view') || 'products');

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Data state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [isSemantic, setIsSemantic] = useState(false);
  const [zeroResultsHelp, setZeroResultsHelp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get('/categories');
        if (res.success) setCategories(res.categories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch search suggestions as user types (debounced)
  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axiosClient.get(`/search/suggestions?q=${encodeURIComponent(search.trim())}`);
        if (res.success) {
          setSuggestions(res.suggestions || []);
        }
      } catch (err) {
        console.warn('Suggestions failed:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // Main data fetcher
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('q', search.trim());
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedSellerType) params.append('sellerType', selectedSellerType);
        if (selectedAvailability && selectedAvailability !== 'ALL') params.append('availability', selectedAvailability);
        if (verifiedOnly) params.append('verifiedOnly', 'true');
        if (b2bOnly) params.append('b2bOnly', 'true');
        if (radiusKm) params.append('radiusKm', radiusKm);
        if (sortOption) params.append('sort', sortOption);

        if (coords?.lat && coords?.lng) {
          params.append('lat', coords.lat);
          params.append('lng', coords.lng);
        }

        const res = await axiosClient.get(`/search?${params.toString()}`);
        if (res.success) {
          setProducts(res.products || []);
          setSellers(res.sellers || []);
          setIsSemantic(Boolean(res.isSemantic));
          setZeroResultsHelp(res.zeroResultsHelp || null);
        }
      } catch (err) {
        console.error('Failed to query marketplace:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    search,
    selectedCategory,
    selectedSellerType,
    selectedAvailability,
    verifiedOnly,
    b2bOnly,
    radiusKm,
    sortOption,
    coords?.lat,
    coords?.lng
  ]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSellerType('');
    setSelectedAvailability('ALL');
    setVerifiedOnly(false);
    setB2bOnly(false);
    setRadiusKm('');
    setSortOption('relevance');
    setSearchParams({});
  };

  const handleSelectSuggestion = (item) => {
    if (item.type === 'CATEGORY') {
      setSelectedCategory(item.slug);
      setSearch('');
    } else {
      setSearch(item.text);
    }
    setShowSuggestions(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Smart Market Linkage & Discovery
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-800 border border-brand-200">
              Phase 3 Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Discover nearby products & verified makers around</span>
            <strong className="text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-600 inline" />
              {locationLabel}
            </strong>
          </p>
        </div>

        {/* View Switcher: Products vs Sellers */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'products'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sellers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'sellers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Sellers & Makers ({sellers.length})</span>
          </button>
        </div>
      </div>

      {/* Main Search Bar & Suggestions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full" ref={searchInputRef}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, materials (e.g. handmade bamboo basket, eco friendly corporate gift)..."
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden divide-y divide-slate-100">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      {item.type === 'PRODUCT' && <Package className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                      {item.type === 'CATEGORY' && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {item.type === 'SELLER' && <Store className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      <span className="font-semibold text-slate-800">{item.text}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {item.type} {item.price ? `• ₹${item.price}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort Options */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl focus:border-brand-500 outline-none w-full sm:w-auto"
            >
              <option value="relevance">Multi-Factor Relevance</option>
              <option value="distance">Nearest Distance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            {/* Mobile Filter Drawer Trigger */}
            <button
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className="sm:hidden px-3.5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Semantic Intent Banner if Active */}
        {isSemantic && (
          <div className="bg-gradient-to-r from-brand-50 to-amber-50 border border-brand-200 px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs text-brand-900">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>Semantic Intent Detected: Matching catalog concepts for "{search}"</span>
            </span>
            <span className="text-[11px] font-bold text-brand-700 hidden sm:inline">Intelligent Expansion</span>
          </div>
        )}

        {/* Category Pills Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition ${
              selectedCategory === ''
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.slug === selectedCategory ? '' : cat.slug)}
              className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition ${
                selectedCategory === cat.slug
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className={`lg:block ${isFilterDrawerOpen ? 'block' : 'hidden'} bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-6`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <span>Advanced Filters</span>
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Quick Toggles: Verified & B2B */}
          <div className="space-y-2 pt-1 border-b border-slate-100 pb-4">
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Verified Sellers Only</span>
              </div>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">B2B / Bulk Available</span>
              </div>
              <input
                type="checkbox"
                checked={b2bOnly}
                onChange={(e) => setB2bOnly(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
            </label>
          </div>

          {/* Availability Filter */}
          <div className="border-b border-slate-100 pb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Stock Availability
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedAvailability(opt.value)}
                  className={`py-1.5 px-2 rounded-lg font-semibold border transition text-center text-[11px] ${
                    selectedAvailability === opt.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Radius Distance Filter */}
          <div className="border-b border-slate-100 pb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Radius (from {locationLabel})
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {RADIUS_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setRadiusKm(d.value)}
                  className={`py-1.5 px-2 rounded-lg font-semibold border transition text-center text-[11px] ${
                    radiusKm === d.value
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seller Type Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Seller Type
            </label>
            <div className="space-y-1.5">
              {SELLER_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedSellerType(type.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    selectedSellerType === type.value
                      ? 'bg-brand-50 text-brand-800 font-bold border border-brand-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{type.label}</span>
                  {selectedSellerType === type.value && <Check className="w-3.5 h-3.5 text-brand-600" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : activeTab === 'products' ? (
            products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-5">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xl">No matching products found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    We couldn't find exact listings for your current criteria. But SwaShop can connect you directly with local producers!
                  </p>
                </div>

                {/* B2B Bridge Callout */}
                {zeroResultsHelp?.b2bBridge && (
                  <div className="bg-gradient-to-br from-indigo-50 to-brand-50 border border-indigo-200 rounded-2xl p-6 max-w-lg mx-auto text-left space-y-3">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      <span>Post a B2B Requirement</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {zeroResultsHelp.b2bBridge.message}
                    </p>
                    <Link
                      to={`/b2b/requirements/new?title=${encodeURIComponent(search || 'Custom Requirement')}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      <span>Post Requirement Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )
          ) : (
            sellers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellers.map((seller) => (
                  <SellerCard key={seller._id} seller={seller} />
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <Store className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-lg">No shops or artisans found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No verified sellers matched your current filter criteria.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  Reset All Filters
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
