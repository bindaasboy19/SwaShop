import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Trash2,
  Sparkles,
  RefreshCw,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  Info
} from 'lucide-react';
import axiosClient from '../../../api/axiosClient.js';
import { useToast } from '../../../context/ToastContext.jsx';
import ImageUploadDropzone from '../../upload/ImageUploadDropzone.jsx';

const EditProductPage = () => {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stockStatus, setStockStatus] = useState('AVAILABLE');
  const [availability, setAvailability] = useState(true);
  const [tags, setTags] = useState('');
  const [images, setImages] = useState([]);

  // Phase 2 AI Fields
  const [features, setFeatures] = useState([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [attributes, setAttributes] = useState({});
  const [keywords, setKeywords] = useState([]);
  const [titleHi, setTitleHi] = useState('');
  const [descriptionHi, setDescriptionHi] = useState('');
  const [enhancedImages, setEnhancedImages] = useState([]);

  // AI Loading states
  const [isAiLoadingTitle, setIsAiLoadingTitle] = useState(false);
  const [isAiLoadingDesc, setIsAiLoadingDesc] = useState(false);
  const [isAiLoadingCategory, setIsAiLoadingCategory] = useState(false);
  const [isAiLoadingTags, setIsAiLoadingTags] = useState(false);
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);

  // Pricing modal
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [costMaterial, setCostMaterial] = useState(200);
  const [costLaborHours, setCostLaborHours] = useState(2);
  const [costHourlyRate, setCostHourlyRate] = useState(100);
  const [costPackaging, setCostPackaging] = useState(30);
  const [costOverhead, setCostOverhead] = useState(20);
  const [pricingSuggestion, setPricingSuggestion] = useState(null);
  const [isAiLoadingPricing, setIsAiLoadingPricing] = useState(false);

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          axiosClient.get('/categories'),
          axiosClient.get(`/products/${id}`)
        ]);

        if (catRes.success) setCategories(catRes.categories);
        if (prodRes.success) {
          const p = prodRes.product;
          setName(p.name);
          setDescription(p.description || '');
          setCategoryId(p.categoryId?._id || p.categoryId);
          setPrice(p.price);
          setDiscountPrice(p.discountPrice || '');
          setStockStatus(p.stockStatus || 'AVAILABLE');
          setAvailability(p.availability !== undefined ? p.availability : true);
          setTags(p.tags ? p.tags.join(', ') : '');
          setImages(p.images || []);
          setFeatures(p.features || []);
          setAttributes(p.attributes || {});
          setKeywords(p.keywords || []);
          setTitleHi(p.multilingual?.title?.hi || '');
          setDescriptionHi(p.multilingual?.description?.hi || '');
          setEnhancedImages(p.enhancedImages || []);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load product.', 'error');
        navigate('/seller/products');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate, showToast]);

  const calculateCompleteness = () => {
    let score = 0;
    if (name.trim().length >= 3) score += 15;
    if (description.trim().length >= 30) score += 20;
    else if (description.trim().length > 0) score += 10;
    if (categoryId) score += 15;
    if (images.length > 0) score += 20;
    if (price && parseFloat(price) > 0) score += 10;
    if (tags.trim().length > 0) score += 10;
    if (features.length > 0 || Object.keys(attributes).length > 0) score += 10;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  const handleAiSuggestTitle = async () => {
    setIsAiLoadingTitle(true);
    try {
      const res = await axiosClient.post('/ai/title', { name, text: description, productId: id });
      if (res.success && res.title) {
        setName(res.title);
        showToast('Generated improved title!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Title suggestion failed.', 'error');
    } finally {
      setIsAiLoadingTitle(false);
    }
  };

  const handleAiSuggestDescription = async () => {
    setIsAiLoadingDesc(true);
    try {
      const res = await axiosClient.post('/ai/description', {
        name,
        details: description,
        language: 'both',
        productId: id
      });
      if (res.success) {
        if (res.description) setDescription(res.description);
        if (res.descriptionHi) setDescriptionHi(res.descriptionHi);
        if (res.features && res.features.length > 0) {
          setFeatures(res.features);
        }
        showToast('Updated description & features!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Description generation failed.', 'error');
    } finally {
      setIsAiLoadingDesc(false);
    }
  };

  const handleAiSuggestCategory = async () => {
    setIsAiLoadingCategory(true);
    try {
      const res = await axiosClient.post('/ai/category', { name, description, productId: id });
      if (res.success && res.categoryId) {
        setCategoryId(res.categoryId);
        showToast(`Category updated to '${res.categoryName}'`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Category suggestion failed.', 'error');
    } finally {
      setIsAiLoadingCategory(false);
    }
  };

  const handleAiSuggestTags = async () => {
    setIsAiLoadingTags(true);
    try {
      const res = await axiosClient.post('/ai/tags', { name, description, productId: id });
      if (res.success && res.tags) {
        setTags(res.tags.join(', '));
        if (res.keywords) setKeywords(res.keywords);
        showToast(`Generated ${res.tags.length} high-relevance tags!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Tag generation failed.', 'error');
    } finally {
      setIsAiLoadingTags(false);
    }
  };

  const handleAiEnhanceImage = async (imgUrl, index) => {
    setIsEnhancingImage(true);
    try {
      const res = await axiosClient.post('/ai/image/enhance', { imageUrl: imgUrl, productId: id });
      if (res.success && res.enhanced) {
        const updated = [...images];
        updated[index] = res.enhanced;
        setImages(updated);
        setEnhancedImages([...enhancedImages, { original: res.original, enhanced: res.enhanced }]);
        showToast('Enhanced image contrast and clarity!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Image enhancement failed.', 'error');
    } finally {
      setIsEnhancingImage(false);
    }
  };

  const handleCalculateFairPrice = async () => {
    setIsAiLoadingPricing(true);
    try {
      const selectedCat = categories.find((c) => c._id === categoryId);
      const res = await axiosClient.post('/ai/price/suggest', {
        costData: {
          materialCost: parseFloat(costMaterial) || 0,
          laborHours: parseFloat(costLaborHours) || 0,
          hourlyRate: parseFloat(costHourlyRate) || 0,
          packagingCost: parseFloat(costPackaging) || 0,
          overheadCost: parseFloat(costOverhead) || 0
        },
        categorySlug: selectedCat?.slug || '',
        productId: id
      });
      if (res.success) {
        setPricingSuggestion(res);
      }
    } catch (err) {
      showToast(err.message || 'Pricing calculation failed.', 'error');
    } finally {
      setIsAiLoadingPricing(false);
    }
  };

  const handleAddFeature = () => {
    if (newFeatureInput.trim()) {
      setFeatures([...features, newFeatureInput.trim()]);
      setNewFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setIsSubmitting(true);
    try {
      const res = await axiosClient.put(`/products/${id}`, {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stockStatus,
        availability,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images,
        features,
        attributes,
        keywords,
        multilingual: {
          title: { en: name.trim(), hi: titleHi.trim() },
          description: { en: description.trim(), hi: descriptionHi.trim() }
        },
        enhancedImages
      });

      if (res.success) {
        showToast('Product updated successfully!', 'success');
        navigate('/seller/products');
      }
    } catch (err) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/seller/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </Link>
        <Link
          to="/seller/ai-studio"
          className="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition flex items-center gap-1.5 border border-purple-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span>Open AI Studio</span>
        </Link>
      </div>

      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit Catalogue Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Refine pricing, improve descriptions, and enhance catalog score with AI assistance.
          </p>
        </div>

        {/* Live Catalog Completeness Meter */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catalog Completeness</p>
            <p className={`text-base font-black ${completeness >= 80 ? 'text-emerald-600' : completeness >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {completeness}% {completeness >= 80 ? '• Excellent' : completeness >= 50 ? '• Good' : '• Incomplete'}
            </p>
          </div>
          <div className="w-20 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completeness >= 80 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Essentials Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Product Essentials
          </h2>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Product Title (English) *</label>
              <button
                type="button"
                onClick={handleAiSuggestTitle}
                disabled={isAiLoadingTitle}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 border border-purple-200 disabled:opacity-50"
              >
                {isAiLoadingTitle ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-600" />}
                <span>AI Title Assist</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              उत्पाद शीर्षक (हिंदी - वैकल्पिक)
            </label>
            <input
              type="text"
              value={titleHi}
              onChange={(e) => setTitleHi(e.target.value)}
              placeholder="उदा. प्राकृतिक बांस की हस्तनिर्मित टोकरी"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Category *</label>
                <button
                  type="button"
                  onClick={handleAiSuggestCategory}
                  disabled={isAiLoadingCategory}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md transition flex items-center gap-1 border border-purple-200"
                >
                  {isAiLoadingCategory ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-600" />}
                  <span>AI Suggest</span>
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none bg-white font-medium"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Stock Status</label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none bg-white font-medium"
              >
                <option value="AVAILABLE">Available / In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Description</label>
              <button
                type="button"
                onClick={handleAiSuggestDescription}
                disabled={isAiLoadingDesc}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 border border-purple-200 disabled:opacity-50"
              >
                {isAiLoadingDesc ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-600" />}
                <span>Generate Story & Features</span>
              </button>
            </div>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none leading-relaxed"
            />
          </div>

          {descriptionHi && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                उत्पाद विवरण (हिंदी)
              </label>
              <textarea
                rows="3"
                value={descriptionHi}
                onChange={(e) => setDescriptionHi(e.target.value)}
                className="w-full p-4 text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Key Bullet Features */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Key Bullet Features</label>
            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-800 font-medium flex-1">{feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-400 hover:text-rose-600 text-xs px-2 py-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  placeholder="Add bullet feature..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-purple-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base">Pricing & Tags</h2>
            <button
              type="button"
              onClick={() => {
                setShowPricingModal(true);
                handleCalculateFairPrice();
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition flex items-center gap-1.5 border border-emerald-200"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Price Calculator</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Discount Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Search Tags</label>
              <button
                type="button"
                onClick={handleAiSuggestTags}
                disabled={isAiLoadingTags}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 border border-purple-200 disabled:opacity-50"
              >
                {isAiLoadingTags ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-600" />}
                <span>AI Tag Assist</span>
              </button>
            </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Photos Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base">Product Photos</h2>
            <span className="text-xs font-bold text-slate-500">{images.length} / 5 photos</span>
          </div>

          <ImageUploadDropzone images={images} onImagesChange={setImages} maxImages={5} />

          {images.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Photo Studio Enhancements</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAiEnhanceImage(img, i)}
                    disabled={isEnhancingImage}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition flex items-center gap-1.5 border border-blue-200 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Enhance Photo #{i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/seller/products"
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Changes...' : 'Save Product Updates'}</span>
          </button>
        </div>
      </form>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Deterministic Craft Pricing Assistant</span>
              </h3>
              <button onClick={() => setShowPricingModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Materials Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={costMaterial}
                  onChange={(e) => setCostMaterial(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Labor Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={costLaborHours}
                    onChange={(e) => setCostLaborHours(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Hourly Rate (₹/hr)</label>
                  <input
                    type="number"
                    min="0"
                    value={costHourlyRate}
                    onChange={(e) => setCostHourlyRate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalculateFairPrice}
                disabled={isAiLoadingPricing}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
              >
                {isAiLoadingPricing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                <span>Calculate Recommendation</span>
              </button>
            </div>

            {pricingSuggestion && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Recommended Price:</span>
                  <span className="text-2xl font-black text-emerald-900">₹{pricingSuggestion.recommendedPrice}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-700 border-t border-emerald-200/60 pt-2">
                  <span>Base Cost: ₹{pricingSuggestion.baseCost}</span>
                  <span>Margin: {pricingSuggestion.marginPercentage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPrice(String(pricingSuggestion.recommendedPrice));
                    setShowPricingModal(false);
                    showToast(`Updated price to ₹${pricingSuggestion.recommendedPrice}`, 'success');
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                >
                  Apply ₹{pricingSuggestion.recommendedPrice} to Product
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProductPage;
