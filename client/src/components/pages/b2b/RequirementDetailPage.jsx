import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Store,
  Send,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  X,
  Package
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

const RequirementDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [requirement, setRequirement] = useState(null);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatchingLoading, setIsMatchingLoading] = useState(true);

  // Enquiry Modal state
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryQuantity, setEnquiryQuantity] = useState(100);
  const [targetPrice, setTargetPrice] = useState('');
  const [isSendingEnquiry, setIsSendingEnquiry] = useState(false);

  useEffect(() => {
    const fetchRequirementAndMatches = async () => {
      setIsLoading(true);
      try {
        const res = await axiosClient.get(`/b2b/requirements/${id}`);
        if (res.success && res.requirement) {
          setRequirement(res.requirement);
          setEnquiryQuantity(res.requirement.quantity || 100);
          setEnquiryMessage(
            `Hello, we are interested in placing a bulk order for "${res.requirement.title}". Could you please review our quantity requirements and share your best wholesale quotation?`
          );

          // Now fetch matches
          setIsMatchingLoading(true);
          const matchRes = await axiosClient.post(`/b2b/requirements/${id}/matches`);
          if (matchRes.success) {
            setMatches(matchRes.matches || []);
          }
        }
      } catch (err) {
        showToast(err.message || 'Failed to load requirement details.', 'error');
      } finally {
        setIsLoading(false);
        setIsMatchingLoading(false);
      }
    };

    fetchRequirementAndMatches();
  }, [id]);

  const handleOpenEnquiryModal = (seller) => {
    if (!isAuthenticated) {
      showToast('Please sign in to send an enquiry.', 'warning');
      return;
    }
    setSelectedSeller(seller);
  };

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!enquiryMessage.trim()) {
      showToast('Please write an enquiry message.', 'warning');
      return;
    }

    setIsSendingEnquiry(true);
    try {
      const res = await axiosClient.post(`/b2b/requirements/${id}/enquiries`, {
        sellerId: selectedSeller.sellerId,
        quantity: Number(enquiryQuantity),
        message: enquiryMessage.trim(),
        targetPrice: targetPrice ? Number(targetPrice) : null
      });

      if (res.success) {
        showToast(res.message || 'Bulk enquiry sent successfully!', 'success');
        setSelectedSeller(null);
        // Refresh requirement details
        const refreshed = await axiosClient.get(`/b2b/requirements/${id}`);
        if (refreshed.success) setRequirement(refreshed.requirement);
      }
    } catch (err) {
      showToast(err.message || 'Failed to send bulk enquiry.', 'error');
    } finally {
      setIsSendingEnquiry(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
        <div className="h-48 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Requirement Not Found</h2>
        <Link to="/b2b" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs">
          Return to B2B Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/b2b" className="hover:text-indigo-600">
          B2B Hub
        </Link>
        <span>/</span>
        <span className="text-slate-800 truncate">{requirement.title}</span>
      </div>

      {/* Requirement Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {requirement.category}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  requirement.status === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : requirement.status === 'MATCHED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                Status: {requirement.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {requirement.title}
            </h1>

            <p className="text-xs text-slate-400">
              Posted on {new Date(requirement.createdAt).toLocaleDateString()} by{' '}
              <strong className="text-slate-700">
                {requirement.buyerId?.buyerProfile?.businessName || requirement.buyerId?.name || 'Verified Buyer'}
              </strong>
            </p>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-center sm:text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Required Volume
            </span>
            <span className="text-2xl font-black text-indigo-950">
              {requirement.quantity?.toLocaleString()} <span className="text-xs font-bold text-slate-500">Units</span>
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
          {requirement.description}
        </p>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Target Price Range</span>
            <strong className="text-slate-900 font-extrabold text-sm">
              {requirement.budgetMax ? `₹${requirement.budgetMin || 0} - ₹${requirement.budgetMax}` : 'Negotiable'}
            </strong>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Destination City</span>
            <strong className="text-slate-900 font-extrabold text-sm flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {requirement.location?.city || 'Pan India'}
            </strong>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Target Deadline</span>
            <strong className="text-slate-900 font-extrabold text-sm flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {requirement.deadline ? new Date(requirement.deadline).toLocaleDateString() : 'Flexible'}
            </strong>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Enquiries Sent</span>
            <strong className="text-slate-900 font-extrabold text-sm">
              {requirement.enquiriesCount || 0} Discussions
            </strong>
          </div>
        </div>

        {/* Required Attributes */}
        {requirement.requiredAttributes?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Required Tags:</span>
            {requirement.requiredAttributes.map((attr, idx) => (
              <span key={idx} className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                {attr}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Matching Sellers Engine Results */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Intelligently Matched Makers & Suppliers ({matches.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked using category relevance, production capacity, bulk MOQ, location, and verified trust credentials.
            </p>
          </div>
        </div>

        {isMatchingLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((sellerItem) => (
              <div
                key={sellerItem.sellerId}
                className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition-all duration-300 space-y-5"
              >
                <div>
                  {/* Match Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img
                          src={sellerItem.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                          alt={sellerItem.businessName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-slate-900 text-base">
                            {sellerItem.businessName}
                          </h3>
                          {sellerItem.isVerified && (
                            <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {sellerItem.sellerType} • {sellerItem.city}, {sellerItem.state}
                        </p>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="text-right shrink-0">
                      <div className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-black text-sm">
                        {sellerItem.matchScore}% Match
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-0.5 block">
                        {sellerItem.tier} Match
                      </span>
                    </div>
                  </div>

                  {/* Explainable Match Reasons */}
                  <div className="mt-4 bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Why this maker matched:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {sellerItem.reasons.map((reason, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Production & MOQ Metrics */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-semibold block">MIN MOQ</span>
                      <strong className="text-slate-800 font-bold">{sellerItem.b2bProfile?.minimumOrderQuantity || 1} units</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-semibold block">CAPACITY</span>
                      <strong className="text-slate-800 font-bold">
                        {sellerItem.b2bProfile?.productionCapacity ? `${sellerItem.b2bProfile.productionCapacity}/mo` : 'Flexible'}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-semibold block">EST. LEAD TIME</span>
                      <strong className="text-slate-800 font-bold">~{sellerItem.b2bProfile?.leadTimeDays || 7} Days</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/sellers/${sellerItem.sellerId}`}
                    className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
                  >
                    View Workshop Profile
                  </Link>

                  <button
                    onClick={() => handleOpenEnquiryModal(sellerItem)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Bulk Enquiry</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Store className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-lg">No automated matches yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We are actively indexing new rural maker cooperatives and MSMEs. You can also explore our general marketplace catalogue.
            </p>
          </div>
        )}
      </div>

      {/* Bulk Enquiry Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Send B2B Enquiry to {selectedSeller.businessName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEnquiry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Required Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={enquiryQuantity}
                    onChange={(e) => setEnquiryQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Target Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="e.g. 200 (Optional)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Message & Customization Notes *</label>
                <textarea
                  rows="4"
                  required
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-indigo-900 text-[11px] leading-relaxed">
                ✓ This enquiry will be delivered directly to the seller's B2B workbench alongside your verified business contact information.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSeller(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEnquiry}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold shadow-xs transition"
                >
                  {isSendingEnquiry ? 'Sending...' : 'Send Formal Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementDetailPage;
