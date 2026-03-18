// src/pages/AuthPage.jsx - Login and Register
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common';

const AuthPage = ({ mode = 'login' }) => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const result = isLogin
      ? await login(form.email, form.password)
      : await register(form);
    if (result.success) {
      navigate(result.user?.role === 'admin' ? '/admin' : '/');
    } else {
      setError(result.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl text-white">
            <span className="w-10 h-10 bg-gradient-to-br from-secondary to-purple-500 rounded-xl flex items-center justify-center text-white">S</span>
            SmartStore
          </Link>
          <p className="text-slate-400 mt-3 text-sm">
            {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account and start shopping'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-7">
            {['login', 'register'].map(m => (
              <Link key={m} to={`/${m}`}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-all capitalize
                  ${mode === m ? 'bg-secondary text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </Link>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input type="text" required placeholder="Raj Sharma"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input type="email" required placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all" />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone (optional)</label>
                <input type="tel" placeholder="9876543210"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required placeholder="Min 6 characters"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-2 py-3.5">
              {loading ? <Spinner size="sm" /> : null}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'}
              className="text-secondary font-semibold hover:text-indigo-400 transition-colors">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-5 text-center text-xs text-slate-500 space-y-1">
          <p>Demo Admin: admin@smartstore.com / Admin@123</p>
          <p>Demo User: raj@example.com / User@123</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
