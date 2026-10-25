import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Repeat,
  MessageSquare,
  Eye,
  Store,
  PlusCircle,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Mic,
  DollarSign,
  Image as ImageIcon,
  Briefcase,
  ShieldCheck,
  BarChart3,
  Search,
  FileText,
  X
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const SellerDashboardPage = () => {
  const { user, sellerProfile } = useAuth();
  const { showToast } = useToast();
  const [catalogue, setCatalogue] = useState({ ownProductsCount: 0, resellProductsCount: 0, items: [] });
  const [enquiries, setEnquiries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [demandInsights, setDemandInsights] = useState(null);
  const [b2bEnquiries, setB2bEnquiries] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(sellerProfile?.verificationStatus || 'PENDING');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [docType, setDocType] = useState('UDYAM');
  const [docNumber, setDocNumber] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      setIsLoading(true);
      try {
        const [catRes, enqRes, analyticsRes, insightsRes, b2bEnqRes, verRes] = await Promise.all([
          axiosClient.get('/reseller-listings/catalogue'),
          axiosClient.get('/enquiries/received'),
          axiosClient.get('/analytics/seller').catch(() => ({ success: false })),
          axiosClient.get('/analytics/seller/insights').catch(() => ({ success: false })),
          axiosClient.get('/b2b/seller/enquiries').catch(() => ({ success: false })),
          axiosClient.get('/sellers/verification/status').catch(() => ({ success: false }))
        ]);
        if (catRes.success) setCatalogue(catRes);
        if (enqRes.success) setEnquiries(enqRes.enquiries || []);
        if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
        if (insightsRes.success) setDemandInsights(insightsRes.insights);
        if (b2bEnqRes.success) setB2bEnquiries(b2bEnqRes.enquiries || []);
        if (verRes.success) setVerificationStatus(verRes.verificationStatus);
      } catch (err) {
        console.error('Failed to load seller dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSellerData();
  }, []);

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      showToast('Please enter your document or registration number.', 'warning');
      return;
    }
    setIsSubmittingVerify(true);
    try {
      const res = await axiosClient.post('/sellers/verification/request', {
        documentType: docType,
        documentNumber: docNumber.trim(),
        reviewNotes: docNotes.trim()
      });
      if (res.success) {
        setVerificationStatus(res.verificationStatus || 'PENDING');
        showToast('Verification request submitted successfully for administrator review!', 'success');
        setIsVerifyModalOpen(false);
      }
    } catch (err) {
      showToast(err.message || 'Verification request submission failed.', 'error');
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  const totalProducts = catalogue.items.length;
  const publishedProducts = catalogue.items.filter((i) => i.isPublished).length;
  const totalViews = catalogue.items.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const pendingEnquiries = enquiries.filter((e) => e.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-brand-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              {sellerProfile?.sellerType?.replace('_', ' ') || 'Registered Seller'}
            </span>
            {(verificationStatus === 'APPROVED' || verificationStatus === 'VERIFIED') ? (
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/90 text-white text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Shop
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(true)}
                className="px-3 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1 transition shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-950" />
                <span>Verification: {verificationStatus} • Submit Proof →</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {sellerProfile?.businessName || `${user?.name}'s Shop`}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl leading-relaxed">
            Welcome to your merchant command center. Track catalogue performance, manage products, respond to customer inquiries, and resell regional goods.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/seller/ai-studio"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 shrink-0 border border-purple-400/40"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Open AI Studio</span>
          </Link>
          <Link
            to="/seller/products/new"
            className="px-5 py-2.5 rounded-xl bg-white text-brand-900 hover:bg-amber-50 font-bold text-xs shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Add Product</span>
          </Link>
          {sellerProfile?._id && (
            <Link
              to={`/sellers/${sellerProfile._id}`}
              className="px-4 py-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 text-white font-semibold text-xs border border-white/20 transition shrink-0"
            >
              View Public Shop
            </Link>
          )}
        </div>
      </div>

      {/* AI Superpowers Banner Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-purple-800/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-purple-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              SwaShop Phase 2 Intelligence
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Seller AI Studio: 4 Superpowers For Your Shop
          </h2>
          <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
            Generate multilingual catalogs from voice or notes, enhance photos with studio sharpness, and calculate fair cost-plus prices.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0">
          <Link
            to="/seller/ai-studio"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition flex flex-col items-center gap-1 group"
          >
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-bold">Catalog AI</span>
          </Link>
          <Link
            to="/seller/ai-studio"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition flex flex-col items-center gap-1 group"
          >
            <Mic className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-bold">Voice-to-Shop</span>
          </Link>
          <Link
            to="/seller/ai-studio"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition flex flex-col items-center gap-1 group"
          >
            <ImageIcon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-bold">Photo Studio</span>
          </Link>
          <Link
            to="/seller/ai-studio"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-center transition flex flex-col items-center gap-1 group"
          >
            <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-bold">Pricing Guide</span>
          </Link>
        </div>
      </div>


      {/* Real-time Dashboard KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Catalogue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Catalogue Items</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalProducts}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>{catalogue.ownProductsCount} Own</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{catalogue.resellProductsCount} Resell</span>
          </div>
        </div>

        {/* Published Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Listings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{publishedProducts}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Live in Marketplace</span>
        </div>

        {/* Resell Listings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Reseller Listings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{catalogue.resellProductsCount}</p>
          <Link to="/seller/reselling" className="text-[11px] text-amber-700 font-bold hover:underline">
            Manage Reselling →
          </Link>
        </div>

        {/* Inquiries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Customer Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{enquiries.length}</p>
          <span className="text-[11px] text-blue-700 font-bold">
            {pendingEnquiries} Pending Response
          </span>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/seller/products/new"
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Add New Product</h3>
            <p className="text-xs text-slate-500 mt-0.5">Upload pictures, set prices, and publish your craft.</p>
          </div>
        </Link>

        <Link
          to="/explore"
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition shrink-0">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Browse to Buy & Resell</h3>
            <p className="text-xs text-slate-500 mt-0.5">Discover products from other artisans to add to your shop.</p>
          </div>
        </Link>

        <Link
          to="/seller/settings"
          className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Shop Profile & Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Edit store description, location coordinates, and logo.</p>
          </div>
        </Link>
      </div>

      {/* Recent Inquiries List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Customer Inquiries</h2>
            <p className="text-xs text-slate-500">Messages sent by potential buyers regarding your products</p>
          </div>
          <Link
            to="/seller/enquiries"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enquiries.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {enquiries.slice(0, 3).map((enq) => (
              <div key={enq._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{enq.customerId?.name || 'Customer'}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        enq.status === 'RESPONDED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {enq.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{enq.message}</p>
                  {enq.productId && (
                    <span className="text-[11px] text-brand-600 font-medium block">
                      Product: {enq.productId.name}
                    </span>
                  )}
                </div>

                <Link
                  to="/seller/enquiries"
                  className="px-4 py-2 bg-slate-100 hover:bg-brand-600 hover:text-white rounded-xl text-xs font-semibold text-slate-700 transition shrink-0 self-start sm:self-auto"
                >
                  Respond
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No customer inquiries received yet.
          </div>
        )}
      </div>

      {/* Discovery Analytics & Market Demand Signals */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-600" />
              <span>Discovery Analytics & Demand Insights</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real telemetry on how regional buyers discover your products and current category trends
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold self-start sm:self-auto">
            Live Platform Telemetry
          </span>
        </div>

        {/* Analytics KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Search Impressions</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {analytics?.metrics?.searchImpressions ?? 0}
            </span>
            <span className="text-[10px] text-slate-500">Appeared in search results</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Product Views</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {analytics?.metrics?.productViews ?? totalViews}
            </span>
            <span className="text-[10px] text-slate-500">Direct detail page visits</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Inquiries Generated</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {enquiries.length}
            </span>
            <span className="text-[10px] text-slate-500">Customer leads generated</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Conversion Ratio</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {analytics?.metrics?.conversionRate ?? (totalViews > 0 ? `${((enquiries.length / totalViews) * 100).toFixed(1)}%` : '0%')}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">Views to lead conversion</span>
          </div>
        </div>

        {/* Discovery Search Terms & Demand Insights Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Top Discovery Keywords */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/20 border border-slate-200/80 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-600" />
              <span>Trending Buyer Search Terms</span>
            </h3>
            <p className="text-xs text-slate-500">
              Recent search queries bringing high traffic across the marketplace
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {demandInsights?.popularTerms?.length > 0 ? (
                demandInsights.popularTerms.map((term, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-full shadow-2xs flex items-center gap-1.5"
                  >
                    <span>{term.term || term}</span>
                    {term.count && (
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 rounded-full">
                        {term.count}
                      </span>
                    )}
                  </span>
                ))
              ) : (
                ['bamboo basket', 'terracotta cookware', 'silk saree', 'pure honey', 'brass idol', 'wooden toy'].map((term, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-full shadow-2xs">
                    {term}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Market Opportunity Recommendations */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/40 to-indigo-50/40 border border-purple-200/80 space-y-3">
            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Market Demand Opportunities</span>
            </h3>
            <div className="space-y-2">
              {demandInsights?.insights?.length > 0 ? (
                demandInsights.insights.map((ins, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ins.title || 'Regional Craft Opportunity'}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {ins.demandLevel || 'High Demand'}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-snug">{ins.message || ins.description}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs text-xs space-y-1">
                    <span className="font-bold text-slate-900">High Corporate Gifting Inquiries</span>
                    <p className="text-slate-600 leading-snug">
                      Buyers are seeking eco-friendly bamboo desk sets and handmade diaries with MOQ 100+.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-2xs text-xs space-y-1">
                    <span className="font-bold text-slate-900">Festival Season Preparation</span>
                    <p className="text-slate-600 leading-snug">
                      Ensure your availability status and stock quantities are updated for instant delivery ranking boost.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* B2B Wholesale Market Linkage Hub */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-indigo-400/30">
                <Briefcase className="w-3 h-3 text-indigo-400" />
                B2B Bulk Linkage Engine
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Institutional & Bulk Procurement
            </h2>
            <p className="text-xs text-indigo-200/80 max-w-xl">
              Receive direct RFP requirements from corporate buyers, retailers, and event planners with bulk order capacity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/b2b"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Browse Open RFPs
            </Link>
            <Link
              to="/seller/settings"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition"
            >
              Configure B2B Capacity
            </Link>
          </div>
        </div>

        {/* Incoming B2B Requirements List */}
        <div>
          <h3 className="text-sm font-bold text-indigo-100 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Incoming B2B Leads & Requirement Enquiries ({b2bEnquiries.length})</span>
          </h3>

          {b2bEnquiries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {b2bEnquiries.slice(0, 4).map((enq) => (
                <div
                  key={enq._id}
                  className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-2 hover:bg-white/15 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{enq.buyerId?.name || 'Institutional Buyer'}</span>
                    <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                      Qty: {enq.quantity || 100} units
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 line-clamp-2">{enq.message}</p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-indigo-300">
                    <span>Target: ₹{enq.targetPrice || 'Negotiable'}/unit</span>
                    <Link to="/seller/enquiries" className="text-amber-300 font-bold hover:underline">
                      Respond to Lead →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-indigo-300">
              No direct institutional RFPs assigned to your workshop yet. Set your B2B production capacity to start receiving matched requirements.
            </div>
          )}
        </div>
      </div>

      {/* Verification Request Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <button
              onClick={() => setIsVerifyModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Submit Shop Verification Details
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verified sellers receive a green trust badge across the marketplace, top ranking in local searches, and institutional buyer matching.
              </p>
            </div>

            <form onSubmit={handleRequestVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Registration / Proof Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-semibold text-slate-800"
                >
                  <option value="UDYAM">Udyam MSME Registration (Recommended)</option>
                  <option value="ARTISAN_CARD">Government Artisan / Weavers Identity Card</option>
                  <option value="GSTIN">GST Identification Number (GSTIN)</option>
                  <option value="TRADE_LICENSE">Municipal Trade License / Gram Panchayat Certificate</option>
                  <option value="PAN">Business / Proprietor PAN Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Document / Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UDYAM-UP-01-0004928"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Review Notes / Business Background (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide any additional details or certificate URL for verification review..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVerify}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmittingVerify ? 'Submitting...' : 'Submit For Verification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboardPage;
