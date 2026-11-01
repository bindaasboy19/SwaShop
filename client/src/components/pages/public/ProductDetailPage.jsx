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
  Tag,
  Briefcase,
  Clock,
  QrCode,
  MessageCircle,
  ShoppingBag,
  Star
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import BuyAndResellModal from '../../components/modals/BuyAndResellModal.jsx';
import EnquiryModal from '../../components/modals/EnquiryModal.jsx';
import OrderCheckoutModal from '../../components/modals/OrderCheckoutModal.jsx';
import QrModal from '../../components/modals/QrModal.jsx';
import ShopRouteMap from '../../components/common/ShopRouteMap.jsx';

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
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await axiosClient.get(`/products/${id}?lat=${coords.lat}&lng=${coords.lng}`);
        if (res.success) {
          setProduct(res.product);
        }
        // Fetch verified reviews
        try {
          const revRes = await axiosClient.get(`/reviews/product/${id}`);
          if (revRes && revRes.success) {
            setReviews(revRes.reviews || []);
          }
        } catch (_) {}
      } catch (err) {
        showToast(err.message || 'Product not found.', 'error');
        navigate('/explore');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, coords.lat, coords.lng, navigate, showToast]);

  const handleOpenQr = async () => {
    try {
      const res = await axiosClient.get(`/qr/product/${id}`);
      if (res && res.success) {
        setQrData(res);
        setIsQrModalOpen(true);
      }
    } catch (err) {
      showToast('Could not load QR code', 'error');
    }
  };

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
                {product.availabilityUpdatedAt && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 justify-end font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Verified {new Date(product.availabilityUpdatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* B2B Wholesale Tier */}
            {product.b2b?.enabled && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    B2B Wholesale / Bulk Purchase Tier
                  </span>
                  <span className="text-[11px] font-bold bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-full">
                    MOQ: {product.b2b.minOrderQuantity || 50} units
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-indigo-950">
                  <div>
                    <span className="text-indigo-600 font-medium block text-[11px]">Wholesale Bulk Price</span>
                    <span className="text-base font-black">
                      {product.b2b.bulkPrice ? `₹${product.b2b.bulkPrice} / unit` : 'Tiered Pricing Available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-indigo-600 font-medium block text-[11px]">Production Lead Time</span>
                    <span className="text-sm font-bold">
                      {product.b2b.leadTimeDays ? `${product.b2b.leadTimeDays} business days` : '1-2 weeks'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-indigo-800/80 leading-relaxed">
                  Bulk order directly from verified local maker with GST tax invoices, quality assurance, and packaging customization.
                </p>
              </div>
            )}

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

            {/* Prominent Shop Identity Card - Product belongs to this Physical Shop */}
            {product.sellerId && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                    The Physical Shop Behind This Product
                  </span>
                  <Link
                    to={`/sellers/${product.sellerId._id}`}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 underline"
                  >
                    View Storefront →
                  </Link>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl border border-amber-200 overflow-hidden bg-white shrink-0 shadow-2xs">
                    <img
                      src={product.sellerId.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                      alt={product.sellerId.businessName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">
                        {product.sellerId.businessName}
                      </h4>
                      {(product.sellerId.verificationStatus === 'APPROVED' || product.sellerId.verificationStatus === 'VERIFIED') && (
                        <span className="flex items-center gap-0.5 text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                        {product.sellerId.sellerType?.replace('_', ' ') || 'Local Maker'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        {product.sellerId.address ? `${product.sellerId.address}, ` : ''}
                        {product.sellerId.city}, {product.sellerId.state} {product.sellerId.pincode}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Hours: {product.sellerId.businessHours || 'Open standard hours'}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Physical Linkage First (Directions -> Chat -> Storefront -> Pre-reserve) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            {/* Primary Physical Linkage Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Truthful Navigation / Get Directions */}
              {product.sellerId && (
                <a
                  href={
                    (product.sellerId.location?.coordinates && product.sellerId.location.coordinates.length === 2 && (product.sellerId.location.coordinates[0] || product.sellerId.location.coordinates[1]))
                      ? `https://www.google.com/maps/dir/?api=1&destination=${product.sellerId.location.coordinates[1]},${product.sellerId.location.coordinates[0]}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${product.sellerId.businessName} ${product.sellerId.address || ''} ${product.sellerId.city || ''} ${product.sellerId.pincode || ''}`.trim())}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-emerald-100" />
                  <span>Get Directions to Shop</span>
                </a>
              )}

              {/* Contact / Chat with Shop */}
              <button
                onClick={() => {
                  if (!user) {
                    showToast('Please sign in to chat with the shop.', 'info');
                    navigate(`/login?redirect=/products/${product._id}`);
                    return;
                  }
                  navigate(`/chat?sellerId=${product.sellerId._id}&productId=${product._id}`);
                }}
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-brand-400" />
                <span>Chat with Shop</span>
              </button>
            </div>

            {/* Secondary Actions: Favourites, QR Card, WhatsApp Share, View All Products */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleToggleSave}
                className={`py-2 px-2.5 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  isSaved
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}`} />
                <span className="truncate">{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={handleOpenQr}
                className="py-2 px-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-brand-600" />
                <span>QR Card</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out "${product.name}" from ${product.sellerId?.businessName || 'local shop'} on SwaShop: ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Optional Pre-reserve / Direct Local Order (Secondary to physical visit) */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>Planning to visit offline or prefer local delivery?</span>
              <button
                onClick={() => {
                  if (!user) {
                    showToast('Please sign in to place an order or pre-reserve', 'info');
                    navigate('/login');
                    return;
                  }
                  setIsOrderModalOpen(true);
                }}
                className="font-bold text-brand-700 hover:text-brand-800 underline flex items-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Pre-reserve / Inquire Order</span>
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

      {/* Physical Track & Navigation to the Shop */}
      {product.sellerId && (
        <ShopRouteMap
          shop={product.sellerId}
          customerCoords={coords}
          distanceKm={product.distanceKm}
          onOpenChat={() => {
            if (!user) {
              showToast('Please sign in to chat with the shop.', 'info');
              navigate(`/login?redirect=/products/${product._id}`);
              return;
            }
            navigate(`/chat?sellerId=${product.sellerId._id}&productId=${product._id}`);
          }}
          productName={product.name}
        />
      )}

      {/* Verified Reviews Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              Verified Buyer Reviews & Ratings ({reviews.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Reviews submitted exclusively by verified purchasers.</p>
          </div>
          {product.ratings?.average && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-extrabold text-amber-900">{product.ratings.average.toFixed(1)} / 5</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center italic">
            No reviews yet for this product. Be the first to order and share your feedback!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {reviews.map((rev) => (
              <div key={rev._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{rev.reviewerId?.name || 'Verified Buyer'}</span>
                  <div className="flex text-amber-400">
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Purchase
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <OrderCheckoutModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={product}
        seller={product.sellerId}
      />

      {qrData && (
        <QrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title="Product QR Card"
          subtitle={product.name}
          canonicalUrl={qrData.canonicalUrl}
          qrDataUrl={qrData.qrDataUrl}
          whatsappUrl={qrData.whatsapp?.shareUrl}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
