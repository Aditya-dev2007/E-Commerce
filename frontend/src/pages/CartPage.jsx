// src/pages/CartPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common';

const CartPage = () => {
  const { cart, updateItem, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart awaits</h2>
          <p className="text-gray-500 mb-6">Sign in to view your cart and checkout</p>
          <Link to="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  const { items = [], summary = {} } = cart;

  const handleQtyChange = async (itemId, newQty) => {
    setUpdating(itemId);
    await updateItem(itemId, newQty);
    setUpdating(null);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-7xl mb-6 animate-float">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything yet</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ShoppingBag size={18} /> Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Your Cart <span className="text-gray-400 text-xl">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          </h1>
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5">
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }}
                  className="glass-card p-5 flex gap-5">
                  <Link to={`/product/${item.product_id}`} className="shrink-0">
                    <img src={item.thumbnail} alt={item.name}
                      className="w-24 h-24 object-cover rounded-xl hover:opacity-90 transition-opacity" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-1">
                      <Link to={`/product/${item.product_id}`}
                        className="font-semibold text-gray-900 hover:text-secondary transition-colors line-clamp-2 text-sm">
                        {item.name}
                      </Link>
                      <button onClick={() => removeItem(item.id)}
                        className="shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {item.category_name && <p className="text-xs text-gray-400 mb-3">{item.category_name}</p>}
                    <div className="flex items-center justify-between">
                      {/* Qty control */}
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updating === item.id}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 text-gray-600">
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">
                          {updating === item.id ? <Spinner size="sm" /> : item.quantity}
                        </span>
                        <button onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_quantity || updating === item.id}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 text-gray-600">
                          <Plus size={14} />
                        </button>
                      </div>
                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{Number(item.subtotal).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400">₹{Number(item.unit_price).toLocaleString('en-IN')} each</p>
                      </div>
                    </div>
                    {item.stock_quantity <= 5 && item.stock_quantity > 0 && (
                      <p className="text-xs text-amber-600 font-medium mt-2">Only {item.stock_quantity} left in stock</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24 space-y-4">
              <h2 className="font-display font-bold text-xl text-gray-900">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({summary.total_items} items)</span>
                  <span className="font-medium">₹{Number(summary.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  {summary.shipping === 0
                    ? <span className="text-accent font-medium">FREE</span>
                    : <span className="font-medium">₹{summary.shipping}</span>}
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18% GST)</span>
                  <span className="font-medium">₹{Number(summary.tax).toLocaleString('en-IN')}</span>
                </div>
                {summary.shipping > 0 && (
                  <p className="text-xs text-secondary bg-indigo-50 p-2.5 rounded-lg">
                    Add ₹{(499 - summary.subtotal).toLocaleString('en-IN')} more for free shipping!
                  </p>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{Number(summary.total).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')}
                className="btn-accent w-full flex items-center justify-center gap-2">
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              <Link to="/products" className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                Continue Shopping
              </Link>

              <div className="flex items-center gap-2 text-xs text-gray-400 justify-center pt-2">
                <span>🔒</span> Secure checkout powered by SmartStore
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
