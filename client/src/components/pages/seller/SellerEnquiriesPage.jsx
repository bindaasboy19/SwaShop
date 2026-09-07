import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Mail, Package, Send, CheckCircle2, CornerDownRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/common/Modal.jsx';

const SellerEnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Response Modal state
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [status, setStatus] = useState('RESPONDED');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const { showToast } = useToast();

  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/enquiries/received');
      if (res.success) {
        setEnquiries(res.enquiries || []);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    setIsSendingReply(true);
    try {
      const res = await axiosClient.patch(`/enquiries/${selectedEnquiry._id}`, {
        responseMessage: replyMessage.trim(),
        status
      });

      if (res.success) {
        showToast('Response sent to customer successfully!', 'success');
        setSelectedEnquiry(null);
        setReplyMessage('');
        fetchEnquiries();
      }
    } catch (err) {
      showToast(err.message || 'Failed to send response.', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 text-brand-600" />
          <span>Customer & Buyer Inquiries</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Respond directly to questions, bulk order requests, and custom craft orders
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
              className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {enq.customerId?.name || 'Customer'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        enq.status === 'RESPONDED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : enq.status === 'CLOSED'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {enq.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    {enq.contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {enq.contactPhone}
                      </span>
                    )}
                    {enq.contactEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {enq.contactEmail}
                      </span>
                    )}
                    <span>• {new Date(enq.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedEnquiry(enq);
                    setReplyMessage(enq.responseMessage || '');
                    setStatus(enq.status === 'PENDING' ? 'RESPONDED' : enq.status);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
                >
                  {enq.responseMessage ? 'Edit Reply' : 'Reply to Customer'}
                </button>
              </div>

              {enq.productId && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3 text-xs">
                  <Package className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="text-slate-500">Subject Product:</span>
                  <span className="font-bold text-slate-900">{enq.productId.name} (₹{enq.productId.price})</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Customer Question:
                </span>
                <p className="leading-relaxed">{enq.message}</p>
              </div>

              {enq.responseMessage && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-sm text-emerald-950 space-y-1 flex items-start gap-2.5">
                  <CornerDownRight className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Your Sent Response:
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
          <h3 className="font-bold text-slate-800 text-lg">No inquiries received yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When buyers or other sellers discover your products and send messages, they will appear here.
          </p>
        </div>
      )}

      {/* Reply Modal */}
      {selectedEnquiry && (
        <Modal
          isOpen={Boolean(selectedEnquiry)}
          onClose={() => setSelectedEnquiry(null)}
          title={`Reply to ${selectedEnquiry.customerId?.name || 'Customer'}`}
        >
          <form onSubmit={handleSendReply} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
              <strong>Question:</strong> {selectedEnquiry.message}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Your Response *
              </label>
              <textarea
                rows="4"
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response regarding pricing, delivery, or custom order details..."
                className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Inquiry Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white font-medium"
              >
                <option value="RESPONDED">Responded</option>
                <option value="CLOSED">Closed / Resolved</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingReply}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingReply ? 'Sending...' : 'Send Response'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SellerEnquiriesPage;
