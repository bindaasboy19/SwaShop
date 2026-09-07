import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Check, AlertCircle, UploadCloud, Clock, Building } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import ImageUploadDropzone from '../../components/upload/ImageUploadDropzone.jsx';

const SellerOnboardingPage = () => {
  const { user, sellerProfile, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState(sellerProfile?.businessName || `${user?.name || ''}'s Shop`);
  const [sellerType, setSellerType] = useState(sellerProfile?.sellerType || 'LOCAL_SHOP');
  const [category, setCategory] = useState(sellerProfile?.category || '');
  const [description, setDescription] = useState(sellerProfile?.description || '');
  const [phone, setPhone] = useState(sellerProfile?.phone || user?.phone || '');
  const [address, setAddress] = useState(sellerProfile?.address || '');
  const [city, setCity] = useState(sellerProfile?.city || 'New Delhi');
  const [state, setState] = useState(sellerProfile?.state || 'Delhi');
  const [pincode, setPincode] = useState(sellerProfile?.pincode || '110001');
  const [lat, setLat] = useState(sellerProfile?.coordinates?.lat || 28.6304);
  const [lng, setLng] = useState(sellerProfile?.coordinates?.lng || 77.2177);
  const [businessHours, setBusinessHours] = useState(sellerProfile?.businessHours || 'Mon - Sat: 10:00 AM - 8:00 PM');
  const [logo, setLogo] = useState(sellerProfile?.logo ? [sellerProfile.logo] : []);
  const [coverImage, setCoverImage] = useState(sellerProfile?.coverImage ? [sellerProfile.coverImage] : []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.put('/sellers/profile', {
        businessName: businessName.trim(),
        sellerType,
        category: category.trim(),
        description: description.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        coordinates: { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0 },
        businessHours,
        logo: logo[0] || '',
        coverImage: coverImage[0] || ''
      });

      if (res.success) {
        updateLocalUser(null, res.profile);
        showToast('Seller shop profile configured successfully!', 'success');
        navigate('/seller');
      }
    } catch (err) {
      setError(err.message || 'Failed to save shop profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center font-bold">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Complete Your Seller Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Provide your business and location details so nearby customers and resellers can discover your shop
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Identity */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-600" />
            <span>Business Identity</span>
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Business / Shop Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sharma Handicrafts"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 font-semibold outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Seller Type *
              </label>
              <select
                value={sellerType}
                onChange={(e) => setSellerType(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white font-medium"
              >
                <option value="ARTISAN">Artisan / Craftsperson</option>
                <option value="LOCAL_SHOP">Local Retailer / Shopkeeper</option>
                <option value="MICRO_ENTREPRENEUR">Micro-Entrepreneur</option>
                <option value="MSME">MSME Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Craft / Primary Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Cane & Bamboo Crafts"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Shop Story & Description
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your craftsmanship history, heritage techniques, and workshop..."
              className="w-full p-4 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>Location & Operating Hours</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Business Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Business Hours
              </label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="Mon - Sat: 10:00 AM - 8:00 PM"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No., Market / Colony Name"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Pincode
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pin"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Coordinates for Nearby Distance Calculation */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span>Map Coordinates (Used for Nearby Distance Calculation)</span>
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Photos Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Shop Branding Photos
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Shop Logo / Emblem
            </label>
            <ImageUploadDropzone images={logo} onImagesChange={setLogo} maxImages={1} />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Storefront / Workshop Cover Banner
            </label>
            <ImageUploadDropzone images={coverImage} onImagesChange={setCoverImage} maxImages={1} />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          <span>{isSubmitting ? 'Saving Shop Profile...' : 'Complete Onboarding & Enter Shop'}</span>
        </button>
      </form>
    </div>
  );
};

export default SellerOnboardingPage;
