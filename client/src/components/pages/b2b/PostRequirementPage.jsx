import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

const PostRequirementPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // AI Assistant raw prompt
  const [rawPrompt, setRawPrompt] = useState(searchParams.get('title') || '');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Form Fields
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'Handicrafts & Bamboo');
  const [quantity, setQuantity] = useState(100);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requiredAttributes, setRequiredAttributes] = useState('eco-friendly, handmade');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axiosClient.get('/categories');
        if (res.success) setCategories(res.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  const handleAiAssist = async () => {
    if (!rawPrompt.trim()) {
      showToast('Please type your requirement description first.', 'warning');
      return;
    }

    setIsAiProcessing(true);
    try {
      const res = await axiosClient.post('/b2b/ai-assist', { prompt: rawPrompt });
      if (res.success && res.extracted) {
        const ext = res.extracted;
        setTitle(ext.title || rawPrompt.slice(0, 50));
        setDescription(ext.description || rawPrompt);
        if (ext.category) setCategory(ext.category);
        if (ext.quantity) setQuantity(ext.quantity);
        if (ext.budgetMin) setBudgetMin(ext.budgetMin);
        if (ext.budgetMax) setBudgetMax(ext.budgetMax);
        if (ext.location?.city) setCity(ext.location.city);
        if (ext.requiredAttributes?.length > 0) {
          setRequiredAttributes(ext.requiredAttributes.join(', '));
        }
        if (ext.deadlineDays) {
          const d = new Date(Date.now() + ext.deadlineDays * 24 * 60 * 60 * 1000);
          setDeadline(d.toISOString().split('T')[0]);
        }
        showToast('Requirement structured by AI Assistant! Review before posting.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'AI extraction failed, please fill fields manually.', 'error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to post a B2B requirement.', 'warning');
      navigate('/login');
      return;
    }

    if (!title || !description || !category || !quantity) {
      showToast('Please fill in title, description, category, and required quantity.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const attrList = requiredAttributes
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      const res = await axiosClient.post('/b2b/requirements', {
        title,
        description,
        category,
        quantity: Number(quantity),
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        location: {
          city,
          state,
          country: 'India'
        },
        deadline: deadline ? new Date(deadline) : null,
        requiredAttributes: attrList,
        bulkRequired: true
      });

      if (res.success) {
        showToast('Requirement published! Finding matching sellers...', 'success');
        navigate(`/b2b/requirements/${res.requirement._id}`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to post requirement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <Link to="/b2b" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
          ← Back to B2B Hub
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
          Post a B2B Procurement Requirement
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Tell us what products, quantities, and timelines you need. Our matching engine will connect you with verified local artisans and manufacturers.
        </p>
      </div>

      {/* AI Assistant Section */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 rounded-2xl border border-indigo-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-sm">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Describe Naturally with AI Assistant (Optional)</span>
        </div>
        <p className="text-xs text-slate-600">
          Paste your raw requirement or request email (e.g. <em>"Need 500 handmade bamboo gift bags for our corporate conference in Lucknow within 20 days, budget under ₹200 per piece"</em>) and our engine will pre-fill the form:
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            placeholder="Type your bulk requirement in plain natural language..."
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={handleAiAssist}
            disabled={isAiProcessing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiProcessing ? 'Extracting...' : 'Structure with AI'}</span>
          </button>
        </div>
      </div>

      {/* Main Requirement Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Requirement Specifications
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Requirement Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 500 Eco-friendly Handmade Gift Bags for Corporate Summit"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Category *</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="Handicrafts & Bamboo">Handicrafts & Bamboo</option>
                <option value="Handloom & Textiles">Handloom & Textiles</option>
                <option value="Organic & Spices">Organic & Spices</option>
                <option value="Pottery & Clayware">Pottery & Clayware</option>
                <option value="Gifts & Home Decor">Gifts & Home Decor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Required Quantity (Units) *</label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detailed Description *</label>
            <textarea
              required
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe materials, dimensions, customization (e.g. logos/engraving), packing guidelines, and intended usage..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Min Budget (₹/unit)</label>
              <input
                type="number"
                min="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="e.g. 150"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Max Budget (₹/unit)</label>
              <input
                type="number"
                min="0"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="e.g. 250"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delivery Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delivery Destination City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lucknow"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State / Region</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Uttar Pradesh"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Required Tags & Certifications (Comma separated)
            </label>
            <input
              type="text"
              value={requiredAttributes}
              onChange={(e) => setRequiredAttributes(e.target.value)}
              placeholder="e.g. eco-friendly, handmade, natural dye, custom-logo"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            * Once submitted, SwaShop will calculate deterministic suitability scores across registered makers.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2"
          >
            <span>{isSubmitting ? 'Publishing...' : 'Find Matching Sellers'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostRequirementPage;
