// src/pages/CheckoutPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { orderAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { Spinner } from '../components/common';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cod',   label: 'Cash on Delivery', icon: '💵' },
  { value: 'upi',   label: 'UPI',               icon: '📱' },
  { value: 'card',  label: 'Credit/Debit Card', icon: '💳' },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderNum, setOrderNum] = useState('');

  const [address, setAddress] = useState({
    name: '', street: '', city: '', state: '', pincode: '', phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const { items = [], summary = {} } = cart;

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const required = ['name', 'street', 'city', 'state', 'pincode', 'phone'];
    for (const field of required) {
      if (!address[field].trim()) { toast.error(`Please enter ${field}`); return; }
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const res = await orderAPI.place({ shipping_address: address, payment_method: paymentMethod });
      setOrderId(res.data.data.order_id);
      setOrderNum(res.data.data.order_number);
      await clearCart();
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && step !== 3) {
    navigate('/cart');
    return null;
  }

  // Step indicators
  const steps = ['Address', 'Payment', 'Confirm'];

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Stepper */}
        {step < 3 && (
          <div className="flex items-center justify-center mb-10">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center gap-2 ${i + 1 < step ? 'text-accent' : i + 1 === step ? 'text-secondary' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                    ${i + 1 < step ? 'bg-accent border-accent text-white' : i + 1 === step ? 'border-secondary text-secondary' : 'border-gray-200 text-gray-300'}`}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-3 ${i + 1 < step ? 'bg-accent' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* ── Step 1: Address ─────────────────────────── */}
            {step === 1 && (
              <motion.form onSubmit={handleAddressSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="text-secondary" size={22} />
                  <h2 className="font-display text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>
                {[
                  { key: 'name',    label: 'Full Name',       type: 'text',   placeholder: 'Raj Sharma' },
                  { key: 'phone',   label: 'Phone Number',    type: 'tel',    placeholder: '9876543210' },
                  { key: 'street',  label: 'Street Address',  type: 'text',   placeholder: '123 MG Road, Apartment 4B' },
                  { key: 'city',    label: 'City',            type: 'text',   placeholder: 'Mumbai' },
                  { key: 'state',   label: 'State',           type: 'text',   placeholder: 'Maharashtra' },
                  { key: 'pincode', label: 'PIN Code',        type: 'text',   placeholder: '400001' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder} required
                      value={address[field.key]}
                      onChange={e => setAddress(a => ({ ...a, [field.key]: e.target.value }))}
                      className="input-field" />
                  </div>
                ))}
                <button type="submit" className="btn-primary w-full mt-4">Continue to Payment →</button>
              </motion.form>
            )}

            {/* ── Step 2: Payment ─────────────────────────── */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="text-secondary" size={22} />
                    <h2 className="font-display text-xl font-bold text-gray-900">Payment Method</h2>
                  </div>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                          ${paymentMethod === m.value ? 'border-secondary bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-2xl">{m.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${paymentMethod === m.value ? 'border-secondary' : 'border-gray-300'}`}>
                          {paymentMethod === m.value && <div className="w-3 h-3 rounded-full bg-secondary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address review */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Delivering to</h3>
                    <button onClick={() => setStep(1)} className="text-xs text-secondary font-medium">Edit</button>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{address.name}</p>
                  <p className="text-sm text-gray-500">{address.street}, {address.city}, {address.state} - {address.pincode}</p>
                  <p className="text-sm text-gray-500">📞 {address.phone}</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                  <button onClick={handlePlaceOrder} disabled={placing} className="btn-accent flex-1 flex items-center justify-center gap-2">
                    {placing ? <><Spinner size="sm" /> Placing...</> : 'Place Order 🎉'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Success ─────────────────────────── */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                  <CheckCircle size={72} className="text-accent mx-auto mb-6" />
                </motion.div>
                <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">Order Placed! 🎉</h2>
                <p className="text-gray-500 mb-2">Your order has been placed successfully.</p>
                <p className="text-secondary font-bold text-lg mb-8">#{orderNum}</p>
                <p className="text-sm text-gray-500 mb-8">
                  We'll send you updates as your order progresses. Estimated delivery: 3-5 business days.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => navigate(`/dashboard/orders`)} className="btn-primary">Track Order</button>
                  <button onClick={() => navigate('/products')} className="btn-secondary">Continue Shopping</button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary sidebar (steps 1 & 2) */}
          {step < 3 && (
            <div className="glass-card p-6 h-fit sticky top-24 space-y-4">
              <h3 className="font-display font-bold text-lg text-gray-900">Order Summary</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img src={item.thumbnail} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">₹{Number(item.subtotal).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>₹{Number(summary.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={summary.shipping === 0 ? 'text-accent' : ''}>
                    {summary.shipping === 0 ? 'FREE' : `₹${summary.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span><span>₹{Number(summary.tax).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>Total</span><span>₹{Number(summary.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
