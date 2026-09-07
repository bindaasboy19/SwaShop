import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Store, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import logoImg from '../../assets/logo.png';

const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    label: 'Platform Admin',
    email: 'admin@swashop.in',
    password: 'AdminPass@12345',
    color: 'bg-slate-900 text-amber-400 hover:bg-slate-800'
  },
  {
    role: 'SELLER A',
    label: 'Seller A (Aarav Gift Shop - Reseller)',
    email: 'aarav.gifts@example.com',
    password: 'Password@123',
    color: 'bg-amber-600 text-white hover:bg-amber-700'
  },
  {
    role: 'SELLER B',
    label: 'Seller B (Sharma Handicrafts - Artisan)',
    email: 'sharma.handicrafts@example.com',
    password: 'Password@123',
    color: 'bg-orange-600 text-white hover:bg-orange-700'
  },
  {
    role: 'CUSTOMER',
    label: 'Customer (Priya Sharma)',
    email: 'customer@example.com',
    password: 'CustomerPass@123',
    color: 'bg-emerald-700 text-white hover:bg-emerald-800'
  }
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await login(email, password);
      const role = data.user.role;

      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (role === 'SELLER') {
        navigate('/seller', { replace: true });
      } else {
        navigate('/explore', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-lg">
        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <img src={logoImg} alt="SwaShop" className="h-12 w-auto mx-auto object-contain" />
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to SwaShop
          </h2>
          <p className="text-xs text-slate-500">
            Access your marketplace account, shop dashboard, or customer favorites
          </p>
        </div>

        {/* Fast One-Click Demo Account Selector for instant evaluator login */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
            One-Click Demo Test Logins
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                className={`py-2 px-2.5 rounded-xl transition text-left text-[11px] font-bold truncate shadow-2xs ${acc.color}`}
              >
                {acc.label.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
