import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, Repeat, Store, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import axiosClient from '../../api/axiosClient.js';
import BuyAndResellModal from '../modals/BuyAndResellModal.jsx';

const ProductCard = ({ product, onSaveToggle }) => {
  const { user, isSeller } = useAuth();
  const { showToast } = useToast();
  const [isSaved, setIsSaved] = useState(product.isSaved || false);
  const [isResellModalOpen, setIsResellModalOpen] = useState(false);

  // Check if current user is a seller who can resell this product
  // A seller can resell if: they are a seller AND this product was not made by their own shop
  const canResell =
    isSeller &&
    product.sellerId &&
    user?._id &&
    product.sellerId.userId !== user._id &&
    product.sellerId._id !== user._id;

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast('Please sign in to save items to your favourites.', 'info');
      return;
    }

    try {
      const res = await axiosClient.post(`/favourites/products/${product._id}`);
      if (res.success) {
        setIsSaved(res.saved);
        showToast(res.message, 'success');
        if (onSaveToggle) onSaveToggle(product._id, res.saved);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update saved item.', 'error');
    }
  };

  const originalPrice = product.price;
  const discountPrice = product.discountPrice;
  const primaryImage =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&auto=format&fit=crop&q=80';

  return (
    <>
      <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-brand-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
        {/* Image Container */}
        <Link to={`/products/${product._id}`} className="relative aspect-4/3 bg-slate-100 overflow-hidden block">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Stock Status Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.stockStatus === 'LOW_STOCK' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500 text-white shadow-xs">
                Low Stock
              </span>
            )}
            {product.stockStatus === 'OUT_OF_STOCK' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-white shadow-xs">
                Out of Stock
              </span>
            )}
            {discountPrice && originalPrice > discountPrice && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-600 text-white shadow-xs">
                Save ₹{originalPrice - discountPrice}
              </span>
            )}
          </div>

          {/* Bookmark / Favourite Button */}
          <button
            onClick={handleToggleSave}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-xs transition z-10 ${
              isSaved
                ? 'bg-rose-50 text-rose-600'
                : 'bg-white/80 text-slate-500 hover:text-rose-600 hover:bg-white'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save to favourites'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Reseller Tag if resold item */}
          {product.isResellProduct && (
            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1 text-[11px] font-medium flex items-center justify-between">
              <span className="flex items-center gap-1 text-amber-300">
                <Repeat className="w-3 h-3" />
                Resell Listing
              </span>
              <span className="text-slate-300 text-[10px] truncate max-w-[140px]">
                Source: {product.sourceSeller?.businessName}
              </span>
            </div>
          )}
        </Link>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Category and Distance */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 gap-2">
              <span className="font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md truncate">
                {product.categoryId?.name || 'Handmade'}
              </span>
              {product.distanceKm !== null && product.distanceKm !== undefined ? (
                <span className="flex items-center gap-1 font-semibold text-slate-600 shrink-0 text-[11px]">
                  <MapPin className="w-3 h-3 text-brand-600" />
                  {product.distanceKm} km
                </span>
              ) : null}
            </div>

            {/* Product Title */}
            <Link to={`/products/${product._id}`} className="block">
              <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-brand-600 transition line-clamp-1">
                {product.name}
              </h3>
            </Link>

            {/* Seller Info */}
            {product.sellerId && (
              <Link
                to={`/sellers/${product.sellerId._id}`}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition mt-1.5"
              >
                <Store className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate font-medium">{product.sellerId.businessName}</span>
                {product.sellerId.verificationStatus === 'APPROVED' && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
              </Link>
            )}
          </div>

          {/* Pricing & Bottom Action */}
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              {discountPrice ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-extrabold text-slate-900">₹{discountPrice}</span>
                  <span className="text-xs text-slate-400 line-through font-medium">₹{originalPrice}</span>
                </div>
              ) : (
                <span className="text-lg font-extrabold text-slate-900">₹{originalPrice}</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Buy & Resell Button (for logged-in Sellers) */}
              {canResell && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResellModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition"
                  title="Acquire and list in your shop catalogue"
                >
                  <Repeat className="w-3 h-3" />
                  <span>Resell</span>
                </button>
              )}

              <Link
                to={`/products/${product._id}`}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-brand-600 text-white font-semibold text-xs transition shadow-xs"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Buy & Resell Modal */}
      {canResell && (
        <BuyAndResellModal
          isOpen={isResellModalOpen}
          onClose={() => setIsResellModalOpen(false)}
          product={product}
        />
      )}
    </>
  );
};

export default ProductCard;
