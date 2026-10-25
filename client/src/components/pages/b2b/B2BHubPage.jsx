import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

const B2BHubPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [requirements, setRequirements] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or 'MINE'
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick B2B Activation Form State
  const [isActivating, setIsActivating] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('RETAILER');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');

  // Fetch Requirements & Buyer Profile
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const reqQuery = activeTab === 'MINE' ? '?myOnly=true' : '';
        const reqRes = await axiosClient.get(`/b2b/requirements${reqQuery}`);
        if (reqRes.success) {
          setRequirements(reqRes.requirements || []);
        }

        if (isAuthenticated) {
          const profRes = await axiosClient.get('/b2b/profile');
          if (profRes.success && profRes.buyerProfile) {
            setBuyerProfile(profRes.buyerProfile);
            setBusinessName(profRes.buyerProfile.businessName || '');
            setBusinessType(profRes.buyerProfile.businessType || 'RETAILER');
            setIndustry(profRes.buyerProfile.industry || '');
            setCity(profRes.buyerProfile.location?.city || '');
          }
        }
      } catch (err) {
        console.error('Failed to load B2B hub data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, isAuthenticated]);

  const handleActivateB2B = async (e) => {
    e.preventDefault();
    if (!businessName) {
      showToast('Please enter your business or company name.', 'warning');
      return;
    }

    try {
      const res = await axiosClient.post('/b2b/profile', {
        enabled: true,
        businessName,
        businessType,
        industry,
        location: { city }
      });

      if (res.success) {
        setBuyerProfile(res.buyerProfile);
        setIsActivating(false);
        showToast('B2B Buyer capabilities activated! You can now post bulk requirements.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to activate B2B profile.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 overflow-hidden shadow-xl border border-indigo-900/50">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5" />
            <span>SwaShop B2B Market Linkage</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Connect Bulk Demand with Authentic Local Supply
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Empowering corporate buyers, institutional purchasers, and retail networks to source directly from verified rural artisans, cluster cooperatives, and local MSMEs with zero intermediary markups.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/b2b/requirements/new"
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Requirement</span>
            </Link>
            <a
              href="#requirements-feed"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-xs transition"
            >
              Browse Active RFQs
            </a>
          </div>
        </div>

        {/* Decorative Grid Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Buyer Activation / Status Card */}
      {isAuthenticated && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Your B2B Buyer Status</h2>
              {buyerProfile?.enabled ? (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active B2B Buyer
                </span>
              ) : (
                <span className="text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  Standard Customer Account
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              {buyerProfile?.enabled
                ? `Operating as "${buyerProfile.businessName}" (${buyerProfile.businessType || 'Retailer'}). Verified to send bulk RFQs and access verified artisan wholesale capacities.`
                : 'Activate B2B capabilities on your existing SwaShop account to post requirements, receive explainable seller matches, and negotiate bulk quotes.'}
            </p>
          </div>

          <div>
            {!buyerProfile?.enabled ? (
              <button
                onClick={() => setIsActivating(!isActivating)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition shrink-0"
              >
                {isActivating ? 'Cancel' : 'Activate B2B Profile'}
              </button>
            ) : (
              <button
                onClick={() => setIsActivating(!isActivating)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition shrink-0"
              >
                {isActivating ? 'Close Edit' : 'Edit Business Profile'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inline B2B Activation Form */}
      {isActivating && (
        <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-6 transition animate-in fade-in space-y-4">
          <h3 className="font-extrabold text-indigo-950 text-base">
            {buyerProfile?.enabled ? 'Update Business Details' : 'Enable B2B Procurement Capabilities'}
          </h3>
          <form onSubmit={handleActivateB2B} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Organization Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Corporate Solutions"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
              >
                <option value="RETAILER">Retailer / Storefront</option>
                <option value="CORPORATE">Corporate Enterprise</option>
                <option value="WHOLESALER">Wholesale Distributor</option>
                <option value="INSTITUTIONAL">Institution / College / NGO</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Corporate Gifting, Hospitality"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lucknow, Delhi NCR"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsActivating(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
              >
                Save & Enable B2B
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Requirements Feed Section */}
      <div id="requirements-feed" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Open Requirements ({requirements.length})
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('MINE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'MINE'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                My Posted Requirements
              </button>
            )}
          </div>

          <Link
            to="/b2b/requirements/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Requirement</span>
          </Link>
        </div>

        {/* Requirements Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : requirements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requirements.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {req.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'MATCHED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <Link to={`/b2b/requirements/${req._id}`} className="block">
                    <h3 className="font-extrabold text-slate-900 text-base hover:text-indigo-600 transition line-clamp-2 leading-snug">
                      {req.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">REQUIRED QUANTITY</span>
                      <strong className="text-slate-800 font-extrabold text-sm">{req.quantity?.toLocaleString()} units</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">TARGET BUDGET</span>
                      <strong className="text-slate-800 font-extrabold text-sm">
                        {req.budgetMax ? `₹${req.budgetMin || 0} - ₹${req.budgetMax}` : 'Negotiable'}
                      </strong>
                    </div>
                  </div>

                  {req.location?.city && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{req.location.city}, {req.location.state || 'India'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{req.matchedSellerCount || 0} Matched Makers</span>
                  </span>

                  <Link
                    to={`/b2b/requirements/${req._id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <span>View Matches</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-xl">No active requirements found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to post a bulk procurement requirement and discover matching local producers.
            </p>
            <Link
              to="/b2b/requirements/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Requirement</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default B2BHubPage;
