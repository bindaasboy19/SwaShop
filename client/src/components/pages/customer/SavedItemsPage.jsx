import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Package, Store, ArrowRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import ProductCard from '../../marketplace/ProductCard.jsx';
import SellerCard from '../../marketplace/SellerCard.jsx';

const SavedItemsPage = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'sellers'
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSaved = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/favourites');
      if (res.success) {
        setProducts(res.products || []);
        setSellers(res.sellers || []);
      }
    } catch (err) {
      console.error('Failed to fetch favourites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            <span>Saved Items & Favourites</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Keep track of the local crafts and artisan shops you love
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl">
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
            <span>Shops ({sellers.length})</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'products' ? (
        products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p._id}
                product={{ ...p, isSaved: true }}
                onSaveToggle={() => fetchSaved()}
              />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Heart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-lg">No saved products yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Explore the marketplace and click the heart icon on any product to save it here.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )
      ) : (
        sellers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sellers.map((s) => (
              <SellerCard key={s._id} seller={s} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Store className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-lg">No saved shops yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Browse artisan stores and click the bookmark button on any shop profile to save it.
            </p>
            <Link
              to="/explore?view=sellers"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <span>Discover Shops</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )
      )}
    </div>
  );
};

export default SavedItemsPage;
