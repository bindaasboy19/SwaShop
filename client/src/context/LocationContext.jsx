import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from './ToastContext.jsx';

const LocationContext = createContext(null);

export const PRESET_LOCATIONS = [
  { name: 'Connaught Place, New Delhi', lat: 28.6304, lng: 77.2177, state: 'Delhi', specialty: 'Central Hub' },
  { name: 'Dilli Haat / Crafts Bazaar', lat: 28.5733, lng: 77.2085, state: 'Delhi', specialty: 'Artisan Hub' },
  { name: 'Varanasi Ghats & Weavers', lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh', specialty: 'Banarasi Silk & Woodcraft' },
  { name: 'Jaipur Crafts Hub', lat: 26.9124, lng: 75.7873, state: 'Rajasthan', specialty: 'Blue Pottery & Jaipuri Quilts' },
  { name: 'Lucknow Chowk', lat: 26.8687, lng: 80.9126, state: 'Uttar Pradesh', specialty: 'Chikankari & Zardozi' },
  { name: 'Noida Sector 18 Market', lat: 28.5708, lng: 77.3261, state: 'Uttar Pradesh', specialty: 'Retail & Handlooms' },
  { name: 'Cyber City, Gurugram', lat: 28.4952, lng: 77.0891, state: 'Haryana', specialty: 'Corporate & MSME Hub' },
  { name: 'Bengaluru Commercial Street', lat: 12.9822, lng: 77.6083, state: 'Karnataka', specialty: 'Silk & Mysore Crafts' },
  { name: 'Mumbai Colaba Causeway', lat: 18.9154, lng: 72.8258, state: 'Maharashtra', specialty: 'Handicrafts & Leather' },
  { name: 'Saharanpur Woodcraft Hub', lat: 29.9640, lng: 77.5460, state: 'Uttar Pradesh', specialty: 'Carved Sheesham Wood' }
];

// Major Indian cities lookup for instant manual entry
const INDIAN_CITIES_COORDS = {
  'delhi': { lat: 28.6139, lng: 77.2090, label: 'New Delhi, Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, label: 'New Delhi, Delhi' },
  'noida': { lat: 28.5355, lng: 77.3910, label: 'Noida, Uttar Pradesh' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, label: 'Gurugram, Haryana' },
  'gurugram': { lat: 28.4595, lng: 77.0266, label: 'Gurugram, Haryana' },
  'mumbai': { lat: 19.0760, lng: 72.8777, label: 'Mumbai, Maharashtra' },
  'pune': { lat: 18.5204, lng: 73.8567, label: 'Pune, Maharashtra' },
  'bangalore': { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, Karnataka' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, Karnataka' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, label: 'Hyderabad, Telangana' },
  'chennai': { lat: 13.0827, lng: 80.2707, label: 'Chennai, Tamil Nadu' },
  'kolkata': { lat: 22.5726, lng: 88.3639, label: 'Kolkata, West Bengal' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad, Gujarat' },
  'jaipur': { lat: 26.9124, lng: 75.7873, label: 'Jaipur, Rajasthan' },
  'lucknow': { lat: 26.8467, lng: 80.9462, label: 'Lucknow, Uttar Pradesh' },
  'varanasi': { lat: 25.3176, lng: 82.9739, label: 'Varanasi, Uttar Pradesh' },
  'banaras': { lat: 25.3176, lng: 82.9739, label: 'Varanasi, Uttar Pradesh' },
  'patna': { lat: 25.5941, lng: 85.1376, label: 'Patna, Bihar' },
  'indore': { lat: 22.7196, lng: 75.8577, label: 'Indore, Madhya Pradesh' },
  'bhopal': { lat: 23.2599, lng: 77.4126, label: 'Bhopal, Madhya Pradesh' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, label: 'Chandigarh, Punjab' },
  'saharanpur': { lat: 29.9640, lng: 77.5460, label: 'Saharanpur, Uttar Pradesh' },
  'bhadohi': { lat: 25.3957, lng: 82.5685, label: 'Bhadohi, Uttar Pradesh' },
  'moradabad': { lat: 28.8386, lng: 78.7733, label: 'Moradabad, Uttar Pradesh' },
  'agra': { lat: 27.1767, lng: 78.0081, label: 'Agra, Uttar Pradesh' },
  'surat': { lat: 21.1702, lng: 72.8311, label: 'Surat, Gujarat' },
  'kochi': { lat: 9.9312, lng: 76.2673, label: 'Kochi, Kerala' }
};

export const LocationProvider = ({ children }) => {
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem('swashop_coords');
    return saved ? JSON.parse(saved) : { lat: 28.6304, lng: 77.2177 }; // Default center: Connaught Place, New Delhi
  });

  const [locationLabel, setLocationLabel] = useState(() => {
    return localStorage.getItem('swashop_location_label') || 'New Delhi / NCR';
  });

  const [accuracyMeters, setAccuracyMeters] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [hasLocation, setHasLocation] = useState(() => {
    return localStorage.getItem('swashop_has_location') === 'true';
  });

  const watchIdRef = useRef(null);
  const { showToast } = useToast();

  // Helper for reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' }
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.village ||
          addr.town ||
          addr.city_district ||
          addr.city ||
          'Local Area';
        const city = addr.city || addr.town || addr.county || addr.state || '';
        const formatted = city && locality !== city ? `${locality}, ${city}` : (locality || city || 'Current Location');
        return formatted;
      }
    } catch (_) {
      // Graceful fallback to coordinate label or nearest preset
    }
    return null;
  };

  const setManualLocation = (name, lat, lng) => {
    const newCoords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    setCoords(newCoords);
    setLocationLabel(name);
    setHasLocation(true);
    setAccuracyMeters(null);
    localStorage.setItem('swashop_coords', JSON.stringify(newCoords));
    localStorage.setItem('swashop_location_label', name);
    localStorage.setItem('swashop_has_location', 'true');
    showToast(`Location set to ${name}`, 'success');
  };

  // Geocode user manual entry intelligently
  const setCityBySearch = async (queryText) => {
    const clean = (queryText || '').trim().toLowerCase();
    if (!clean) return false;

    // 1. Direct dictionary match
    if (INDIAN_CITIES_COORDS[clean]) {
      const match = INDIAN_CITIES_COORDS[clean];
      setManualLocation(match.label, match.lat, match.lng);
      return true;
    }

    // 2. Partial dictionary match
    for (const [key, val] of Object.entries(INDIAN_CITIES_COORDS)) {
      if (clean.includes(key) || key.includes(clean)) {
        setManualLocation(val.label, val.lat, val.lng);
        return true;
      }
    }

    // 3. Fallback online geocoding
    try {
      setIsLocating(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText + ', India')}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const shortName = item.display_name.split(',').slice(0, 2).join(',').trim();
          setManualLocation(shortName, parseFloat(item.lat), parseFloat(item.lon));
          setIsLocating(false);
          return true;
        }
      }
    } catch (_) {}

    setIsLocating(false);
    // Graceful default if unresolvable
    setManualLocation(`${queryText} (Estimated)`, 28.6139, 77.2090);
    return true;
  };

  // Real-time GPS Detection with accurate reverse geocoding
  const requestBrowserLocation = (onSuccess = null) => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 10);
        const newCoords = { lat, lng };

        setCoords(newCoords);
        setAccuracyMeters(accuracy);
        setHasLocation(true);

        // Fetch truthful locality name
        const resolvedName = await reverseGeocode(lat, lng);
        const finalLabel = resolvedName || `GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;

        setLocationLabel(finalLabel);
        localStorage.setItem('swashop_coords', JSON.stringify(newCoords));
        localStorage.setItem('swashop_location_label', finalLabel);
        localStorage.setItem('swashop_has_location', 'true');
        setIsLocating(false);

        showToast(`GPS Location Locked: ${finalLabel} (±${accuracy}m)`, 'success');
        if (typeof onSuccess === 'function') onSuccess(newCoords);
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation denied or failed:', error.message);
        showToast('GPS access denied. Using New Delhi / NCR default.', 'info');
        setManualLocation('Connaught Place, New Delhi', 28.6304, 77.2177);
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  // Continuous Live GPS Tracking (Watch Mode)
  const toggleLiveTracking = () => {
    if (isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
      showToast('Live GPS tracking paused.', 'info');
    } else {
      if (!navigator.geolocation) {
        showToast('Geolocation not available.', 'error');
        return;
      }
      setIsLiveTracking(true);
      showToast('🔴 Live GPS radar active! Streaming real-time coordinates...', 'success');

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 10);
          const newCoords = { lat, lng };

          setCoords(newCoords);
          setAccuracyMeters(accuracy);
          setHasLocation(true);
          localStorage.setItem('swashop_coords', JSON.stringify(newCoords));
        },
        (err) => {
          console.warn('Live watch error:', err.message);
          setIsLiveTracking(false);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
  };

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const clearLocation = () => {
    setHasLocation(false);
    setLocationLabel('All India');
    setAccuracyMeters(null);
    localStorage.removeItem('swashop_has_location');
    localStorage.removeItem('swashop_location_label');
    showToast('Location filter cleared. Browsing all of India.', 'info');
  };

  return (
    <LocationContext.Provider
      value={{
        coords,
        locationLabel,
        hasLocation,
        isLocating,
        accuracyMeters,
        isLiveTracking,
        toggleLiveTracking,
        setManualLocation,
        setCityBySearch,
        requestBrowserLocation,
        clearLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
};
