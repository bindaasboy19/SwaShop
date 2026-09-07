import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Package,
  Store,
  X,
  RotateCcw,
  Check
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

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { coords, locationLabel } = useLocation();

  // State from query parameters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSellerType, setSelectedSellerType] = useState(searchParams.get('sellerType') || '');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'newest');
  const [maxDistance, setMaxDistance] = useState(searchParams.get('maxDistance') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('view') || 'products'); // 'products' or 'sellers'

  // Data state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Load Categories once
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

  // Fetch Products & Sellers when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedSellerType) params.append('sellerType', selectedSellerType);
        if (sortOption) params.append('sort', sortOption);
        if (maxDistance) params.append('maxDistanceKm', maxDistance);

        // Always pass coordinates for accurate distance calculation
        params.append('lat', coords.lat);
        params.append('lng', coords.lng);

        if (activeTab === 'products') {
          const prodRes = await axiosClient.get(`/products?${params.toString()}`);
          if (prodRes.success) setProducts(prodRes.products);
        } else {
          const sellRes = await axiosClient.get(`/sellers?${params.toString()}`);
          if (sellRes.success) setSellers(sellRes.sellers);
        }
      } catch (err) {
        console.error('Failed to query marketplace:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [search, selectedCategory, selectedSellerType, sortOption, maxDistance, activeTab, coords.lat, coords.lng]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSellerType('');
    setSortOption('newest');
    setMaxDistance('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Local Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse authentic products and verified artisans around <strong className="text-slate-800">{locationLabel}</strong>
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
            <span>Shops & Makers ({sellers.length})</span>
          </button>
        </div>
      </div>

      {/* Main Search Bar & Quick Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product title, material, tag, or seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort Options */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl focus:border-brand-500 outline-none w-full sm:w-auto"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="distance">Nearest Distance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Most Viewed</option>
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
              <span>Filter Options</span>
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
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

          {/* Maximum Distance Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Max Distance (from {locationLabel})
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Any', value: '' },
                { label: '< 5 km', value: '5' },
                { label: '< 15 km', value: '15' },
                { label: '< 30 km', value: '30' },
                { label: '< 50 km', value: '50' }
              ].map((d) => (
                <button
                  key={d.value}
                  onClick={() => setMaxDistance(d.value)}
                  className={`py-2 px-3 rounded-xl font-semibold border transition text-center ${
                    maxDistance === d.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <div className="lg:col-span-3">
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
              <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-lg">No products found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search terms, changing categories, or clearing distance filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  Reset All Filters
                </button>
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
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
