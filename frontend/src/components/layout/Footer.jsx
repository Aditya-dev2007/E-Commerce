// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

const Footer = () => {
  const links = {
    'Shop': [
      { to: '/products', label: 'All Products' },
      { to: '/products?featured=true', label: 'Featured' },
      { to: '/products?sort=popular', label: 'Trending' },
    ],
    'Account': [
      { to: '/login', label: 'Sign In' },
      { to: '/register', label: 'Create Account' },
      { to: '/dashboard/orders', label: 'My Orders' },
    ],
    'Help': [
      { to: '#', label: 'FAQ' },
      { to: '#', label: 'Shipping Info' },
      { to: '#', label: 'Returns' },
      { to: '#', label: 'Contact Us' },
    ],
  };

  return (
    <footer className="bg-primary text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-display font-bold text-xl mb-4">
              <span className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-sm">S</span>
              SmartStore
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-xs">
              Premium shopping experience with smart pricing, real-time tracking, and curated products.
            </p>
            <div className="flex gap-3">
              {['📘', '🐦', '📷', '▶️'].map((icon, i) => (
                <button key={i} className="w-9 h-9 bg-white/10 rounded-xl text-sm hover:bg-secondary transition-colors">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="font-semibold text-white mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-slate-400 hover:text-white text-sm transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© 2024 SmartStore. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span>🔒 Secure Payments</span>
            <span>🚚 Fast Delivery</span>
            <span>↩️ Easy Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
