import React, { useState } from 'react';
import { Navigation, MapPin, Check, Search, RotateCcw, Radio, Sparkles, Compass } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import { useLocation, PRESET_LOCATIONS } from '../../context/LocationContext.jsx';

const LocationModal = ({ isOpen, onClose }) => {
  const {
    locationLabel,
    coords,
    isLocating,
    accuracyMeters,
    isLiveTracking,
    toggleLiveTracking,
    requestBrowserLocation,
    setManualLocation,
    setCityBySearch,
    clearLocation
  } = useLocation();

  const [customCity, setCustomCity] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  const handlePresetSelect = (preset) => {
    setManualLocation(preset.name, preset.lat, preset.lng);
    onClose();
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (customCity.trim()) {
      setIsSearchingCity(true);
      await setCityBySearch(customCity.trim());
      setIsSearchingCity(false);
      setCustomCity('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Location & Craft Hub Selector">
      <div className="space-y-6">
        <div>
          <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
            SwaShop calculates live geodesic distances to nearby artisans, local shops, and MSMEs using accurate GPS coordinates.
          </p>

          {/* Current location display with accuracy pill */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs font-semibold text-amber-950 mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span>Current: <strong className="text-slate-900">{locationLabel}</strong></span>
                {accuracyMeters && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ±{accuracyMeters}m GPS Accuracy
                  </span>
                )}
                {coords?.lat && coords?.lng && (
                  <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                    {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => { clearLocation(); onClose(); }}
              className="text-slate-500 hover:text-slate-800 underline font-normal text-[11px]"
            >
              Reset
            </button>
          </div>

          {/* Action Row: Real-time GPS & Live Radar Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                requestBrowserLocation(() => onClose());
              }}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 text-amber-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locking Satellite GPS...' : 'Lock My Live GPS'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                toggleLiveTracking();
                onClose();
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition border ${
                isLiveTracking
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md animate-pulse'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'text-white' : 'text-rose-500'}`} />
              <span>{isLiveTracking ? 'Live GPS Radar Active' : 'Start Live GPS Radar'}</span>
            </button>
          </div>
        </div>

        {/* Popular Artisan & Craft Clusters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Verified Indian Craft Clusters</span>
            </h4>
            <span className="text-[11px] text-slate-400">1-click switch</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {PRESET_LOCATIONS.map((preset) => {
              const isSelected = locationLabel === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold truncate">{preset.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </div>
                  {preset.specialty && (
                    <span className="text-[10px] text-slate-500 mt-0.5 pl-5 truncate">
                      {preset.specialty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom manual city search with real geocoding */}
        <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-brand-600" />
            <span>Search Any Indian City or Neighborhood</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Pune, Lucknow, Varanasi, Bangalore, Saharanpur..."
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingCity || !customCity.trim()}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isSearchingCity ? 'Locating...' : 'Locate'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default LocationModal;
