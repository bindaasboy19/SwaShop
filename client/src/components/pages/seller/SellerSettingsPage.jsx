import React, { useState, useEffect } from 'react';
import { Store, MapPin, Check, AlertCircle, Clock, Building } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import ImageUploadDropzone from '../../components/upload/ImageUploadDropzone.jsx';

const SellerSettingsPage = () => {
  const { sellerProfile, updateLocalUser } = useAuth();
  const { showToast } = useToast();

  const [businessName, setBusinessName] = useState(sellerProfile?.businessName || '');
  const [sellerType, setSellerType] = useState(sellerProfile?.sellerType || 'LOCAL_SHOP');
  const [category, setCategory] = useState(sellerProfile?.category || '');
  const [description, setDescription] = useState(sellerProfile?.description || '');
  const [phone, setPhone] = useState(sellerProfile?.phone || '');
  const [address, setAddress] = useState(sellerProfile?.address || '');
  const [city, setCity] = useState(sellerProfile?.city || '');
  const [state, setState] = useState(sellerProfile?.state || '');
  const [pincode, setPincode] = useState(sellerProfile?.pincode || '');
  const [businessHours, setBusinessHours] = useState(sellerProfile?.businessHours || '');
  const [isOpen, setIsOpen] = useState(sellerProfile?.isOpen !== undefined ? sellerProfile.isOpen : true);
  const [logo, setLogo] = useState(sellerProfile?.logo ? [sellerProfile.logo] : []);
  const [coverImage, setCoverImage] = useState(sellerProfile?.coverImage ? [sellerProfile.coverImage] : []);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setIsSaving(true);
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
        businessHours,
        isOpen,
        logo: logo[0] || '',
        coverImage: coverImage[0] || ''
      });

      if (res.success) {
        updateLocalUser(null, res.profile);
        showToast('Shop profile settings saved successfully!', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to update shop profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Store className="w-7 h-7 text-brand-600" />
          <span>Shop Profile Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Customize your public shop appearance, operating hours, and contact information
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Open/Closed Toggle Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 text-sm block">Shop Status</span>
            <span className="text-xs text-slate-500">Toggle whether your shop is currently accepting inquiries</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isOpen
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
            <span>{isOpen ? 'Open for Business' : 'Currently Closed'}</span>
          </button>
        </div>

        {/* Business Info */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Shop Information
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 font-semibold outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Seller Type
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
                Primary Craft / Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Shop Story & Bio
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Location & Timings */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Location & Timings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Operating Hours
              </label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Storefront Media
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Logo Photo
            </label>
            <ImageUploadDropzone images={logo} onImagesChange={setLogo} maxImages={1} />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Store Cover Image
            </label>
            <ImageUploadDropzone images={coverImage} onImagesChange={setCoverImage} maxImages={1} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          <span>{isSaving ? 'Saving Settings...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
};

export default SellerSettingsPage;
