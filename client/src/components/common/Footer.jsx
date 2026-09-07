import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <img src={logoImg} alt="SwaShop" className="h-12 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              AI-ready smart market linkage platform empowering local artisans, shopkeepers, MSMEs, and micro-entrepreneurs to digitize their unique products and connect with nearby customers and reseller networks.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Local Sellers
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-amber-400" />
                Hyperlocal Discovery
              </span>
            </div>
          </div>

          {/* Marketplace Discovery */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3.5 tracking-wider uppercase">Marketplace</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/explore" className="hover:text-amber-400 transition">Explore All Products</Link></li>
              <li><Link to="/explore?category=handicrafts-bamboo" className="hover:text-amber-400 transition">Handicrafts & Bamboo</Link></li>
              <li><Link to="/explore?category=handloom-textiles" className="hover:text-amber-400 transition">Handloom & Textiles</Link></li>
              <li><Link to="/explore?category=pottery-clayware" className="hover:text-amber-400 transition">Pottery & Clayware</Link></li>
              <li><Link to="/explore?category=organic-spices" className="hover:text-amber-400 transition">Organic & Spices</Link></li>
              <li><Link to="/explore?nearby=true" className="hover:text-amber-400 transition">Nearby Sellers</Link></li>
            </ul>
          </div>

          {/* For Sellers & Resellers */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3.5 tracking-wider uppercase">For Sellers</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/register?role=SELLER" className="hover:text-amber-400 transition">Register as Seller</Link></li>
              <li><Link to="/seller" className="hover:text-amber-400 transition">Seller Dashboard</Link></li>
              <li><Link to="/seller/products/new" className="hover:text-amber-400 transition">Add New Product</Link></li>
              <li><Link to="/seller/reselling" className="hover:text-amber-400 transition">Buy & Resell Hub</Link></li>
              <li><Link to="/seller/enquiries" className="hover:text-amber-400 transition">Customer Inquiries</Link></li>
            </ul>
          </div>

          {/* Quick Onboarding Banner */}
          <div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-900/60 to-slate-800 border border-brand-700/40 text-left space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-white text-sm">Digitize Your Craft</h5>
              <p className="text-xs text-slate-300 leading-snug">
                Take your local shop or artisan workshop online in minutes. Connect with nearby customers today.
              </p>
              <Link
                to="/register?role=SELLER"
                className="inline-block w-full text-center py-2 px-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SwaShop Platform. Phase 1 Production Foundation.</p>
          <div className="flex items-center gap-6">
            <span>Customer Discovery</span>
            <span>•</span>
            <span>Artisan Empowerment</span>
            <span>•</span>
            <span>Local Commerce Linkage</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
