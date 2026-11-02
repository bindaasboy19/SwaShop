import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  Store,
  ExternalLink,
  Car,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Layers,
  Crosshair,
  Maximize2,
  Package,
  Phone,
  Clock,
  Briefcase
} from 'lucide-react';

/**
 * ArtisanMapView Component
 * Highly visual interactive Leaflet map pinning all nearby artisans, local shops, and MSMEs.
 * Features live user GPS beacon, distance circles, custom craft pins, and instant shop preview cards.
 */
const ArtisanMapView = ({
  sellers = [],
  products = [],
  userCoords = { lat: 28.6304, lng: 77.2177 },
  radiusKm = '',
  locationLabel = 'Your Location',
  onRadiusChange = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);

  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedSellerProducts, setSelectedSellerProducts] = useState([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [travelMode, setTravelMode] = useState('driving'); // 'driving' or 'walking'
  const navigate = useNavigate();

  // Helper to extract valid coordinates from seller
  const getSellerCoords = (seller) => {
    if (seller.coordinates?.lat && seller.coordinates?.lng) {
      return { lat: Number(seller.coordinates.lat), lng: Number(seller.coordinates.lng) };
    }
    const coords = seller.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
      return { lat: Number(coords[1]), lng: Number(coords[0]) };
    }
    return null;
  };

  // Helper for pin styling based on seller type
  const getPinTheme = (type) => {
    switch (type) {
      case 'ARTISAN':
        return {
          bg: '#d97706', // amber-600
          border: '#b45309',
          icon: '🎨',
          label: 'Artisan'
        };
      case 'LOCAL_SHOP':
        return {
          bg: '#059669', // emerald-600
          border: '#047857',
          icon: '🏪',
          label: 'Local Shop'
        };
      case 'MSME':
        return {
          bg: '#4f46e5', // indigo-600
          border: '#4338ca',
          icon: '🏭',
          label: 'MSME'
        };
      case 'MICRO_ENTREPRENEUR':
      default:
        return {
          bg: '#7c3aed', // violet-600
          border: '#6d28d9',
          icon: '✨',
          label: 'Maker'
        };
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const L = window.L;
    if (!L) {
      console.warn('Leaflet (window.L) is loading or unavailable.');
      return;
    }

    const defaultLat = userCoords?.lat || 28.6304;
    const defaultLng = userCoords?.lng || 77.2177;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Add clean tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Zoom control at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update User GPS Beacon & Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L) return;

    const uLat = userCoords?.lat || 28.6304;
    const uLng = userCoords?.lng || 77.2177;

    // Create / Update pulsing user beacon
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([uLat, uLng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-gps-container',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div class="user-gps-beacon"></div>
            <div style="background:rgba(15,23,42,0.85); color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:9999px; margin-top:4px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
              You are here
            </div>
          </div>
        `,
        iconSize: [60, 40],
        iconAnchor: [30, 11]
      });

      userMarkerRef.current = L.marker([uLat, uLng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map);
    }

    // Proximity Radius Circle
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }

    if (radiusKm && !isNaN(parseFloat(radiusKm))) {
      const radiusMeters = parseFloat(radiusKm) * 1000;
      radiusCircleRef.current = L.circle([uLat, uLng], {
        radius: radiusMeters,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);
    }
  }, [userCoords?.lat, userCoords?.lng, radiusKm, isMapReady]);

  // 3. Render Seller Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds = L.latLngBounds();
    let validPinsCount = 0;

    // Include user position in bounds
    if (userCoords?.lat && userCoords?.lng) {
      bounds.extend([userCoords.lat, userCoords.lng]);
    }

    sellers.forEach((seller) => {
      const c = getSellerCoords(seller);
      if (!c) return;

      validPinsCount++;
      bounds.extend([c.lat, c.lng]);

      const theme = getPinTheme(seller.sellerType);
      const isSelected = selectedSeller && selectedSeller._id === seller._id;

      const markerHtml = `
        <div class="custom-shop-pin" style="
          background:${isSelected ? '#0f172a' : theme.bg};
          border:2.5px solid #ffffff;
          color:#ffffff;
          padding:6px 10px;
          border-radius:9999px;
          display:inline-flex;
          align-items:center;
          gap:5px;
          font-family:system-ui, -apple-system, sans-serif;
          font-size:11px;
          font-weight:800;
          box-shadow:0 6px 18px rgba(0,0,0,0.3);
          transform:${isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1)'};
          transition:all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          <span style="font-size:13px;">${theme.icon}</span>
          <span style="white-space:nowrap; max-width:110px; overflow:hidden; text-overflow:ellipsis;">
            ${seller.businessName}
          </span>
          ${
            seller.distanceKm !== undefined && seller.distanceKm !== null
              ? `<span style="background:rgba(255,255,255,0.25); padding:1px 5px; border-radius:9999px; font-size:9.5px;">${seller.distanceKm}km</span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'artisan-map-pin',
        html: markerHtml,
        iconSize: [140, 36],
        iconAnchor: [70, 18]
      });

      const marker = L.marker([c.lat, c.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedSeller(seller);
        // Find products belonging to this seller
        const sellerProds = products.filter(
          (p) => String(p.sellerId?._id || p.sellerId) === String(seller._id)
        );
        setSelectedSellerProducts(sellerProds.slice(0, 3));

        map.panTo([c.lat, c.lng], { animate: true, duration: 0.6 });
      });

      marker.addTo(markersLayerRef.current);
    });

    // Auto-fit map to show pins if multiple sellers exist
    if (validPinsCount > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [sellers, selectedSeller, userCoords?.lat, userCoords?.lng, products, isMapReady]);

  // Recenter on user
  const handleRecenter = () => {
    if (mapInstanceRef.current && userCoords?.lat && userCoords?.lng) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 13, { duration: 0.8 });
    }
  };

  // Fit all bounds
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L) return;

    const bounds = L.latLngBounds();
    if (userCoords?.lat && userCoords?.lng) bounds.extend([userCoords.lat, userCoords.lng]);

    sellers.forEach((s) => {
      const c = getSellerCoords(s);
      if (c) bounds.extend([c.lat, c.lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  // Turn-by-Turn Navigation Generator
  const getNavUrl = (seller) => {
    if (!seller) return '#';
    const c = getSellerCoords(seller);
    const dest = c
      ? `${c.lat},${c.lng}`
      : encodeURIComponent(`${seller.businessName} ${seller.address || ''} ${seller.city || ''}`);
    const orig = userCoords?.lat && userCoords?.lng ? `${userCoords.lat},${userCoords.lng}` : '';

    return orig
      ? `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}&travelmode=${travelMode}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  };

  const selectedCoords = selectedSeller ? getSellerCoords(selectedSeller) : null;
  const numericDistance = selectedSeller?.distanceKm !== undefined ? Number(selectedSeller.distanceKm) : null;
  const driveMinutes = numericDistance ? Math.max(2, Math.round((numericDistance / 25) * 60)) : null;
  const walkMinutes = numericDistance ? Math.max(3, Math.round((numericDistance / 4.5) * 60)) : null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-900">
      {/* Top Map Header & Filter Toolbar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              Live Hyperlocal Craft Radar
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-bold">
              {sellers.length} Shops Pinned
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
            Interactive Artisan & Store Discovery Map
          </h3>
          <p className="text-xs text-slate-400">
            Click any pin to inspect the maker, view stock, check physical distance, or start GPS directions.
          </p>
        </div>

        {/* Proximity Radius & Map Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {onRadiusChange && (
            <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700 text-xs">
              <span className="px-2.5 text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-amber-400" />
                Radius:
              </span>
              {[
                { label: 'All', value: '' },
                { label: '5 km', value: '5' },
                { label: '10 km', value: '10' },
                { label: '25 km', value: '25' },
                { label: '50 km', value: '50' }
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => onRadiusChange(r.value)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                    radiusKm === r.value
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition"
            title="Recenter on My Location"
          >
            <Crosshair className="w-4 h-4 text-brand-400" />
          </button>

          <button
            type="button"
            onClick={handleFitAll}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition text-xs font-bold flex items-center gap-1"
            title="Fit all pinned shops"
          >
            <Maximize2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Fit All</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[460px] sm:h-[540px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend Overlay at Top Left */}
        <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2.5 rounded-2xl shadow-lg text-[11px] text-white space-y-1.5 hidden sm:block">
          <p className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Map Legend</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-medium">Your Current Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="font-medium">Artisan / Handcrafter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium">Local Retail Shop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="font-medium">MSME / Enterprise</span>
          </div>
        </div>

        {/* Floating Shop Quick Inspection Card (Bottom Overlay) */}
        {selectedSeller && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-20 max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-amber-500/40 shrink-0">
                  <img
                    src={selectedSeller.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                    alt={selectedSeller.businessName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                      {selectedSeller.businessName}
                    </h4>
                    {(selectedSeller.verificationStatus === 'APPROVED' || selectedSeller.verificationStatus === 'VERIFIED') && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Maker" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedSeller.category || selectedSeller.sellerType.replace('_', ' ')}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {selectedSeller.address ? `${selectedSeller.address}, ` : ''}{selectedSeller.city}
                  </p>
                </div>
              </div>

              {/* Distance Pill */}
              {numericDistance !== null && (
                <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black shrink-0 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{numericDistance} km</span>
                </div>
              )}
            </div>

            {/* Travel Times & Mode Selector */}
            <div className="flex items-center justify-between bg-slate-100/80 p-2 rounded-2xl text-xs font-bold text-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Travel:</span>
                <span className="flex items-center gap-1 text-slate-800">
                  <Car className="w-3.5 h-3.5 text-amber-600" />
                  {driveMinutes ? `~${driveMinutes} mins driving` : 'Direct GPS'}
                </span>
                <span className="flex items-center gap-1 text-slate-600 hidden sm:flex">
                  <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                  {walkMinutes ? `~${walkMinutes} mins walk` : ''}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSeller(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2"
              >
                ✕ Close
              </button>
            </div>

            {/* Featured Product Thumbnails from this seller */}
            {selectedSellerProducts.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Products in this Shop:</p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedSellerProducts.map((p) => (
                    <Link
                      key={p._id}
                      to={`/products/${p._id}`}
                      className="group p-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-brand-400 transition flex flex-col items-center text-center"
                    >
                      <div className="w-full h-12 rounded-lg overflow-hidden bg-white mb-1">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=200'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 truncate w-full">{p.name}</span>
                      <span className="text-[10px] font-extrabold text-brand-700">₹{p.price}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
              <a
                href={getNavUrl(selectedSeller)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 text-center"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </a>

              <Link
                to={`/sellers/${selectedSeller._id}`}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1 text-center"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Storefront</span>
              </Link>

              <button
                type="button"
                onClick={() => navigate(`/chat?sellerId=${selectedSeller._id}`)}
                className="py-2.5 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-900 font-bold text-xs border border-brand-200 transition flex items-center justify-center gap-1 text-center"
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                <span>Chat</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtisanMapView;

