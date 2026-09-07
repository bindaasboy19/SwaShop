import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, Tag, Sparkles, MapPin } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useLocation } from '../../context/LocationContext.jsx';
import ProductCard from '../../marketplace/ProductCard.jsx';

const CategoryProductsPage = () => {
  const { slug } = useParams();
  const { coords, locationLabel } = useLocation();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [sortOption, setSortOption] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch all categories to find matching category info
        const catRes = await axiosClient.get('/categories');
        let currentCat = null;
        if (catRes.success && catRes.categories) {
          currentCat = catRes.categories.find((c) => c.slug === slug);
          setCategory(currentCat || { name: slug.replace(/-/g, ' ').toUpperCase(), description: '' });
        }

        // Fetch products matching category
        const params = new URLSearchParams();
        params.append('category', slug);
        params.append('sort', sortOption);
        params.append('lat', coords.lat);
        params.append('lng', coords.lng);

        const prodRes = await axiosClient.get(`/products?${params.toString()}`);
        if (prodRes.success) {
          setProducts(prodRes.products || []);
        }
      } catch (err) {
        console.error('Failed to load category products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [slug, sortOption, coords]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-emerald-700">Home</Link>
            <span>/</span>
            <Link to="/explore" className="hover:text-emerald-700">Explore</Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">{category?.name || slug}</span>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Categories
          </Link>
        </div>

        {/* Category Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-medium backdrop-blur-sm">
              <Tag className="w-3.5 h-3.5" />
              Category Showcase
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {category?.name || 'Local Creations'}
            </h1>
            <p className="text-emerald-100/90 text-sm leading-relaxed">
              {category?.description || 'Discover authentic handmade, local, and artisanal items directly from verified regional sellers.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm self-stretch sm:self-auto justify-center">
            <MapPin className="w-4 h-4 text-emerald-300" />
            <span>Browsing around <strong className="text-white">{locationLabel}</strong></span>
          </div>
        </div>

        {/* Filters and Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-sm text-gray-600">
            Showing <span className="font-bold text-gray-900">{products.length}</span> {products.length === 1 ? 'product' : 'products'}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Sort By:
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full sm:w-auto text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="nearest">Nearest Distance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
                <div className="h-44 bg-gray-100 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products in this category yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Our local artisans and shops are continually adding new products. Check back soon or explore other categories.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Explore All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryProductsPage;
