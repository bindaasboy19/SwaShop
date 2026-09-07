import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Clock, CheckCircle2, Store, Package, ArrowRight, CornerDownRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';

const CustomerEnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnquiries = async () => {
      setIsLoading(true);
      try {
        const res = await axiosClient.get('/enquiries/sent');
        if (res.success) {
          setEnquiries(res.enquiries || []);
        }
      } catch (err) {
        console.error('Failed to fetch customer enquiries:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 text-brand-600" />
          <span>My Sent Inquiries</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Direct messages and price/order questions you've sent to local sellers
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : enquiries.length > 0 ? (
        <div className="space-y-4">
          {enquiries.map((enq) => (
            <div
              key={enq._id}
              className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
            >
              {/* Top Row: Seller and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <img
                      src={enq.sellerId?.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                      alt={enq.sellerId?.businessName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      to={`/sellers/${enq.sellerId?._id}`}
                      className="font-bold text-slate-900 text-sm hover:text-brand-600 transition"
                    >
                      {enq.sellerId?.businessName || 'Local Seller'}
                    </Link>
                    <p className="text-[11px] text-slate-400">
                      Sent on {new Date(enq.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                    enq.status === 'RESPONDED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : enq.status === 'CLOSED'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {enq.status === 'RESPONDED' ? 'Seller Responded' : enq.status}
                </span>
              </div>

              {/* Product Card if attached */}
              {enq.productId && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3 text-xs">
                  <Package className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="text-slate-500">Subject:</span>
                  <Link
                    to={`/products/${enq.productId._id}`}
                    className="font-bold text-slate-900 hover:text-brand-600 truncate"
                  >
                    {enq.productId.name} (₹{enq.productId.price})
                  </Link>
                </div>
              )}

              {/* Your Message */}
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Your Message:
                </span>
                <p className="leading-relaxed">{enq.message}</p>
              </div>

              {/* Seller Response */}
              {enq.responseMessage && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-sm text-emerald-950 space-y-1 flex items-start gap-2.5">
                  <CornerDownRight className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Seller Response:
                    </span>
                    <p className="leading-relaxed font-medium">{enq.responseMessage}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-lg">No inquiries sent yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you contact local sellers about custom craft orders or questions, your conversations will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerEnquiriesPage;
