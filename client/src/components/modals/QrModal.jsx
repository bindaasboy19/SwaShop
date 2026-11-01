import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Printer, MessageCircle, ExternalLink } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

const QrModal = ({ isOpen, onClose, title = 'Digital Storefront QR', canonicalUrl, qrDataUrl, whatsappUrl, subtitle = '' }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleCopy = () => {
    if (canonicalUrl) {
      navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col text-center">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 print:p-2">
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}

          {/* QR Code Container */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 inline-block mx-auto shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-48 h-48 mx-auto rounded-lg shadow-xs object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12 animate-pulse" />
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-semibold block mt-2 uppercase tracking-wider">
              Scan with camera to explore
            </span>
          </div>

          {/* Canonical URL preview */}
          {canonicalUrl && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100 rounded-xl text-xs text-slate-600">
              <span className="truncate max-w-[200px]">{canonicalUrl}</span>
              <button
                onClick={handleCopy}
                className="p-1 text-slate-500 hover:text-brand-600 transition"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* WhatsApp & Print Actions */}
          <div className="space-y-2 pt-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Connect / Share on WhatsApp
              </a>
            )}

            <button
              onClick={handlePrint}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print QR Code Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrModal;
