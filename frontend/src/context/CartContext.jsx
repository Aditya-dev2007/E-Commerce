// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart]       = useState({ items: [], summary: { total: 0, total_items: 0 } });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await cartAPI.get();
      setCart(res.data.data);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = useCallback(async (product_id, quantity = 1) => {
    try {
      await cartAPI.add({ product_id, quantity });
      toast.success('Added to cart!');
      await fetchCart();
      return true;
    } catch {
      return false;
    }
  }, [fetchCart]);

  const updateItem = useCallback(async (itemId, quantity) => {
    try {
      await cartAPI.update(itemId, { quantity });
      await fetchCart();
    } catch {}
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      toast.success('Removed from cart');
      await fetchCart();
    } catch {}
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await cartAPI.clear();
      setCart({ items: [], summary: { total: 0, total_items: 0 } });
    } catch {}
  }, []);

  return (
    <CartContext.Provider value={{
      cart, loading, fetchCart,
      addToCart, updateItem, removeItem, clearCart,
      itemCount: cart.summary?.total_items || 0,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
