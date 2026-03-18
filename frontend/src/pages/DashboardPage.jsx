// src/pages/DashboardPage.jsx - User dashboard with orders, wishlist, settings
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Heart, Settings, LogOut, User, ChevronRight, MapPin, Clock } from 'lucide-react';
import { orderAPI, wishlistAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { OrderStatusBadge, Spinner, EmptyState } from '../components/common';
import toast from 'react-hot-toast';

const NAV = [
  { id: 'overview',  label: 'Overview',  icon: <User size={18}/> },
  { id: 'orders',    label: 'My Orders', icon: <Package size={18}/> },
  { id: 'wishlist',  label: 'Wishlist',  icon: <Heart size={18}/> },
  { id: 'settings',  label: 'Settings',  icon: <Settings size={18}/> },
];

// ── Overview Tab ─────────────────────────────────────────────
const OverviewTab = ({ user }) => {
  const [recentOrders, setRecentOrders] = useState([]);
  useEffect(() => {
    orderAPI.getAll({ limit: 3 }).then(r => setRecentOrders(r.data.data));
  }, []);
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Member since {new Date(user?.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Orders', value: user?.total_orders || 0 },
            { label: 'Total Spent', value: `₹${Number(user?.total_spent || 0).toLocaleString('en-IN')}` },
            { label: 'Member Since', value: new Date(user?.created_at).getFullYear() },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-secondary">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      {recentOrders.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <Link to="/dashboard/orders" className="text-xs text-secondary font-medium">View All →</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900">{o.order_number}</p>
                  <p className="text-xs text-gray-400">{o.item_count} items · {new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={o.status} />
                  <p className="text-sm font-bold text-gray-900 mt-1">₹{Number(o.total_amount).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Orders Tab ───────────────────────────────────────────────
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    orderAPI.getAll({ limit: 20 }).then(r => setOrders(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!orders.length) return (
    <EmptyState icon="📦" title="No orders yet"
      description="Your order history will appear here once you make your first purchase"
      action={<Link to="/products" className="btn-primary">Start Shopping</Link>} />
  );

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="glass-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="font-bold text-gray-900">{order.order_number}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={11}/> {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <span className="font-bold text-gray-900">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{order.item_count} {order.item_count === 1 ? 'item' : 'items'}</p>
            <button onClick={() => setSelected(selected === order.id ? null : order.id)}
              className="text-xs text-secondary font-medium">
              {selected === order.id ? 'Hide Details' : 'View Details'} <ChevronRight size={12} className="inline" />
            </button>
          </div>
          {selected === order.id && <OrderDetail orderId={order.id} />}
        </div>
      ))}
    </div>
  );
};

const OrderDetail = ({ orderId }) => {
  const [detail, setDetail] = useState(null);
  useEffect(() => { orderAPI.getOne(orderId).then(r => setDetail(r.data.data)); }, [orderId]);
  if (!detail) return <div className="mt-4 flex justify-center"><Spinner size="sm" /></div>;
  const trackingSteps = ['placed','confirmed','packed','shipped','out_for_delivery','delivered'];
  const currentIdx = trackingSteps.indexOf(detail.status);
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-5">
      {/* Tracking */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-4">Order Tracking</p>
        <div className="relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-100" />
          <div className="space-y-3">
            {(detail.tracking || []).map((t, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs
                  ${i === detail.tracking.length - 1 ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'}`}>✓</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.message}</p>
                  {t.location && <p className="text-xs text-gray-400"><MapPin size={10} className="inline"/> {t.location}</p>}
                  <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Items */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Items</p>
        <div className="space-y-2">
          {(detail.items || []).map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <img src={item.product_thumbnail} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity} · ₹{Number(item.unit_price).toLocaleString('en-IN')} each</p>
              </div>
              <p className="text-sm font-bold">₹{Number(item.subtotal).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Wishlist Tab ─────────────────────────────────────────────
const WishlistTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => { wishlistAPI.get().then(r => setItems(r.data.data)).finally(() => setLoading(false)); }, []);

  const handleMoveToCart = async (productId) => {
    await addToCart(productId);
    setItems(items.filter(i => i.product_id !== productId));
  };

  const handleRemove = async (productId) => {
    await wishlistAPI.remove(productId);
    setItems(items.filter(i => i.product_id !== productId));
    toast.success('Removed from wishlist');
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!items.length) return (
    <EmptyState icon="💝" title="Your wishlist is empty"
      description="Save items you love and come back for them later"
      action={<Link to="/products" className="btn-primary">Discover Products</Link>} />
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(item => (
        <div key={item.id} className="glass-card p-4 flex gap-4">
          <Link to={`/product/${item.product_id}`}>
            <img src={item.thumbnail} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/product/${item.product_id}`} className="font-semibold text-sm text-gray-900 hover:text-secondary line-clamp-2">{item.name}</Link>
            <p className="font-bold text-secondary mt-1">₹{Number(item.base_price).toLocaleString('en-IN')}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleMoveToCart(item.product_id)} className="btn-primary py-1.5 px-3 text-xs">Add to Cart</button>
              <button onClick={() => handleRemove(item.product_id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Settings Tab ─────────────────────────────────────────────
const SettingsTab = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await authAPI.updateProfile(form); updateUser(form); toast.success('Profile updated!');
    } catch {} finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleProfile} className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Profile Information</h3>
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input value={user?.email} disabled className="input-field bg-gray-50 cursor-not-allowed" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" /></div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Spinner size="sm" /> : null} Save Changes
        </button>
      </form>
      <form onSubmit={handlePassword} className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-gray-900">Change Password</h3>
        {['currentPassword','newPassword','confirmPassword'].map(field => (
          <div key={field}><label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
            {field.replace(/([A-Z])/g, ' $1')}
          </label>
            <input type="password" value={pwForm[field]}
              onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))} className="input-field" />
          </div>
        ))}
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Spinner size="sm" /> : null} Update Password
        </button>
      </form>
    </div>
  );
};

// ── Main Dashboard ───────────────────────────────────────────
const DashboardPage = () => {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    authAPI.getMe().then(r => setUserData(r.data.data));
  }, []);

  const TABS = {
    overview: <OverviewTab user={userData || user} />,
    orders:   <OrdersTab />,
    wishlist: <WishlistTab />,
    settings: <SettingsTab />,
  };

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="glass-card p-4 space-y-1 sticky top-24">
              {NAV.map(item => (
                <button key={item.id}
                  onClick={() => navigate(`/dashboard/${item.id === 'overview' ? '' : item.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    ${tab === item.id || (tab === '' && item.id === 'overview')
                      ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-indigo-50 hover:text-secondary'}`}>
                  {item.icon} {item.label}
                </button>
              ))}
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-2">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {TABS[tab] || TABS['overview']}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
