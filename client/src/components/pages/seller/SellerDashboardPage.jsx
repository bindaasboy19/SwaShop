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
  ArrowRight
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

const SellerDashboardPage = () => {
  const { user, sellerProfile } = useAuth();
  const [catalogue, setCatalogue] = useState({ ownProductsCount: 0, resellProductsCount: 0, items: [] });
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      setIsLoading(true);
      try {
        const [catRes, enqRes] = await Promise.all([
          axiosClient.get('/reseller-listings/catalogue'),
          axiosClient.get('/enquiries/received')
        ]);
        if (catRes.success) setCatalogue(catRes);
        if (enqRes.success) setEnquiries(enqRes.enquiries || []);
      } catch (err) {
        console.error('Failed to load seller dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSellerData();
  }, []);

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
            {sellerProfile?.verificationStatus === 'APPROVED' ? (
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/90 text-white text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Shop
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Verification: {sellerProfile?.verificationStatus || 'PENDING'}
              </span>
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
            to="/seller/products/new"
            className="px-5 py-2.5 rounded-xl bg-white text-brand-900 hover:bg-amber-50 font-bold text-xs shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Add New Product</span>
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
    </div>
  );
};

export default SellerDashboardPage;
