import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext.jsx';

const LocationContext = createContext(null);

export const PRESET_LOCATIONS = [
  { name: 'Connaught Place, New Delhi', lat: 28.6304, lng: 77.2177, state: 'Delhi' },
  { name: 'Dilli Haat / South Delhi', lat: 28.5733, lng: 77.2085, state: 'Delhi' },
  { name: 'Noida Sector 18', lat: 28.5708, lng: 77.3261, state: 'Uttar Pradesh' },
  { name: 'Cyber City, Gurugram', lat: 28.4952, lng: 77.0891, state: 'Haryana' },
  { name: 'Jaipur Crafts Hub', lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  { name: 'Varanasi Ghats', lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' }
];

export const LocationProvider = ({ children }) => {
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem('swashop_coords');
    return saved ? JSON.parse(saved) : { lat: 28.6304, lng: 77.2177 }; // Default center: Connaught Place, New Delhi
  });

  const [locationLabel, setLocationLabel] = useState(() => {
    return localStorage.getItem('swashop_location_label') || 'New Delhi / NCR';
  });

  const [isLocating, setIsLocating] = useState(false);
  const [hasLocation, setHasLocation] = useState(() => {
    return localStorage.getItem('swashop_has_location') === 'true';
  });
  const { showToast } = useToast();

  const setManualLocation = (name, lat, lng) => {
    const newCoords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    setCoords(newCoords);
    setLocationLabel(name);
    setHasLocation(true);
    localStorage.setItem('swashop_coords', JSON.stringify(newCoords));
    localStorage.setItem('swashop_location_label', name);
    localStorage.setItem('swashop_has_location', 'true');
    showToast(`Location set to ${name}`, 'success');
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const label = 'My Current Location';
        setCoords(newCoords);
        setLocationLabel(label);
        setHasLocation(true);
        localStorage.setItem('swashop_coords', JSON.stringify(newCoords));
        localStorage.setItem('swashop_location_label', label);
        localStorage.setItem('swashop_has_location', 'true');
        setIsLocating(false);
        showToast('Location updated successfully!', 'success');
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation denied or failed:', error.message);
        showToast('Location access denied. Using New Delhi / NCR default.', 'info');
        // Graceful fallback
        setManualLocation('New Delhi / NCR (Default)', 28.6304, 77.2177);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const clearLocation = () => {
    setHasLocation(false);
    setLocationLabel('All India');
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
        setManualLocation,
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
