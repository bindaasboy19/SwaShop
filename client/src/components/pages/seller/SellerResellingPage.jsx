import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Repeat,
  Store,
  TrendingUp,
  Package,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/common/Modal.jsx';

const SellerResellingPage = () => {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { showToast } = useToast();

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/reseller-listings');
      if (res.success) {
        setListings(res.listings || []);
      }
    } catch (err) {
      console.error('Failed to load reseller listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleTogglePublish = async (id) => {
    try {
      const res = await axiosClient.patch(`/reseller-listings/${id}/publish`);
      showToast(res.message, 'success');
      fetchListings();
    } catch (err) {
      showToast(err.message || 'Failed to toggle publish status.', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove the reseller listing for '${name}'?`)) {
      return;
    }
    try {
      const res = await axiosClient.delete(`/reseller-listings/${id}`);
      showToast(res.message, 'success');
      fetchListings();
    } catch (err) {
      showToast(err.message || 'Failed to delete listing.', 'error');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdating(true);
    try {
      const res = await axiosClient.put(`/reseller-listings/${editingItem._id}`, {
        price: parseFloat(editPrice),
        quantity: parseInt(editQuantity, 10)
      });
      if (res.success) {
        showToast('Reseller listing updated successfully!', 'success');
        setEditingItem(null);
        fetchListings();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update listing.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Repeat className="w-7 h-7 text-amber-600" />
            <span>Reseller Listings Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Products you have acquired and listed from other verified regional artisans and workshops
          </p>
        </div>

        <Link
          to="/explore"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Store className="w-4 h-4" />
          <span>Discover Products to Resell</span>
        </Link>
      </div>

      {/* Info Callout */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Preserving Authentic Maker Attribution</p>
          <p className="mt-0.5 text-amber-900">
            Reselling allows local retailers to stock crafts without duplicating inventory. When customers view these items in your shop or in public search, the original maker is proudly credited.
          </p>
        </div>
      </div>

      {/* Listings Grid / Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {listings.map((item) => {
            const source = item.sourceProductId;
            const originalPrice = source?.price || 0;
            const resellPrice = item.price;
            const markup = resellPrice - originalPrice;
            const margin = originalPrice > 0 ? Math.round((markup / originalPrice) * 100) : 0;

            return (
              <div
                key={item._id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={source?.images?.[0] || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=300'}
                    alt={source?.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${source?._id}`}
                        className="font-bold text-slate-900 text-sm hover:text-brand-600 transition"
                      >
                        {source?.name}
                      </Link>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                        RESELL LISTING
                      </span>
                      {!item.isPublished && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Source Maker: <strong className="text-slate-800">{item.sourceSellerId?.businessName}</strong></span>
                      <span>•</span>
                      <span>Original Cost: <strong className="text-slate-800">₹{originalPrice}</strong></span>
                      <span>•</span>
                      <span>Resell Price: <strong className="text-emerald-700 text-sm">₹{resellPrice}</strong></span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600">
                        Margin: +{margin}% (+₹{markup})
                      </span>
                      <span>•</span>
                      <span>Available Stock: <strong>{item.quantity} units</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => handleTogglePublish(item._id)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    title={item.isPublished ? 'Hide from marketplace' : 'Publish listing'}
                  >
                    {item.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-600" />}
                    <span className="hidden sm:inline">{item.isPublished ? 'Hide' : 'Publish'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setEditPrice(item.price);
                      setEditQuantity(item.quantity);
                    }}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Edit resell price and stock"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item._id, source?.name)}
                    className="p-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs transition"
                    title="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Repeat className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-lg">No reseller listings yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse the marketplace, open any artisan's product, and click <strong>"Buy & Resell"</strong> to stock it in your catalogue.
          </p>
          <div className="pt-2">
            <Link
              to="/explore"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Browse Products to Resell
            </Link>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <Modal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          title={`Edit Reseller Listing`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <p className="text-xs text-slate-600 font-medium">
              Source Product: <strong className="text-slate-900">{editingItem.sourceProductId?.name}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Resell Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Available Stock Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Update Listing'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SellerResellingPage;
