import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Search, CheckCircle2, XCircle, AlertCircle, Ban, ArrowRight, ExternalLink } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('sellerType', typeFilter);

      const res = await axiosClient.get(`/admin/sellers?${params.toString()}`);
      if (res.success) {
        setSellers(res.sellers || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch sellers.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [statusFilter, typeFilter]);

  const handleUpdateVerification = async (sellerId, newStatus) => {
    try {
      const res = await axiosClient.patch(`/admin/sellers/${sellerId}/verification`, {
        status: newStatus
      });
      if (res.success) {
        showToast(res.message, 'success');
        fetchSellers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update verification status.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Store className="w-7 h-7 text-emerald-600" />
          <span>Seller & Artisan Management</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Verify merchant applications, moderate storefronts, and control marketplace visibility
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchSellers();
          }}
          className="relative flex-1 w-full sm:w-auto"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business name, city, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl outline-none"
          >
            <option value="">All Verification Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved (Live)</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl outline-none"
          >
            <option value="">All Seller Types</option>
            <option value="ARTISAN">Artisan</option>
            <option value="LOCAL_SHOP">Local Shop</option>
            <option value="MICRO_ENTREPRENEUR">Micro-Entrepreneur</option>
            <option value="MSME">MSME</option>
          </select>
        </div>
      </div>

      {/* Sellers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sellers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {sellers.map((s) => (
            <div
              key={s._id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={s.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                    alt={s.businessName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{s.businessName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                      {s.sellerType}
                    </span>

                    {/* Verification Status Pill */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        s.verificationStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.verificationStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-900'
                          : s.verificationStatus === 'SUSPENDED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s.verificationStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Owner: <strong>{s.userId?.name}</strong> ({s.userId?.email}) • {s.city}, {s.state} {s.phone ? `• ${s.phone}` : ''}
                  </p>
                  {s.description && (
                    <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">{s.description}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                <Link
                  to={`/sellers/${s._id}`}
                  target="_blank"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition"
                  title="Preview public storefront"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Link>

                {s.verificationStatus !== 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateVerification(s._id, 'APPROVED')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                )}

                {s.verificationStatus !== 'SUSPENDED' && s.verificationStatus === 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateVerification(s._id, 'SUSPENDED')}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-amber-200"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </button>
                )}

                {s.verificationStatus === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateVerification(s._id, 'REJECTED')}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                {s.verificationStatus === 'SUSPENDED' && (
                  <button
                    onClick={() => handleUpdateVerification(s._id, 'APPROVED')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
          No sellers found matching criteria.
        </div>
      )}
    </div>
  );
};

export default AdminSellersPage;
