import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  PlusCircle,
  Repeat,
  Edit2,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  Package,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/common/Modal.jsx';

const SellerCataloguePage = () => {
  const [items, setItems] = useState([]);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'OWN', 'RESELL', 'PUBLISHED', 'HIDDEN'
  const [isLoading, setIsLoading] = useState(true);

  // Edit Reseller Listing Modal State
  const [editingResellerItem, setEditingResellerItem] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [isUpdatingResell, setIsUpdatingResell] = useState(false);

  const { showToast } = useToast();

  const fetchCatalogue = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/reseller-listings/catalogue');
      if (res.success) {
        setItems(res.items || []);
      }
    } catch (err) {
      console.error('Failed to load catalogue:', err);
      showToast(err.message || 'Failed to load catalogue.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const handleTogglePublish = async (item) => {
    try {
      if (item.isResellProduct) {
        const res = await axiosClient.patch(`/reseller-listings/${item.resellerListingId}/publish`);
        showToast(res.message, 'success');
      } else {
        const res = await axiosClient.patch(`/products/${item._id}/publish`);
        showToast(res.message, 'success');
      }
      fetchCatalogue();
    } catch (err) {
      showToast(err.message || 'Failed to update publication state.', 'error');
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to remove '${item.name}' from your catalogue?`)) {
      return;
    }
    try {
      if (item.isResellProduct) {
        const res = await axiosClient.delete(`/reseller-listings/${item.resellerListingId}`);
        showToast(res.message, 'success');
      } else {
        const res = await axiosClient.delete(`/products/${item._id}`);
        showToast(res.message, 'success');
      }
      fetchCatalogue();
    } catch (err) {
      showToast(err.message || 'Failed to remove item.', 'error');
    }
  };

  const handleSaveResellEdit = async (e) => {
    e.preventDefault();
    if (!editingResellerItem) return;

    setIsUpdatingResell(true);
    try {
      const res = await axiosClient.put(`/reseller-listings/${editingResellerItem.resellerListingId}`, {
        price: parseFloat(editPrice),
        quantity: parseInt(editQuantity, 10)
      });
      if (res.success) {
        showToast('Reseller pricing & stock updated successfully!', 'success');
        setEditingResellerItem(null);
        fetchCatalogue();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update reseller listing.', 'error');
    } finally {
      setIsUpdatingResell(false);
    }
  };

  // Filter items based on active tab
  const filteredItems = items.filter((item) => {
    if (filterType === 'OWN') return !item.isResellProduct;
    if (filterType === 'RESELL') return item.isResellProduct;
    if (filterType === 'PUBLISHED') return item.isPublished;
    if (filterType === 'HIDDEN') return !item.isPublished;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-brand-600" />
            <span>My Shop Catalogue</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your own handcrafted products and acquired reseller listings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/explore"
            className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center gap-2"
          >
            <Repeat className="w-4 h-4 text-amber-600" />
            <span>Find Goods to Resell</span>
          </Link>

          <Link
            to="/seller/products/new"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Own Product</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { key: 'ALL', label: `All Items (${items.length})` },
          { key: 'OWN', label: `Own Products (${items.filter((i) => !i.isResellProduct).length})` },
          { key: 'RESELL', label: `Reselling (${items.filter((i) => i.isResellProduct).length})` },
          { key: 'PUBLISHED', label: `Published (${items.filter((i) => i.isPublished).length})` },
          { key: 'HIDDEN', label: `Draft / Hidden (${items.filter((i) => !i.isPublished).length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-4 py-2 rounded-xl shrink-0 transition ${
              filterType === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Catalogue List / Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
            >
              {/* Left Item Summary */}
              <div className="flex items-center gap-4">
                <img
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=300'}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>

                    {/* OWN vs RESELL Badge */}
                    {item.isResellProduct ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                        <Repeat className="w-3 h-3 text-amber-700" />
                        <span>RESELL PRODUCT</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                        OWN PRODUCT
                      </span>
                    )}

                    {!item.isPublished && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                        Hidden
                      </span>
                    )}
                  </div>

                  {/* Pricing and Source */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-bold text-slate-900 text-sm">₹{item.price}</span>
                    {item.isResellProduct && (
                      <>
                        <span className="text-slate-400">Maker Cost: ₹{item.originalPrice}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-amber-700">
                          Stock: {item.quantity} units
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600">
                          Source: <strong>{item.sourceSeller?.businessName}</strong>
                        </span>
                      </>
                    )}
                    {!item.isResellProduct && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{item.categoryId?.name || 'Handicrafts'}</span>
                        <span className="text-slate-300">•</span>
                        <span>Views: {item.views || 0}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                {/* Publish / Hide toggle */}
                <button
                  onClick={() => handleTogglePublish(item)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                    item.isPublished
                      ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'border-amber-300 bg-amber-50 text-amber-800'
                  }`}
                  title={item.isPublished ? 'Hide from marketplace' : 'Publish to marketplace'}
                >
                  {item.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-600" />}
                  <span className="hidden sm:inline">{item.isPublished ? 'Hide' : 'Publish'}</span>
                </button>

                {/* Edit Button */}
                {item.isResellProduct ? (
                  <button
                    onClick={() => {
                      setEditingResellerItem(item);
                      setEditPrice(item.price);
                      setEditQuantity(item.quantity);
                    }}
                    className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Edit resell price and stock"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Edit Resell</span>
                  </button>
                ) : (
                  <Link
                    to={`/seller/products/${item._id}/edit`}
                    className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Edit product"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                )}

                {/* Delete / Remove Button */}
                <button
                  onClick={() => handleDeleteItem(item)}
                  className="p-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs transition"
                  title="Remove from catalogue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-lg">No items in this filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't listed any items under this category. Add your first product or discover other maker items to resell.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/seller/products/new"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Add Your First Product
            </Link>
          </div>
        </div>
      )}

      {/* Edit Reseller Listing Modal */}
      {editingResellerItem && (
        <Modal
          isOpen={Boolean(editingResellerItem)}
          onClose={() => setEditingResellerItem(null)}
          title={`Edit Resale: ${editingResellerItem.name}`}
        >
          <form onSubmit={handleSaveResellEdit} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900">
              Source Maker: <strong>{editingResellerItem.sourceSeller?.businessName}</strong> (Maker Cost: ₹{editingResellerItem.originalPrice})
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Your Resell Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingResellerItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingResell}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {isUpdatingResell ? 'Saving...' : 'Update Listing'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SellerCataloguePage;
