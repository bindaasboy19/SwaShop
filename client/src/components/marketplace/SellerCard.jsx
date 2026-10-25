import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle2, Store, Clock, ArrowRight } from 'lucide-react';

const SELLER_TYPE_LABELS = {
  ARTISAN: 'Artisan Maker',
  LOCAL_SHOP: 'Local Shopkeeper',
  MSME: 'MSME Enterprise',
  MICRO_ENTREPRENEUR: 'Micro-Entrepreneur'
};

const SellerCard = ({ seller }) => {
  const coverImage =
    seller.coverImage ||
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80';
  const logoImage =
    seller.logo ||
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-brand-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Cover Banner */}
      <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
        <img
          src={coverImage}
          alt={seller.businessName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>

        {/* Distance Badge */}
        {seller.distanceKm !== null && seller.distanceKm !== undefined && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-400" />
            <span>{seller.distanceKm} km away</span>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-4 pt-0 relative flex-1 flex flex-col justify-between">
        {/* Logo Avatar */}
        <div className="-mt-7 mb-2 flex items-end justify-between">
          <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-white shrink-0">
            <img src={logoImage} alt={seller.businessName} className="w-full h-full object-cover" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {SELLER_TYPE_LABELS[seller.sellerType] || seller.sellerType}
          </span>
        </div>

        {/* Business Title & Location */}
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition truncate">
              {seller.businessName}
            </h3>
            {(seller.verificationStatus === 'APPROVED' || seller.verificationStatus === 'VERIFIED') && (
              <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold" title="Verified Seller">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Verified
              </span>
            )}
            {seller.b2bProfile?.bulkAvailable && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded" title="Bulk / B2B Supply Partner">
                B2B Partner
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-2 leading-relaxed">
            {seller.description || 'Artisan & local merchant verified by SwaShop platform.'}
          </p>

          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{seller.city}, {seller.state || 'India'}</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4 mt-3 border-t border-slate-100">
          <Link
            to={`/sellers/${seller._id}`}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 group-hover:bg-brand-600 text-slate-700 group-hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <span>Visit Shop & Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellerCard;
