import React, { useState } from 'react';
import { Navigation, MapPin, Check, Search, RotateCcw } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import { useLocation, PRESET_LOCATIONS } from '../../context/LocationContext.jsx';

const LocationModal = ({ isOpen, onClose }) => {
  const {
    locationLabel,
    coords,
    isLocating,
    requestBrowserLocation,
    setManualLocation,
    clearLocation
  } = useLocation();

  const [customCity, setCustomCity] = useState('');

  const handlePresetSelect = (preset) => {
    setManualLocation(preset.name, preset.lat, preset.lng);
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customCity.trim()) {
      // Default to central coordinates for custom city entry
      setManualLocation(customCity.trim(), 28.6139, 77.2090);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Your Location">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-600 mb-3">
            SwaShop calculates real-time distances to nearby artisans, local shops, and micro-entrepreneurs.
          </p>

          {/* Current location display */}
          <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-between text-xs font-semibold text-brand-900 mb-4">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Current: <strong className="text-brand-700">{locationLabel}</strong></span>
            </span>
            <button
              onClick={() => { clearLocation(); onClose(); }}
              className="text-slate-500 hover:text-slate-700 underline font-normal"
            >
              Reset to All
            </button>
          </div>

          {/* GPS Button */}
          <button
            onClick={() => {
              requestBrowserLocation();
              onClose();
            }}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm shadow-sm transition disabled:opacity-50"
          >
            <Navigation className={`w-4 h-4 text-brand-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting Location...' : 'Use My Current GPS Location'}</span>
          </button>
        </div>

        {/* Preset Hubs */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Popular Local Hubs
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {PRESET_LOCATIONS.map((preset) => {
              const isSelected = locationLabel === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left text-sm transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{preset.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom manual city */}
        <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Or Enter City / Area Manually
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Pune, Lucknow, Chandigarh..."
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition"
            >
              Set
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default LocationModal;
