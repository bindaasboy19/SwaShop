import React, { useState, useEffect } from 'react';
import { Package, Search, Eye, EyeOff, ShieldCheck, ShieldAlert, AlertCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await axiosClient.get(`/admin/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.products || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch products.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleProduct = async (product) => {
    try {
      const res = await axiosClient.patch(`/admin/products/${product._id}/status`, {
        isActive: !product.isActive
      });
      if (res.success) {
        showToast(res.message, 'success');
        fetchProducts();
      }
    } catch (err) {
      showToast(err.message || 'Moderation action failed.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Package className="w-7 h-7 text-blue-600" />
          <span>Product Moderation</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Oversee public listings, inspect compliance, and deactivate reported or prohibited items
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="relative flex-1"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
          />
        </form>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {products.map((p) => (
            <div
              key={p._id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
            >
              <div className="flex items-center gap-4">
                <img
                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=200'}
                  alt={p.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                    <span className="font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                      ₹{p.price}
                    </span>
                    {!p.isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                        Moderation Blocked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    Seller: <strong>{p.sellerId?.businessName || 'Unknown'}</strong> ({p.sellerId?.sellerType}) • Category: {p.categoryId?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <Link
                  to={`/products/${p._id}`}
                  target="_blank"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>

                <button
                  onClick={() => handleToggleProduct(p)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    p.isActive
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {p.isActive ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Block / Moderate</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Unblock Listing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
          No products found.
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
