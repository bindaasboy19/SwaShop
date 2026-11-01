import React, { useState } from 'react';
import { Send, AlertCircle, MessageSquare } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const EnquiryModal = ({ isOpen, onClose, seller, product = null }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [message, setMessage] = useState(
    product
      ? `Hello! Is '${product.name}' in stock at your shop right now? I would like to visit to inspect the quality.`
      : 'Hello! I would like to inquire about your shop timings and available stock.'
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const quickPrompts = product ? [
    'Is this in stock right now?',
    'What are your shop hours today?',
    'Can I visit this evening to check quality?',
    'Do you have multiple pieces available?'
  ] : [
    'What are your shop hours today?',
    'Where is your physical shop located?',
    'Do you accept custom craft orders?'
  ];

  if (!seller) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      setError('Please sign in to send an enquiry to the seller.');
      return;
    }

    if (!message.trim()) {
      setError('Please provide your enquiry message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/enquiries', {
        sellerId: seller._id,
        productId: product?._id || null,
        message: message.trim(),
        contactPhone: phone.trim()
      });

      if (res.success) {
        showToast('Message sent to shop owner successfully!', 'success');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chat with ${seller.businessName || 'Shop'}`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {product && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=200'}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Inquiring about:</p>
              <p className="font-bold text-slate-900 text-sm truncate">{product.name}</p>
              <p className="text-xs font-semibold text-brand-600">₹{product.price}</p>
            </div>
          </div>
        )}

        {/* Quick prompt chips */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Quick Questions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage(q)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Your Message *
          </label>
          <textarea
            rows="3"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about stock availability, shop timings, or quality inspection..."
            className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Your Contact Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm shadow-xs transition flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EnquiryModal;
