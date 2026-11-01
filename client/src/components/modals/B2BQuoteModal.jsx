import React, { useState } from 'react';
import { X, Briefcase, FileText, Send, ShieldCheck } from 'lucide-react';
import { apiPost } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const B2BQuoteModal = ({ isOpen, onClose, requirement, onSuccess }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState([
    {
      title: requirement?.title || 'Wholesale Order',
      quantity: requirement?.quantity || 100,
      unitPrice: requirement?.targetPrice || 250,
      total: (requirement?.quantity || 100) * (requirement?.targetPrice || 250)
    }
  ]);
  const [leadTimeDays, setLeadTimeDays] = useState(14);
  const [shippingIncluded, setShippingIncluded] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !requirement) return null;

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(field === 'quantity' ? value : updated[index].quantity) || 0;
      const p = Number(field === 'unitPrice' ? value : updated[index].unitPrice) || 0;
      updated[index].total = q * p;
    }
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      showToast('Please specify valid pricing and quantities', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiPost('/b2b/quotes', {
        requirementId: requirement._id,
        items,
        totalAmount,
        leadTimeDays,
        shippingIncluded,
        notes
      });

      if (res && res.success) {
        showToast('Quotation submitted successfully to buyer!', 'success');
        if (onSuccess) onSuccess(res.quote);
        onClose();
      } else {
        showToast(res?.message || 'Failed to submit quotation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error submitting quotation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-lg">Submit B2B Quotation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs">
            <span className="text-indigo-900 font-bold block">{requirement.title}</span>
            <span className="text-indigo-700">Required Quantity: {requirement.quantity} units • Target: ~₹{requirement.targetPrice}/unit</span>
          </div>

          {/* Line items */}
          {items.map((item, idx) => (
            <div key={idx} className="space-y-2 border border-slate-200 p-3.5 rounded-2xl bg-slate-50/40">
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                placeholder="Product item name"
                required
                className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
              />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Item Total (₹)</label>
                  <input
                    type="number"
                    value={item.total}
                    disabled
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-100 font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Terms */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value, 10))}
                className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shippingIncluded}
                  onChange={(e) => setShippingIncluded(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-700">Shipping Included</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Customization & Terms Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Free sample dispatch, logo packaging, GST invoice provided..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Total Quotation Value:</span>
            <span className="text-sm font-extrabold text-indigo-600">₹{totalAmount}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sending Quotation...' : 'Send Formal Quotation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default B2BQuoteModal;
