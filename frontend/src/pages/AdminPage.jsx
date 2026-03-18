// src/pages/AdminPage.jsx - Full admin dashboard
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingBag, Users, TrendingUp, AlertTriangle, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { analyticsAPI, productAPI, orderAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { OrderStatusBadge, Spinner, Badge } from '../components/common';
import toast from 'react-hot-toast';

// ── Stat Card ────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
  </motion.div>
);

// ── Overview Tab ─────────────────────────────────────────────
const OverviewTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.dashboard().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Today's Revenue" value={`₹${Number(data.revenue.today_revenue).toLocaleString('en-IN')}`}
          icon={<TrendingUp className="text-secondary" size={20}/>} color="bg-indigo-50"
          sub={`₹${Number(data.revenue.month_revenue).toLocaleString('en-IN')} this month`} />
        <StatCard label="Total Orders" value={data.revenue.total_orders}
          icon={<ShoppingBag className="text-accent" size={20}/>} color="bg-green-50"
          sub={`${data.revenue.today_orders} today`} />
        <StatCard label="Total Users" value={data.users.total_users}
          icon={<Users className="text-blue-500" size={20}/>} color="bg-blue-50"
          sub={`${data.users.new_this_month} new this month`} />
        <StatCard label="Low Stock Items" value={data.products.low_stock}
          icon={<AlertTriangle className="text-amber-500" size={20}/>} color="bg-amber-50"
          sub={`${data.products.out_of_stock} out of stock`} />
      </div>

      {/* Monthly revenue chart (simple table) */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue (Last 12 Months)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Month</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">Revenue</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">Orders</th>
            </tr></thead>
            <tbody>
              {data.monthly_revenue.map(row => (
                <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-800">{row.label}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-secondary">₹{Number(row.revenue).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{row.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top products + categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Top Selling Products (30 days)</h3>
          <div className="space-y-3">
            {data.top_products.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-gray-400 text-sm font-bold w-5">#{i+1}</span>
                <img src={p.thumbnail} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.total_sold} units sold</p>
                </div>
                <span className="text-sm font-bold text-secondary">₹{Number(p.total_revenue).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {data.category_breakdown.map(c => (
              <div key={c.category} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{c.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{c.products} products</span>
                  <span className="text-sm font-semibold text-gray-900">₹{Number(c.revenue).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Products Admin Tab ───────────────────────────────────────
const ProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productAPI.getAll({ limit: 50 }),
      productAPI.getLowStock(),
    ]).then(([pRes, lRes]) => {
      setProducts(pRes.data.data);
      setLowStock(lRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await productAPI.delete(id);
    setProducts(p => p.filter(prod => prod.id !== id));
    toast.success('Product deleted');
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {lowStock.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-500" size={18} />
            <h3 className="font-bold text-amber-700">Low Stock Alert ({lowStock.length} items)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="badge bg-amber-100 text-amber-700">
                {p.name} — {p.stock_quantity} left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">All Products</h3>
          <button className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
            <Plus size={15} /> Add Product
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Product</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Price</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Stock</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={p.thumbnail} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                      <span className="font-medium text-gray-900 line-clamp-1 max-w-[180px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{p.category_name || '—'}</td>
                  <td className="py-3 px-4 text-right font-semibold">₹{Number(p.base_price).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-semibold ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity <= 5 ? 'text-amber-500' : 'text-gray-700'}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={p.is_active ? 'success' : 'danger'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-secondary hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Orders Admin Tab ─────────────────────────────────────────
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.adminAll({ limit: 50 }).then(r => setOrders(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleStatus = async (orderId, status) => {
    await orderAPI.updateStatus(orderId, { status });
    setOrders(o => o.map(ord => ord.id === orderId ? { ...ord, status } : ord));
    toast.success('Order status updated');
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">All Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left py-3 px-4 text-gray-500 font-medium">Order</th>
            <th className="text-left py-3 px-4 text-gray-500 font-medium">Customer</th>
            <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
            <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
            <th className="text-center py-3 px-4 text-gray-500 font-medium">Action</th>
          </tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{o.order_number}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-gray-800">{o.user_name}</p>
                  <p className="text-xs text-gray-400">{o.user_email}</p>
                </td>
                <td className="py-3 px-4 text-right font-semibold">₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                <td className="py-3 px-4 text-center"><OrderStatusBadge status={o.status} /></td>
                <td className="py-3 px-4 text-center">
                  <select
                    value={o.status}
                    onChange={e => handleStatus(o.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-secondary"
                  >
                    {['placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main Admin Page ──────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',  icon: <LayoutDashboard size={17}/> },
  { id: 'products',  label: 'Products',  icon: <Package size={17}/> },
  { id: 'orders',    label: 'Orders',    icon: <ShoppingBag size={17}/> },
];

const AdminPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAdmin) { navigate('/'); return null; }

  const CONTENT = { overview: <OverviewTab />, products: <ProductsTab />, orders: <OrdersTab /> };

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Badge variant="primary">Admin</Badge>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {CONTENT[activeTab]}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
