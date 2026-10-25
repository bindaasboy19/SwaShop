import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Store,
  MessageSquare,
  Heart,
  Package,
  ArrowLeft,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import ProductCard from '../../marketplace/ProductCard.jsx';
import EnquiryModal from '../../components/modals/EnquiryModal.jsx';

const SellerDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { coords } = useLocation();
  const { showToast } = useToast();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  useEffect(() => {
    const fetchSellerData = async () => {
      setIsLoading(true);
      try {
        const res = await axiosClient.get(`/sellers/${id}?lat=${coords.lat}&lng=${coords.lng}`);
        if (res.success) {
          setSeller(res.seller);
          setProducts(res.products || []);
          setDistanceKm(res.distanceKm);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load seller details.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerData();
  }, [id, coords.lat, coords.lng, showToast]);

  const handleToggleSave = async () => {
    if (!user) {
      showToast('Please sign in to save shops to your favourites.', 'info');
      return;
    }
    try {
      const res = await axiosClient.post(`/favourites/sellers/${id}`);
      if (res.success) {
        setIsSaved(res.saved);
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update saved shop.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
        <div className="h-24 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!seller) return null;

  const coverImage =
    seller.coverImage ||
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80';
  const logoImage =
    seller.logo ||
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to marketplace</span>
      </Link>

      {/* Seller Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cover */}
        <div className="h-48 sm:h-64 w-full relative bg-slate-100">
          <img src={coverImage} alt={seller.businessName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />

          {distanceKm !== null && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>{distanceKm} km away from you</span>
            </div>
          )}
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white shrink-0">
                <img src={logoImage} alt={seller.businessName} className="w-full h-full object-cover" />
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                    {seller.businessName}
                  </h1>
                  {(seller.verificationStatus === 'APPROVED' || seller.verificationStatus === 'VERIFIED') && (
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Verified Maker
                    </span>
                  )}
                  {seller.b2bProfile?.bulkAvailable && (
                    <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs font-bold border border-indigo-200">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      B2B Supplier
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider">
                    {seller.sellerType.replace('_', ' ')}
                  </span>
                  {seller.b2bProfile?.minimumOrderQuantity && (
                    <span className="text-xs text-slate-500 font-medium">
                      MOQ: {seller.b2bProfile.minimumOrderQuantity} units
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={() => setIsEnquiryModalOpen(true)}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-brand-400" />
                <span>Contact Shop</span>
              </button>
              <button
                onClick={handleToggleSave}
                className={`p-2.5 rounded-xl border font-bold text-xs transition flex items-center justify-center ${
                  isSaved ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={isSaved ? 'Remove from saved' : 'Save shop'}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Business Meta Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                {seller.address ? `${seller.address}, ` : ''}
                {seller.city}, {seller.state} {seller.pincode}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{seller.businessHours || 'Open Standard Hours'}</span>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{seller.phone || 'Phone upon inquiry'}</span>
            </div>
          </div>

          {seller.description && (
            <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-3xl">
              {seller.description}
            </p>
          )}

          {/* B2B Wholesale / Bulk Supply Capacity Banner */}
          {seller.b2bProfile?.bulkAvailable && (
            <div className="mt-4 p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Wholesale & B2B Supply Capability
                </span>
                <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-950 font-medium">
                  {seller.b2bProfile.productionCapacity && (
                    <span>Capacity: <strong>{seller.b2bProfile.productionCapacity} units/month</strong></span>
                  )}
                  {seller.b2bProfile.minimumOrderQuantity && (
                    <span>MOQ: <strong>{seller.b2bProfile.minimumOrderQuantity} units</strong></span>
                  )}
                  {seller.b2bProfile.leadTimeDays && (
                    <span>Lead Time: <strong>{seller.b2bProfile.leadTimeDays} days</strong></span>
                  )}
                </div>
              </div>
              <Link
                to={`/b2b/requirements/new?category=${encodeURIComponent(seller.category || 'Handicrafts & Bamboo')}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
              >
                Post Custom B2B RFP
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Products from this Seller */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <span>Products from {seller.businessName} ({products.length})</span>
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No active products in this shop at the moment.</p>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        seller={seller}
      />
    </div>
  );
};

export default SellerDetailPage;
