import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Repeat, AlertCircle, CheckCircle2, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';

const BuyAndResellModal = ({ isOpen, onClose, product, onResellSuccess }) => {
  const [resellPrice, setResellPrice] = useState(
    product ? Math.round(product.price * 1.3) : ''
  );
  const [quantity, setQuantity] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!product) return null;

  const originalPrice = product.price || 0;
  const markup = resellPrice ? resellPrice - originalPrice : 0;
  const marginPercent = originalPrice > 0 ? Math.round((markup / originalPrice) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!resellPrice || parseFloat(resellPrice) < 0) {
      setError('Please enter a valid resell price.');
      return;
    }

    if (!quantity || parseInt(quantity, 10) < 1) {
      setError('Quantity must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/reseller-listings', {
        sourceProductId: product._id,
        price: parseFloat(resellPrice),
        quantity: parseInt(quantity, 10)
      });

      if (res.success) {
        showToast(`'${product.name}' added to your catalogue as a Reseller Listing!`, 'success');
        onClose();
        if (onResellSuccess) {
          onResellSuccess(res.listing);
        } else {
          navigate('/seller/products');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to create reseller listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy & Resell Product" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Product preview summary */}
        <div className="flex gap-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=300'}
            alt={product.name}
            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mb-0.5">
              <Repeat className="w-3.5 h-3.5" />
              <span>Reseller Acquisition</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Source Maker:{' '}
              <strong className="text-slate-800">
                {product.sellerId?.businessName || 'Artisan Maker'}
              </strong>
            </p>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              Original Maker Price: <span className="text-brand-600 font-bold">₹{originalPrice}</span>
            </p>
          </div>
        </div>

        {/* Source Attribution Notice */}
        <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Authentic Attribution:</strong> In your shop catalogue and public marketplace, this item will be displayed as a <em>Resell Product</em> sourced from <strong>{product.sellerId?.businessName}</strong>, honoring the original artisan.
          </span>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Your Resell Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={resellPrice}
                onChange={(e) => setResellPrice(e.target.value)}
                placeholder="e.g. 699"
                className="w-full pl-8 pr-3 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Stock Quantity to List *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-3 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
          </div>
        </div>

        {/* Markup calculation pill */}
        {resellPrice && (
          <div className="p-3 bg-slate-100/80 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Estimated Markup per unit:
            </span>
            <span className="font-bold text-slate-900">
              ₹{markup} ({marginPercent > 0 ? `+${marginPercent}%` : `${marginPercent}%`})
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Creating Listing...</span>
            ) : (
              <>
                <span>Confirm & Add to My Catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BuyAndResellModal;
