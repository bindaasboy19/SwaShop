import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Tag,
  FileText,
  Languages,
  ShieldCheck,
  Edit3
} from 'lucide-react';

const AiEnhanceReviewModal = ({
  isOpen,
  onClose,
  aiData,
  onAccept,
  onRegenerate,
  isRegenerating = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    titleHi: '',
    description: '',
    descriptionHi: '',
    categoryId: '',
    categoryName: '',
    features: [],
    tags: [],
    keywords: [],
    originalImage: null,
    enhancedImage: null
  });

  const [activeTab, setActiveTab] = useState('english'); // 'english' | 'hindi' | 'image'
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (aiData) {
      setFormData({
        name: aiData.name || '',
        titleHi: aiData.titleHi || '',
        description: aiData.description || '',
        descriptionHi: aiData.descriptionHi || '',
        categoryId: aiData.categoryId || '',
        categoryName: aiData.categoryName || '',
        features: Array.isArray(aiData.features) ? [...aiData.features] : [],
        tags: Array.isArray(aiData.tags) ? [...aiData.tags] : [],
        keywords: Array.isArray(aiData.keywords) ? [...aiData.keywords] : [],
        originalImage: aiData.originalImage || null,
        enhancedImage: aiData.enhancedImage || null
      });
    }
  }, [aiData]);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (idx) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  const handleApply = () => {
    onAccept(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-purple-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                AI Listing Assistant
              </span>
              <span className="text-xs text-purple-200">• Review & Edit Before Applying</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Enhanced Product Preview
            </h2>
            <p className="text-xs text-purple-200/80">
              Review AI suggestions below. You have complete control to edit any field before accepting.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trust & Non-fabrication Notice */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200/60 flex items-center gap-2 text-[11px] text-amber-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Authenticity Guarantee:</strong> SwaShop connects customers to your physical shop. Ensure all details truthfully reflect your real product.
          </span>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Image Enhancement Preview (if image available) */}
          {(formData.originalImage || formData.enhancedImage) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                Photography Presentation
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.originalImage && (
                  <div className="space-y-1 text-center">
                    <p className="text-[11px] font-semibold text-slate-500">Original Seller Photo</p>
                    <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                      <img
                        src={formData.originalImage}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {formData.enhancedImage && (
                  <div className="space-y-1 text-center">
                    <p className="text-[11px] font-bold text-purple-700 flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Studio Cleaned Presentation
                    </p>
                    <div className="aspect-4/3 rounded-xl overflow-hidden bg-white border-2 border-purple-300 shadow-sm relative">
                      <img
                        src={formData.enhancedImage}
                        alt="Enhanced Presentation"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-purple-900/80 text-white text-[10px] font-bold">
                        Enhanced
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Language Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('english')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                activeTab === 'english'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>English Listing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hindi')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                activeTab === 'hindi'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>हिन्दी विवरण (Hindi)</span>
            </button>
          </div>

          {/* English Tab Content */}
          {activeTab === 'english' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Professional Product Title
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Professional Narrative Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-slate-800 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Hindi Tab Content */}
          {activeTab === 'hindi' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  उत्पाद शीर्षक (हिंदी)
                </label>
                <input
                  type="text"
                  value={formData.titleHi}
                  onChange={(e) => setFormData({ ...formData, titleHi: e.target.value })}
                  placeholder="उदा. प्राकृतिक बांस की हस्तनिर्मित टोकरी"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  उत्पाद विवरण (हिंदी)
                </label>
                <textarea
                  rows={4}
                  value={formData.descriptionHi}
                  onChange={(e) => setFormData({ ...formData, descriptionHi: e.target.value })}
                  placeholder="हिंदी में विस्तृत उत्पाद विवरण..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-slate-800 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Bullet Features */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Structured Features & Highlights
            </label>
            <div className="space-y-1.5">
              {formData.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => {
                      const updated = [...formData.features];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, features: updated });
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-rose-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                placeholder="Add another highlight or dimension..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Tags & Keywords Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-600" />
              Search Keywords & Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {formData.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium text-xs border border-purple-200 flex items-center gap-1"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
          >
            Cancel / Keep Existing
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Accept & Apply to Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiEnhanceReviewModal;
