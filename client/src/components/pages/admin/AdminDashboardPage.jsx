import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Store,
  Package,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Layers,
  Repeat,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Sparkles,
  Activity,
  Clock,
  Cpu
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentPendingSellers, setRecentPendingSellers] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [aiStats, setAiStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAdminDashboard = async () => {
    setIsLoading(true);
    try {
      const [dashRes, aiRes] = await Promise.all([
        axiosClient.get('/admin/dashboard'),
        axiosClient.get('/ai/usage').catch(() => ({ success: false }))
      ]);

      if (dashRes.success) {
        setStats(dashRes.stats);
        setRecentPendingSellers(dashRes.recentPendingSellers || []);
        setRecentProducts(dashRes.recentProducts || []);
      }
      if (aiRes.success && aiRes.stats) {
        setAiStats(aiRes.stats);
      }
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
      showToast(err.message || 'Failed to fetch admin stats.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const handleVerifySeller = async (id, status) => {
    try {
      const res = await axiosClient.patch(`/admin/sellers/${id}/verification`, {
        status,
        reviewNotes: `Reviewed and marked ${status} by administrator console`
      });
      showToast(res.message, 'success');
      fetchAdminDashboard();
    } catch (err) {
      showToast(err.message || 'Verification update failed.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-40 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              Platform Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            SwaShop Master Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Real-time telemetry, user moderation, merchant verification, category controls, and admin management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/admins"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manage Admins</span>
          </Link>
          <Link
            to="/admin/categories"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
          >
            Categories
          </Link>
        </div>
      </div>

      {/* Real Live Database Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
          <p className="text-[11px] text-slate-500">
            {stats?.totalCustomers} Customers • {stats?.totalSellers} Sellers
          </p>
        </div>

        {/* Sellers & Verifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Active Sellers</span>
            <Store className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.activeSellers || 0}</p>
          <p className="text-[11px] text-amber-700 font-bold">
            {stats?.pendingSellers || 0} Pending Verification
          </p>
        </div>

        {/* Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Marketplace Products</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.totalProducts || 0}</p>
          <p className="text-[11px] text-emerald-700 font-semibold">
            {stats?.publishedProducts || 0} Published & Live
          </p>
        </div>

        {/* Reselling Ecosystem */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Reseller Listings</span>
            <Repeat className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{stats?.totalResellerListings || 0}</p>
          <p className="text-[11px] text-slate-500">{stats?.totalEnquiries || 0} Inquiries Sent</p>
        </div>
      </div>

      {/* Pending Sellers Verification Review Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Pending Seller Verifications</span>
            </h2>
            <p className="text-xs text-slate-500">
              Review new merchant applications before approving them for public marketplace discovery
            </p>
          </div>
          <Link
            to="/admin/sellers?status=PENDING"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All ({stats?.pendingSellers || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentPendingSellers.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentPendingSellers.map((seller) => (
              <div
                key={seller._id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{seller.businessName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                      {seller.sellerType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Owner: {seller.userId?.name} ({seller.userId?.email}) • {seller.city}, {seller.state}
                  </p>
                  {seller.verificationDetails?.documentNumber && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 w-fit">
                      <span className="font-bold">{seller.verificationDetails.documentType}:</span>
                      <span>{seller.verificationDetails.documentNumber}</span>
                      {seller.verificationDetails.reviewNotes && (
                        <span className="text-slate-600 font-sans italic">— {seller.verificationDetails.reviewNotes}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerifySeller(seller._id, 'VERIFIED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Approve</span>
                  </button>
                  <button
                    onClick={() => handleVerifySeller(seller._id, 'REJECTED')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
            All registered sellers are currently reviewed and up to date!
          </div>
        )}
      </div>

      {/* Phase 2: AI Seller Intelligence Telemetry & Audit Section */}
      {aiStats && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Phase 2 AI Telemetry
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  {aiStats.successRate}% Success Rate
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Seller AI Platform Operations & Usage Audit
              </h2>
              <p className="text-xs text-slate-500">
                Live monitoring of Gemini 2.5 Flash, Cloudinary AI Transformations, and Local Fallback Engines.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total AI Requests</p>
                <p className="text-2xl font-black text-purple-700">{aiStats.totalCalls}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Successful / Failed</p>
                <p className="text-sm font-extrabold text-slate-700">
                  <span className="text-emerald-600">{aiStats.successfulCalls}</span> /{' '}
                  <span className="text-rose-600">{aiStats.failedCalls}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Feature Breakdown Badges */}
          {aiStats.featureBreakdown && aiStats.featureBreakdown.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Features Breakdown:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {aiStats.featureBreakdown.map((feat) => (
                  <div key={feat._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{feat._id}</p>
                    <p className="text-lg font-black text-slate-800">{feat.count}</p>
                    <p className="text-[10px] text-slate-400">{Math.round(feat.avgDuration || 0)}ms avg</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent AI Invocation Logs */}
          {aiStats.recentLogs && aiStats.recentLogs.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent AI Operations Log:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Feature</th>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Provider / Model</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiStats.recentLogs.slice(0, 8).map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-3 font-bold text-purple-700">{log.feature}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{log.userId?.name || 'Seller'}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{log.provider} ({log.model})</td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">{log.durationMs}ms</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{log.inputSummary || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Quick Navigation Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition space-y-1 block"
        >
          <Users className="w-6 h-6 text-brand-600 mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">User Management</h3>
          <p className="text-xs text-slate-500">View, search, and toggle active status for customers and sellers.</p>
        </Link>

        <Link
          to="/admin/sellers"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition space-y-1 block"
        >
          <Store className="w-6 h-6 text-emerald-600 mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Seller Management</h3>
          <p className="text-xs text-slate-500">Moderate seller verifications, approve, reject, or suspend shops.</p>
        </Link>

        <Link
          to="/admin/products"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-1 block"
        >
          <Package className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Product Moderation</h3>
          <p className="text-xs text-slate-500">Oversee public catalogue, hide inappropriate items, and inspect listings.</p>
        </Link>

        <Link
          to="/admin/admins"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition space-y-1 block"
        >
          <ShieldAlert className="w-6 h-6 text-amber-600 mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Admin Access</h3>
          <p className="text-xs text-slate-500">Manage administrator privileges and securely invite additional admins.</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
