import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Mic,
  MicOff,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Sliders,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Globe,
  Upload,
  Info
} from 'lucide-react';
import axiosClient from '../../../api/axiosClient.js';
import { useToast } from '../../../context/ToastContext.jsx';

const SellerAIStudioPage = () => {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'voice', 'image', 'pricing'
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Categories list
  const [categories, setCategories] = useState([]);

  // --- Catalog Generator State ---
  const [catalogInput, setCatalogInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('both'); // 'en', 'hi', 'both'
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [generatedCatalog, setGeneratedCatalog] = useState(null);
  const [catalogProvider, setCatalogProvider] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // --- Voice-to-Catalog State ---
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLang, setVoiceLang] = useState('hi-IN'); // 'hi-IN' or 'en-IN'
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  // --- Image Studio State ---
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [enhancedImageUrl, setEnhancedImageUrl] = useState('');
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);
  const [sampleImages, setSampleImages] = useState([
    'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80'
  ]);

  // --- Pricing Assistant State ---
  const [materialCost, setMaterialCost] = useState(250);
  const [laborHours, setLaborHours] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(100);
  const [packagingCost, setPackagingCost] = useState(30);
  const [overheadCost, setOverheadCost] = useState(20);
  const [pricingCategory, setPricingCategory] = useState('handicrafts-bamboo');
  const [pricingResult, setPricingResult] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axiosClient.get('/categories');
        if (res.success) {
          setCategories(res.categories);
          if (res.categories.length > 0) {
            setSelectedCategoryId(res.categories[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setVoiceTranscript(currentTranscript.trim());
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [voiceLang]);

  // Toggle voice recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showToast('Speech recognition is not supported in this browser. You can type or paste your rough notes.', 'warning');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      showToast('Recording stopped. You can now edit and generate your catalog.', 'info');
    } else {
      setVoiceTranscript('');
      recognitionRef.current.lang = voiceLang;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        showToast(`Listening in ${voiceLang === 'hi-IN' ? 'Hindi (हिंदी)' : 'English'}... Speak clearly.`, 'info');
      } catch (err) {
        console.error('Recording start error:', err);
      }
    }
  };

  // Generate Catalog from Text
  const handleGenerateCatalog = async (inputText = catalogInput) => {
    if (!inputText || inputText.trim().length < 3) {
      showToast('Please provide at least a few words describing your item.', 'error');
      return;
    }

    setIsGeneratingCatalog(true);
    try {
      const res = await axiosClient.post('/ai/catalog', {
        text: inputText.trim(),
        language: selectedLanguage,
        categoryId: selectedCategoryId
      });

      if (res.success && res.catalog) {
        setGeneratedCatalog(res.catalog);
        setCatalogProvider(res.provider || 'gemini');
        showToast('Product catalog generated successfully!', 'success');
      } else {
        showToast(res.message || 'Catalog generation completed with fallback.', 'warning');
      }
    } catch (err) {
      showToast(err.message || 'Catalog generation failed. Using local fallback.', 'error');
    } finally {
      setIsGeneratingCatalog(false);
    }
  };

  // Convert Voice Transcript to Catalog
  const handleVoiceToCatalog = () => {
    if (!voiceTranscript.trim()) {
      showToast('Please record or type a voice transcript first.', 'error');
      return;
    }
    setCatalogInput(voiceTranscript);
    setActiveTab('catalog');
    handleGenerateCatalog(voiceTranscript);
  };

  // Calculate Completeness Score
  const calculateCompleteness = (item) => {
    if (!item) return 0;
    let score = 0;
    if (item.title && item.title.length >= 3) score += 20;
    if (item.description && item.description.length >= 30) score += 20;
    if (item.categoryId || item.categoryName) score += 20;
    if (item.tags && item.tags.length >= 3) score += 20;
    if (item.features && item.features.length >= 2) score += 20;
    return Math.min(score, 100);
  };

  // Copy helper
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Send Generated Catalog to Add Product Page
  const handleExportToNewProduct = () => {
    if (!generatedCatalog) return;
    navigate('/seller/products/new', {
      state: {
        prefill: {
          name: generatedCatalog.title,
          description: generatedCatalog.description,
          categoryId: generatedCatalog.categoryId,
          tags: generatedCatalog.tags ? generatedCatalog.tags.join(', ') : '',
          features: generatedCatalog.features || [],
          attributes: generatedCatalog.attributes || {},
          keywords: generatedCatalog.keywords || [],
          multilingual: {
            title: { en: generatedCatalog.title, hi: generatedCatalog.titleHi || '' },
            description: { en: generatedCatalog.description, hi: generatedCatalog.descriptionHi || '' }
          }
        }
      }
    });
  };

  // Enhance Image Handler
  const handleEnhanceImage = async (url) => {
    const targetUrl = url || originalImageUrl;
    if (!targetUrl) {
      showToast('Please provide an image URL to enhance.', 'error');
      return;
    }

    setIsEnhancingImage(true);
    try {
      const res = await axiosClient.post('/ai/image/enhance', { imageUrl: targetUrl });
      if (res.success) {
        setOriginalImageUrl(res.original);
        setEnhancedImageUrl(res.enhanced);
        showToast('Image enhanced with auto-contrast & studio sharpness!', 'success');
      } else {
        showToast(res.message || 'Image enhancement completed.', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Enhancement failed.', 'error');
    } finally {
      setIsEnhancingImage(false);
    }
  };

  // Pricing Calculation Handler
  const handleCalculatePrice = async () => {
    setIsCalculatingPrice(true);
    try {
      const res = await axiosClient.post('/ai/price/suggest', {
        costData: {
          materialCost: parseFloat(materialCost) || 0,
          laborHours: parseFloat(laborHours) || 0,
          hourlyRate: parseFloat(hourlyRate) || 0,
          packagingCost: parseFloat(packagingCost) || 0,
          overheadCost: parseFloat(overheadCost) || 0
        },
        categorySlug: pricingCategory
      });

      if (res.success) {
        setPricingResult(res);
        showToast('Fair craft pricing recommendation calculated!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Pricing calculation failed.', 'error');
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  // Auto calculate pricing on first render of tab
  useEffect(() => {
    if (activeTab === 'pricing' && !pricingResult) {
      handleCalculatePrice();
    }
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 p-6 sm:p-10 text-white shadow-2xl border border-purple-800/40">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-purple-400/30 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              SwaShop Seller Intelligence Suite
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" />
              Human-in-the-Loop Verified
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Artisan & Seller AI Studio
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
            Harness multilingual intelligence, voice cataloging, studio image enhancement, and deterministic cost-plus pricing. You always retain final control before publishing.
          </p>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-purple-200">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <span>English & Hindi Bilingual</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <Mic className="w-3.5 h-3.5 text-rose-300" />
              <span>Native Voice-to-Text</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
              <span>Deterministic Cost Plus Craft Markup</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition shrink-0 ${
            activeTab === 'catalog'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Multilingual Catalog Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition shrink-0 ${
            activeTab === 'voice'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice-to-Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition shrink-0 ${
            activeTab === 'image'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>AI Image Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition shrink-0 ${
            activeTab === 'pricing'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pricing Assistant</span>
        </button>
      </div>

      {/* WORKSPACE 1: MULTILINGUAL CATALOG GENERATOR */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Input Form */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Product Notes & Story</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Input rough bullet points</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter any unstructured details: materials, purpose, village/artisan tradition, dimensions, or rough thoughts. SwaShop AI will structure a full catalog with titles, features, attributes, and tags.
            </p>

            {/* Language Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Output Language Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'both', label: 'Bilingual (En + Hi)' },
                  { id: 'en', label: 'English Only' },
                  { id: 'hi', label: 'Hindi (हिंदी)' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      selectedLanguage === lang.id
                        ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Category Preference (Optional)
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 outline-none bg-white font-medium focus:border-purple-500"
              >
                <option value="">-- Let AI Recommend Category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Rough Notes / Key Highlights *
              </label>
              <textarea
                rows="6"
                value={catalogInput}
                onChange={(e) => setCatalogInput(e.target.value)}
                placeholder="e.g. Authentic hand-carved sheesham wood incense burner holder with brass inlay jaali work, crafted by Saharanpur artisans, size 10 inch length, brown polished finish, holds 2 dhoop sticks and 2 agarbattis..."
                className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none leading-relaxed"
              />
            </div>

            {/* Sample Prompts */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Sample Inputs:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Handwoven tussar silk saree with tribal border Bhagalpur',
                  'Terracotta kulhad tea cup set of 6 Varanasi clay',
                  'Wild raw Himalayan forest honey 500g unpasteurized'
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCatalogInput(sample)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition truncate max-w-full text-left"
                  >
                    "{sample.substring(0, 35)}..."
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleGenerateCatalog()}
              disabled={isGeneratingCatalog || !catalogInput.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingCatalog ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Structuring Intelligent Catalog...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Full Product Catalog</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Output Review & Edit Deck */}
          <div className="lg:col-span-7 space-y-6">
            {generatedCatalog ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                {/* Header & Quality Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] uppercase tracking-wider">
                      Generated via {catalogProvider === 'gemini' ? 'Gemini 2.5 Flash' : 'SwaShop Local Intelligence'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">Review & Edit Generated Catalog</h3>
                    <p className="text-xs text-slate-500">Edit any field directly before sending to your shop catalogue.</p>
                  </div>

                  {/* Completeness Bar */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Quality Score</p>
                      <p className="text-sm font-extrabold text-emerald-600">{calculateCompleteness(generatedCatalog)}%</p>
                    </div>
                    <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calculateCompleteness(generatedCatalog)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Title (English) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Marketplace Title (English)</label>
                    <button
                      onClick={() => copyToClipboard(generatedCatalog.title, 'Title')}
                      className="text-[11px] font-medium text-slate-400 hover:text-purple-600 flex items-center gap-1"
                    >
                      {copiedField === 'Title' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={generatedCatalog.title || ''}
                    onChange={(e) => setGeneratedCatalog({ ...generatedCatalog, title: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-bold text-slate-900"
                  />
                </div>

                {/* Title (Hindi) */}
                {generatedCatalog.titleHi && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">उत्पाद शीर्षक (हिंदी)</label>
                      <button
                        onClick={() => copyToClipboard(generatedCatalog.titleHi, 'Hindi Title')}
                        className="text-[11px] font-medium text-slate-400 hover:text-purple-600 flex items-center gap-1"
                      >
                        {copiedField === 'Hindi Title' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={generatedCatalog.titleHi || ''}
                      onChange={(e) => setGeneratedCatalog({ ...generatedCatalog, titleHi: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-bold text-slate-900"
                    />
                  </div>
                )}

                {/* Category Recommendation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">Recommended Category</label>
                    <div className="px-4 py-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs font-semibold text-purple-900 flex items-center justify-between">
                      <span>{generatedCatalog.categoryName || 'Handicrafts & Decor'}</span>
                      <span className="text-[10px] uppercase font-bold text-purple-600">Grounded Match</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">Assigned ID</label>
                    <input
                      type="text"
                      readOnly
                      value={generatedCatalog.categoryId || 'Auto-linked'}
                      className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-mono"
                    />
                  </div>
                </div>

                {/* Description (English) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Artisan Narrative & Description (English)</label>
                    <button
                      onClick={() => copyToClipboard(generatedCatalog.description, 'Description')}
                      className="text-[11px] font-medium text-slate-400 hover:text-purple-600 flex items-center gap-1"
                    >
                      {copiedField === 'Description' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <textarea
                    rows="4"
                    value={generatedCatalog.description || ''}
                    onChange={(e) => setGeneratedCatalog({ ...generatedCatalog, description: e.target.value })}
                    className="w-full p-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none leading-relaxed"
                  />
                </div>

                {/* Description (Hindi) */}
                {generatedCatalog.descriptionHi && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">उत्पाद विवरण (हिंदी)</label>
                      <button
                        onClick={() => copyToClipboard(generatedCatalog.descriptionHi, 'Hindi Description')}
                        className="text-[11px] font-medium text-slate-400 hover:text-purple-600 flex items-center gap-1"
                      >
                        {copiedField === 'Hindi Description' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <textarea
                      rows="4"
                      value={generatedCatalog.descriptionHi || ''}
                      onChange={(e) => setGeneratedCatalog({ ...generatedCatalog, descriptionHi: e.target.value })}
                      className="w-full p-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-purple-500 outline-none leading-relaxed"
                    />
                  </div>
                )}

                {/* Key Bullet Features */}
                {generatedCatalog.features && generatedCatalog.features.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Key Bullet Features</label>
                    <div className="space-y-1.5">
                      {generatedCatalog.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => {
                              const updated = [...generatedCatalog.features];
                              updated[idx] = e.target.value;
                              setGeneratedCatalog({ ...generatedCatalog, features: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-purple-500 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Attributes */}
                {generatedCatalog.attributes && Object.keys(generatedCatalog.attributes).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">Extracted Attributes</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {Object.entries(generatedCatalog.attributes).map(([k, v]) => (
                        <div key={k} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                          <p className="font-bold text-slate-500 uppercase text-[10px]">{k}</p>
                          <p className="font-semibold text-slate-800 truncate">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">AI Search Tags & Keywords</label>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedCatalog.tags &&
                      generatedCatalog.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <button
                    onClick={() => {
                      setGeneratedCatalog(null);
                      setCatalogInput('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                  >
                    Clear & Start Over
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportToNewProduct}
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
                    >
                      <span>Send to Add Product Form</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-base font-bold text-slate-800">Your AI Catalog Will Appear Here</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Type a few rough notes on the left or click one of the quick samples, then click "Generate Full Product Catalog".
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WORKSPACE 2: VOICE-TO-CATALOG */}
      {activeTab === 'voice' && (
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Direct Speech Recognition
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Voice-to-Catalog Generator
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Don't want to type? Speak naturally in Hindi or English. Tell the story of your handmade item, materials used, size, and price. SwaShop translates and structures it instantly.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setVoiceLang('hi-IN')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                voiceLang === 'hi-IN'
                  ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🇮🇳 Hindi (हिंदी)</span>
            </button>
            <button
              onClick={() => setVoiceLang('en-IN')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                voiceLang === 'en-IN'
                  ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🌐 Indian English</span>
            </button>
          </div>

          {/* Microphone Central Button */}
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-25" />
              )}
              <button
                onClick={toggleRecording}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 ring-8 ring-rose-200'
                    : 'bg-brand-600 hover:bg-brand-700 hover:ring-8 hover:ring-brand-100'
                }`}
              >
                {isRecording ? <MicOff className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
              </button>
            </div>

            <p className="text-xs font-bold text-slate-600 tracking-wide uppercase">
              {isRecording ? '🔴 Listening... Click to stop when finished' : 'Click microphone to begin speaking'}
            </p>
          </div>

          {/* Real-time transcript box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Spoken Transcript (Review & Edit)
              </label>
              <button
                onClick={() => setVoiceTranscript('')}
                className="text-xs text-slate-400 hover:text-slate-700 font-medium"
              >
                Clear
              </button>
            </div>
            <textarea
              rows="5"
              value={voiceTranscript}
              onChange={(e) => setVoiceTranscript(e.target.value)}
              placeholder="Your spoken words will appear here in real-time... Or click sample prompts below."
              className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none leading-relaxed"
            />
          </div>

          {/* Quick Voice Simulation Buttons for Demo/Testing */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Test Sample Voice Transcripts:</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setVoiceTranscript(
                    'यह हमारा हाथ से बना हुआ बांस का टोकरी है। बहुत मजबूत है, फल और सब्जी रखने के लिए बहुत अच्छा है। यह प्राकृतिक बांस से बना है।'
                  )
                }
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 font-medium"
              >
                🇮🇳 "हाथ से बना बांस का टोकरी..." (Hindi)
              </button>
              <button
                type="button"
                onClick={() =>
                  setVoiceTranscript(
                    'Authentic hand-carved sheesham wooden temple for home pooja with intricate jharokha dome and brass handles.'
                  )
                }
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 font-medium"
              >
                🌐 "Hand-carved wooden temple..." (English)
              </button>
            </div>
          </div>

          {/* Convert to Catalog Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleVoiceToCatalog}
              disabled={!voiceTranscript.trim()}
              className="px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Convert Voice to Full Product Catalog →</span>
            </button>
          </div>
        </div>
      )}

      {/* WORKSPACE 3: AI IMAGE STUDIO */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Input & Enhancer Controls */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Non-Destructive Enhancement
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">Product Photo Studio</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Enhances contrast, dynamic lighting, color depth, and sharpness while preserving your original raw photo intact.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Image URL to Enhance
              </label>
              <input
                type="url"
                value={originalImageUrl}
                onChange={(e) => setOriginalImageUrl(e.target.value)}
                placeholder="https://... image url"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Pick from Sample Images */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Or Pick a Demo Artisan Photo:</p>
              <div className="grid grid-cols-3 gap-2">
                {sampleImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Sample ${i}`}
                    onClick={() => setOriginalImageUrl(src)}
                    className={`h-20 w-full object-cover rounded-xl cursor-pointer border-2 transition ${
                      originalImageUrl === src ? 'border-blue-600 ring-2 ring-blue-100 scale-102' : 'border-transparent hover:opacity-90'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => handleEnhanceImage()}
              disabled={isEnhancingImage || !originalImageUrl}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isEnhancingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enhancing Studio Contrast & Clarity...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Enhance Photo Now</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Side-by-Side Comparison */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Before & After Comparison
            </h3>

            {originalImageUrl ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Original Photo</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">Raw Source</span>
                  </div>
                  <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={originalImageUrl} alt="Original" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Enhanced */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600 uppercase text-[10px]">AI Enhanced Photo</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">Studio Ready</span>
                  </div>
                  <div className="h-64 rounded-2xl overflow-hidden border-2 border-blue-500 bg-slate-100 relative">
                    <img
                      src={enhancedImageUrl || originalImageUrl}
                      alt="Enhanced"
                      className="w-full h-full object-cover filter contrast-105 brightness-102"
                    />
                    {!enhancedImageUrl && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 text-center">
                        <span className="text-xs text-white font-semibold">Click "Enhance Photo Now" to preview transformations</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                <ImageIcon className="w-8 h-8" />
                <span>Select or paste an image URL to preview before/after</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WORKSPACE 4: PRICING ASSISTANT */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Direct Production Cost Input */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Deterministic Cost Plus Craft Markup
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">Artisan Cost Calculator</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Enter your genuine costs. SwaShop calculates the exact floor cost and recommends fair retail pricing that respects your labor.
              </p>
            </div>

            {/* Raw Material Cost */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Raw Materials Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-bold focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Labor Hours and Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Labor Time (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                  className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Hourly Rate (₹/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-bold focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Packaging and Overhead */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Packaging (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                  className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Overheads / Transport (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={overheadCost}
                  onChange={(e) => setOverheadCost(e.target.value)}
                  className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-bold focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Craft Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Craft Market Sector
              </label>
              <select
                value={pricingCategory}
                onChange={(e) => setPricingCategory(e.target.value)}
                className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 outline-none bg-white font-medium focus:border-emerald-500"
              >
                <option value="handicrafts-bamboo">Handicrafts & Cane/Bamboo (35-50% Craft Margin)</option>
                <option value="handloom-textiles">Handloom & Khadi Apparel (25-45% Margin)</option>
                <option value="pottery-clayware">Pottery & Terracotta (35-55% Margin)</option>
                <option value="organic-spices">Organic Spices & Staples (20-35% Margin)</option>
              </select>
            </div>

            <button
              onClick={handleCalculatePrice}
              disabled={isCalculatingPrice}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {isCalculatingPrice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              <span>Calculate Fair Price</span>
            </button>
          </div>

          {/* Right: Recommendation Breakdown */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Pricing Recommendation Breakdown
            </h3>

            {pricingResult ? (
              <div className="space-y-6">
                {/* Highlight Recommended Price Card */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 p-6 rounded-3xl border border-emerald-200 text-center space-y-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    AI Recommended Selling Price
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-emerald-900 tracking-tight">
                    ₹{pricingResult.recommendedPrice}
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">
                    Includes charm pricing for higher customer conversion
                  </p>
                </div>

                {/* Suggested Range & Floor Cost */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Base Direct Cost</p>
                    <p className="text-lg font-extrabold text-slate-800 mt-1">₹{pricingResult.baseCost}</p>
                    <p className="text-[10px] text-slate-400">Zero-profit floor</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Suggested Min</p>
                    <p className="text-lg font-extrabold text-slate-800 mt-1">₹{pricingResult.suggestedRange?.min}</p>
                    <p className="text-[10px] text-slate-400">Competitive floor</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Suggested Max</p>
                    <p className="text-lg font-extrabold text-slate-800 mt-1">₹{pricingResult.suggestedRange?.max}</p>
                    <p className="text-[10px] text-slate-400">Premium ceiling</p>
                  </div>
                </div>

                {/* Profit Margin Indicator */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-950">Estimated Artisan Profit</p>
                    <p className="text-xs text-emerald-700">Net margin per single unit sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-emerald-800">₹{pricingResult.estimatedMargin}</p>
                    <p className="text-xs font-bold text-emerald-600">({pricingResult.marginPercentage} margin)</p>
                  </div>
                </div>

                {/* Legal Advisory Disclaimer */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    <span className="font-bold">Advisory Disclaimer: </span>
                    {pricingResult.disclaimer ||
                      'This is an advisory pricing estimate based on direct production inputs and regional craft benchmarks. You maintain 100% discretion to adjust your final catalog price.'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerAIStudioPage;
