import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  PlusCircle,
  ArrowLeft,
  AlertCircle,
  Check,
  Eye,
  Sparkles,
  RefreshCw,
  Info,
  DollarSign,
  Tag,
  Layers,
  FileText,
  Mic,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import axiosClient from '../../../api/axiosClient.js';
import { useToast } from '../../../context/ToastContext.jsx';
import ImageUploadDropzone from '../../upload/ImageUploadDropzone.jsx';

const AddProductPage = () => {
  const routerLocation = useLocation();
  const prefill = routerLocation.state?.prefill || null;

  const [name, setName] = useState(prefill?.name || '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [categoryId, setCategoryId] = useState(prefill?.categoryId || '');
  const [price, setPrice] = useState(prefill?.price || '');
  const [discountPrice, setDiscountPrice] = useState(prefill?.discountPrice || '');
  const [stockStatus, setStockStatus] = useState('AVAILABLE');
  const [availability, setAvailability] = useState(true);
  const [tags, setTags] = useState(prefill?.tags || '');
  const [images, setImages] = useState(prefill?.images || []);

  // Phase 2 AI Fields
  const [features, setFeatures] = useState(prefill?.features || []);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [attributes, setAttributes] = useState(prefill?.attributes || {});
  const [keywords, setKeywords] = useState(prefill?.keywords || []);
  const [titleHi, setTitleHi] = useState(prefill?.multilingual?.title?.hi || '');
  const [descriptionHi, setDescriptionHi] = useState(prefill?.multilingual?.description?.hi || '');
  const [enhancedImages, setEnhancedImages] = useState([]);

  // AI Loading states for inline buttons
  const [isAiLoadingTitle, setIsAiLoadingTitle] = useState(false);
  const [isAiLoadingDesc, setIsAiLoadingDesc] = useState(false);
  const [isAiLoadingCategory, setIsAiLoadingCategory] = useState(false);
  const [isAiLoadingTags, setIsAiLoadingTags] = useState(false);
  const [isAiLoadingPricing, setIsAiLoadingPricing] = useState(false);
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);

  // Pricing Assistant Modal / Drawer State
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [costMaterial, setCostMaterial] = useState(200);
  const [costLaborHours, setCostLaborHours] = useState(2);
  const [costHourlyRate, setCostHourlyRate] = useState(100);
  const [costPackaging, setCostPackaging] = useState(30);
  const [costOverhead, setCostOverhead] = useState(20);
  const [pricingSuggestion, setPricingSuggestion] = useState(null);

  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get('/categories');
        if (res.success) {
          setCategories(res.categories);
          if (!categoryId && res.categories.length > 0) {
            setCategoryId(res.categories[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Compute Catalog Completeness Score
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

  // 1. Quick AI Title Suggestion
  const handleAiSuggestTitle = async () => {
    if (!name && !description) {
      showToast('Type a few words in title or description first.', 'info');
      return;
    }
    setIsAiLoadingTitle(true);
    try {
      const res = await axiosClient.post('/ai/title', { name, text: description });
      if (res.success && res.title) {
        setName(res.title);
        showToast('Generated high-conversion product title!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Title suggestion failed.', 'error');
    } finally {
      setIsAiLoadingTitle(false);
    }
  };

  // 2. Quick AI Description & Features Generator
  const handleAiSuggestDescription = async () => {
    if (!name.trim()) {
      showToast('Please enter a product title first.', 'info');
      return;
    }
    setIsAiLoadingDesc(true);
    try {
      const res = await axiosClient.post('/ai/description', {
        name,
        details: description,
        language: 'both'
      });
      if (res.success) {
        if (res.description) setDescription(res.description);
        if (res.descriptionHi) setDescriptionHi(res.descriptionHi);
        if (res.features && res.features.length > 0) {
          setFeatures(res.features);
        }
        showToast('Generated rich narrative and key bullet features!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Description generation failed.', 'error');
    } finally {
      setIsAiLoadingDesc(false);
    }
  };

  // 3. Quick AI Category Recommender
  const handleAiSuggestCategory = async () => {
    if (!name && !description) {
      showToast('Provide title or description first.', 'info');
      return;
    }
    setIsAiLoadingCategory(true);
    try {
      const res = await axiosClient.post('/ai/category', { name, description });
      if (res.success && res.categoryId) {
        setCategoryId(res.categoryId);
        showToast(`Category set to '${res.categoryName}' (${res.confidence} confidence)`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Category suggestion failed.', 'error');
    } finally {
      setIsAiLoadingCategory(false);
    }
  };

  // 4. Quick AI Tags & Keywords Generator
  const handleAiSuggestTags = async () => {
    if (!name && !description) {
      showToast('Provide title or description first.', 'info');
      return;
    }
    setIsAiLoadingTags(true);
    try {
      const res = await axiosClient.post('/ai/tags', { name, description });
      if (res.success && res.tags) {
        setTags(res.tags.join(', '));
        if (res.keywords) setKeywords(res.keywords);
        showToast(`Generated ${res.tags.length} high-relevance search tags!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Tag generation failed.', 'error');
    } finally {
      setIsAiLoadingTags(false);
    }
  };

  // 5. Quick AI Image Enhancer
  const handleAiEnhanceImage = async (imgUrl, index) => {
    if (!imgUrl) return;
    setIsEnhancingImage(true);
    try {
      const res = await axiosClient.post('/ai/image/enhance', { imageUrl: imgUrl });
      if (res.success && res.enhanced) {
        const updated = [...images];
        updated[index] = res.enhanced;
        setImages(updated);
        setEnhancedImages([...enhancedImages, { original: res.original, enhanced: res.enhanced }]);
        showToast('Enhanced image contrast and sharpness non-destructively!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Image enhancement failed.', 'error');
    } finally {
      setIsEnhancingImage(false);
    }
  };

  // 6. Quick AI Pricing Calculator
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
        categorySlug: selectedCat?.slug || ''
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

  // Apply suggested price
  const applyPrice = (val) => {
    setPrice(String(val));
    setShowPricingModal(false);
    showToast(`Price set to ₹${val}`, 'success');
  };

  // Add bullet feature
  const handleAddFeature = () => {
    if (newFeatureInput.trim()) {
      setFeatures([...features, newFeatureInput.trim()]);
      setNewFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!price || parseFloat(price) < 0) {
      setError('Please provide a valid price.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/products', {
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
        showToast(`'${name}' published to your catalogue!`, 'success');
        navigate('/seller/products');
      }
    } catch (err) {
      setError(err.message || 'Failed to add product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/seller/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </Link>

        {/* AI Studio Launcher shortcut */}
        <Link
          to="/seller/ai-studio"
          className="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition flex items-center gap-1.5 border border-purple-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span>Need Inspiration? Open AI Studio</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <PlusCircle className="w-7 h-7 text-brand-600" />
            <span>Add New Product to Catalogue</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Digitize your handmade craft, local merchandise, or regional produce with AI intelligence.
          </p>
        </div>

        {/* Live Catalog Completeness Meter */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catalog Completeness</p>
            <p className={`text-base font-black ${completeness >= 80 ? 'text-emerald-600' : completeness >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {completeness}% {completeness >= 80 ? '• Excellent' : completeness >= 50 ? '• Good' : '• Needs Info'}
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
        {/* Basic Details Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base">Product Essentials</h2>
            <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
          </div>

          {/* Product Title + AI Action */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Product Title (English) *
              </label>
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
              placeholder="e.g. Authentic Handwoven Bamboo Storage Basket"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none font-medium"
            />
          </div>

          {/* Hindi Title (Optional) */}
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

          {/* Category & Stock Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Category *</label>
                <button
                  type="button"
                  onClick={handleAiSuggestCategory}
                  disabled={isAiLoadingCategory}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md transition flex items-center gap-1 border border-purple-200 disabled:opacity-50"
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

          {/* Description & AI Action */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Product Narrative & Details
              </label>
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
              placeholder="Describe materials used, dimensions, craft technique, origin village, or care instructions..."
              className="w-full p-4 text-sm rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none leading-relaxed"
            />
          </div>

          {/* Hindi Description (Optional) */}
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
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Key Bullet Features (Optional)
            </label>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="e.g. 100% natural seasoned bamboo with smooth finish"
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

        {/* Pricing & Tags Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base">Pricing & Search Tags</h2>
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
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 499"
                  className="w-full pl-8 pr-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Discounted / Offer Price (₹) (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="e.g. 449"
                  className="w-full pl-8 pr-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Search Tags + AI Action */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Search Tags (Comma-separated)
              </label>
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
              placeholder="e.g. bamboo, handmade, fruit basket, eco-friendly, kitchen decor"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-medium"
            />
          </div>
        </div>

        {/* Image Upload Card + AI Enhancement */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Product Photos</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload clear photos. You can enhance any uploaded photo with AI studio clarity.
              </p>
            </div>
            {images.length > 0 && (
              <span className="text-xs font-bold text-slate-500">{images.length} / 5 photos</span>
            )}
          </div>

          <ImageUploadDropzone
            images={images}
            onImagesChange={setImages}
            maxImages={5}
          />

          {/* Quick AI Enhance buttons for uploaded photos */}
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

        {/* Submit Actions */}
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
            <span>{isSubmitting ? 'Publishing Product...' : 'Publish Product to Catalogue'}</span>
          </button>
        </div>
      </form>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Deterministic Craft Pricing Assistant</span>
              </h3>
              <button
                onClick={() => setShowPricingModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Calculate a fair selling price based on raw material, artisan labor hours, and craft category benchmarks.
            </p>

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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Packaging (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPackaging}
                    onChange={(e) => setCostPackaging(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Overhead (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={costOverhead}
                    onChange={(e) => setCostOverhead(e.target.value)}
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
                  <span>Base Direct Cost: ₹{pricingSuggestion.baseCost}</span>
                  <span>Margin: {pricingSuggestion.marginPercentage} (₹{pricingSuggestion.estimatedMargin})</span>
                </div>
                <button
                  type="button"
                  onClick={() => applyPrice(pricingSuggestion.recommendedPrice)}
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

export default AddProductPage;
