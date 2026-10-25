import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import axiosClient from '../../api/axiosClient.js';

const CustomerProfilePage = () => {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const res = await axiosClient.put('/users/me', {
        name,
        phone
      });
      if (res.success) {
        updateLocalUser(res.user);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <UserIcon className="w-6 h-6 text-brand-600" />
          <span>My Profile & Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal information and contact preferences
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address (Account Identifier)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Email address cannot be changed.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* B2B Institutional Buyer Profile Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/80 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
              B2B Market Linkage
            </span>
            <h2 className="text-xl font-bold">Institutional / Bulk Procurement</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Source bulk regional handicrafts, corporate gifts, and artisan supplies directly from verified makers
            </p>
          </div>
          <a
            href="/b2b"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 self-start sm:self-auto"
          >
            Open B2B Procurement Hub →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
            <span className="font-bold text-white block">Post Custom RFPs</span>
            <span className="text-indigo-200">Submit requests for custom quantities, corporate branding, or bespoke artisan craft lines.</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
            <span className="font-bold text-white block">Intelligent Matching Engine</span>
            <span className="text-indigo-200">Automatically discover verified sellers and regional workshops equipped to fulfill your bulk orders.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
