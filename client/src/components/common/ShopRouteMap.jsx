import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Store,
  ExternalLink,
  Car,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

/**
 * ShopRouteMap Component
 * Visualizes the physical track from Customer Location to Shop Location.
 * Enables direct turn-by-turn navigation and direct customer-to-shop chat.
 */
const ShopRouteMap = ({
  shop,
  customerCoords,
  distanceKm,
  onOpenChat,
  productName = null
}) => {
  const [mapMode, setMapMode] = useState('driving'); // driving | walking

  if (!shop) return null;

  // Extract coordinates (GeoJSON [lng, lat])
  const shopCoords = shop.location?.coordinates;
  const hasShopCoords =
    Array.isArray(shopCoords) &&
    shopCoords.length === 2 &&
    (shopCoords[0] !== 0 || shopCoords[1] !== 0);

  const shopLng = hasShopCoords ? shopCoords[0] : null;
  const shopLat = hasShopCoords ? shopCoords[1] : null;

  const hasCustomerCoords =
    customerCoords &&
    typeof customerCoords.lat === 'number' &&
    typeof customerCoords.lng === 'number';

  // Calculate estimated travel time
  const numericDistance = typeof distanceKm === 'number' ? distanceKm : parseFloat(distanceKm);
  const isValidDistance = !isNaN(numericDistance) && numericDistance > 0;

  // Approx estimates: 25 km/h city driving, 4.5 km/h walking
  const driveMinutes = isValidDistance ? Math.max(2, Math.round((numericDistance / 25) * 60)) : null;
  const walkMinutes = isValidDistance ? Math.max(3, Math.round((numericDistance / 4.5) * 60)) : null;

  // Build Truthful Navigation URL
  const destinationQuery = hasShopCoords
    ? `${shopLat},${shopLng}`
    : encodeURIComponent(`${shop.businessName} ${shop.address || ''} ${shop.city || ''} ${shop.pincode || ''}`.trim());

  const originQuery = hasCustomerCoords
    ? `${customerCoords.lat},${customerCoords.lng}`
    : '';

  const turnByTurnUrl = originQuery
    ? `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destinationQuery}&travelmode=${mapMode}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;

  // Embedded Map URL (using Google Maps Embed or OSM fallback)
  const embedUrl = hasCustomerCoords && hasShopCoords
    ? `https://maps.google.com/maps?saddr=${customerCoords.lat},${customerCoords.lng}&daddr=${shopLat},${shopLng}&output=embed`
    : hasShopCoords
    ? `https://maps.google.com/maps?q=${shopLat},${shopLng}&output=embed`
    : `https://maps.google.com/maps?q=${destinationQuery}&output=embed`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Physical Route & Shop Track
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            Navigate to {shop.businessName}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Visit the physical shop, inspect the product craftsmanship, and purchase offline.
          </p>
        </div>

        {/* Mode Selector & Distance Chip */}
        <div className="flex items-center gap-2">
          {isValidDistance && (
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{numericDistance} km away</span>
            </div>
          )}

          <div className="flex items-center bg-slate-800/90 p-1 rounded-full border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMapMode('driving')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition ${
                mapMode === 'driving'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3 h-3" />
              <span>Drive {driveMinutes ? `~${driveMinutes}m` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('walking')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition ${
                mapMode === 'walking'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Footprints className="w-3 h-3" />
              <span>Walk {walkMinutes ? `~${walkMinutes}m` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Map Embed */}
      <div className="relative w-full h-64 sm:h-80 bg-slate-100 border-y border-slate-200">
        <iframe
          title={`Route track to ${shop.businessName}`}
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Floating Quick Action Overlay */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 flex items-center gap-2">
          <a
            href={turnByTurnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 border border-white/20"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Route Journey Track Details */}
      <div className="p-5 sm:p-6 bg-slate-50/70 space-y-4">
        {/* Track Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Customer Location */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Step 1 • Starting Point
            </span>
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Your Current Location</span>
            </h4>
            <p className="text-xs text-slate-500">
              {hasCustomerCoords
                ? `GPS Coordinates: ${customerCoords.lat.toFixed(4)}, ${customerCoords.lng.toFixed(4)}`
                : 'Using browser device geolocation or default city center'}
            </p>
          </div>

          {/* Step 2: Physical Shop Destination */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Step 2 • Destination Shop
              </span>
              {(shop.verificationStatus === 'APPROVED' || shop.verificationStatus === 'VERIFIED') && (
                <span className="flex items-center gap-0.5 text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified Shop
                </span>
              )}
            </div>

            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{shop.businessName}</span>
            </h4>
            <p className="text-xs text-slate-600">
              {shop.address ? `${shop.address}, ` : ''}
              {shop.city}, {shop.state} {shop.pincode}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Hours: {shop.businessHours || 'Open Standard Business Hours'}</span>
            </p>
          </div>
        </div>

        {/* Physical Quality Promise & Bottom Action Bar */}
        <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              <strong>Physical Inspection:</strong> You can physically touch, inspect quality, and buy directly at the shop counter.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                <span>Chat Before Visiting</span>
              </button>
            )}

            <a
              href={turnByTurnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-100" />
              <span>Start Turn-by-Turn GPS</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopRouteMap;
