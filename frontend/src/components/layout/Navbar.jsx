// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, User, Search, Menu, X, LogOut, Settings, Package, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { productAPI } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [userMenu, setUserMenu]       = useState(false);
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const searchRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setSearching(true);
      productAPI.search(debouncedQuery)
        .then(res => setResults(res.data.data || []))
        .finally(() => setSearching(false));
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  // Close user menu on outside click
  useEffect(() => {
    const handle = (e) => {
      if (userMenu && !e.target.closest('#user-menu-btn')) setUserMenu(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [userMenu]);

  const navLinks = [
    { to: '/products', label: 'Shop' },
    { to: '/products?featured=true', label: 'Featured' },
    { to: '/products?sort=popular', label: 'Trending' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-xl shadow-md' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-gray-900">
            <span className="w-8 h-8 bg-gradient-to-br from-secondary to-purple-500 rounded-lg flex items-center justify-center text-white text-sm">S</span>
            SmartStore
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-secondary font-medium text-sm transition-colors"
              >{link.label}</Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Search */}
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => setSearchOpen(o => !o)}
                className="p-2 text-gray-600 hover:text-secondary hover:bg-indigo-50 rounded-xl transition-colors"
              >
                <Search size={20} />
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 glass-card p-3 z-50"
                  >
                    <input
                      autoFocus
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search products..."
                      className="input-field text-sm"
                    />
                    {(results.length > 0 || searching) && (
                      <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
                        {searching ? (
                          <p className="text-center text-sm text-gray-400 py-3">Searching…</p>
                        ) : results.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { navigate(`/product/${p.id}`); setSearchOpen(false); setQuery(''); }}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 transition-colors text-left"
                          >
                            <img src={p.thumbnail} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</p>
                              <p className="text-xs text-secondary font-semibold">₹{Number(p.base_price).toLocaleString('en-IN')}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/dashboard/wishlist" className="p-2 text-gray-600 hover:text-secondary hover:bg-indigo-50 rounded-xl transition-colors">
                <Heart size={20} />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-secondary hover:bg-indigo-50 rounded-xl transition-colors">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-secondary text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenu(o => !o)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-secondary to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="absolute right-0 top-12 w-52 glass-card py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      {[
                        { to: '/dashboard', icon: <User size={16}/>, label: 'Dashboard' },
                        { to: '/dashboard/orders', icon: <Package size={16}/>, label: 'My Orders' },
                        { to: '/dashboard/settings', icon: <Settings size={16}/>, label: 'Settings' },
                        ...(isAdmin ? [{ to: '/admin', icon: <LayoutDashboard size={16}/>, label: 'Admin Panel' }] : []),
                      ].map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-secondary transition-colors"
                          onClick={() => setUserMenu(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-5 text-sm">Sign In</Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-secondary"
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-white rounded-b-2xl shadow-lg"
            >
              <div className="py-4 px-4 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block py-2.5 px-4 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-secondary font-medium transition-colors"
                  >{link.label}</Link>
                ))}
                {!isAuthenticated && (
                  <div className="pt-2">
                    <Link to="/login" className="btn-primary w-full text-center block">Sign In</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;
