import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Heart,
  MessageSquare,
  Repeat,
  Store,
  CheckCircle2,
  ShieldCheck,
  Package,
  ArrowLeft,
  Share2,
  Eye,
  Tag
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import BuyAndResellModal from '../../components/modals/BuyAndResellModal.jsx';
import EnquiryModal from '../../components/modals/EnquiryModal.jsx';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user, isSeller } = useAuth();
  const { coords } = useLocation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isResellModalOpen, setIsResellModalOpen] = useState(false);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await axiosClient.get(`/products/${id}?lat=${coords.lat}&lng=${coords.lng}`);
        if (res.success) {
          setProduct(res.product);
        }
      } catch (err) {
        showToast(err.message || 'Product not found.', 'error');
        navigate('/explore');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, coords.lat, coords.lng, navigate, showToast]);

  const handleToggleSave = async () => {
    if (!user) {
      showToast('Please sign in to save products.', 'info');
      return;
    }
    try {
      const res = await axiosClient.post(`/favourites/products/${id}`);
      if (res.success) {
        setIsSaved(res.saved);
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save product.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded-xl w-3/4 animate-pulse" />
            <div className="h-6 bg-slate-200 rounded-xl w-1/3 animate-pulse" />
            <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800'];

  const canResell = isSeller && product.canResell;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to marketplace</span>
      </button>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        {/* Gallery (Left Column) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-xs relative">
            <img
              src={images[activeImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discountPrice && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs uppercase shadow-sm">
                Special Offer
              </span>
            )}
          </div>

          {/* Thumbnail list */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    activeImageIndex === idx ? 'border-brand-600 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details (Right Column) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category and Distance */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <Link
                to={`/explore?category=${product.categoryId?.slug}`}
                className="font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full hover:bg-brand-100 transition"
              >
                {product.categoryId?.name || 'Handicrafts'}
              </Link>
              {product.distanceKm !== null && product.distanceKm !== undefined && (
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{product.distanceKm} km away from your location</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Price</span>
                {product.discountPrice ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₹{product.discountPrice}</span>
                    <span className="text-sm text-slate-400 line-through font-medium">₹{product.price}</span>
                  </div>
                ) : (
                  <span className="text-3xl font-black text-slate-900">₹{product.price}</span>
                )}
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium block">Stock Status</span>
                <span
                  className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    product.stockStatus === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : product.stockStatus === 'LOW_STOCK'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {product.stockStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description || 'Authentic regional product crafted with traditional care.'}
              </p>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {product.tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons Section */}
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Enquiry Button */}
              <button
                onClick={() => setIsEnquiryModalOpen(true)}
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-brand-400" />
                <span>Contact / Enquire</span>
              </button>

              {/* Bookmark Save Button */}
              <button
                onClick={handleToggleSave}
                className={`py-3 px-4 rounded-xl border font-bold text-sm transition flex items-center justify-center gap-2 ${
                  isSaved
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}`} />
                <span>{isSaved ? 'Saved in Favourites' : 'Save Product'}</span>
              </button>
            </div>

            {/* Seller "Buy & Resell" Special Section */}
            {canResell && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-200 block">
                    Seller B2B Reselling Linkage
                  </span>
                  <p className="text-sm font-bold">Acquire & Resell in Your Shop</p>
                  <p className="text-xs text-amber-100">Set your custom price & list without re-taking photos.</p>
                </div>

                <button
                  onClick={() => setIsResellModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-amber-900 font-extrabold text-sm shadow-sm hover:bg-amber-50 transition shrink-0 flex items-center justify-center gap-2"
                >
                  <Repeat className="w-4 h-4 text-amber-600" />
                  <span>Buy & Resell</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seller Identity & Location Card */}
      {product.sellerId && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
              <img
                src={product.sellerId.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                alt={product.sellerId.businessName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">{product.sellerId.businessName}</h3>
                {product.sellerId.verificationStatus === 'APPROVED' && (
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Maker
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {product.sellerId.address ? `${product.sellerId.address}, ` : ''}
                {product.sellerId.city}, {product.sellerId.state}
              </p>
              <p className="text-xs text-slate-400 mt-1">Hours: {product.sellerId.businessHours || 'Open standard hours'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to={`/sellers/${product.sellerId._id}`}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition"
            >
              View Shop Profile & All Products
            </Link>
          </div>
        </div>
      )}

      {/* Modals */}
      {canResell && (
        <BuyAndResellModal
          isOpen={isResellModalOpen}
          onClose={() => setIsResellModalOpen(false)}
          product={product}
        />
      )}

      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        seller={product.sellerId}
        product={product}
      />
    </div>
  );
};

export default ProductDetailPage;
