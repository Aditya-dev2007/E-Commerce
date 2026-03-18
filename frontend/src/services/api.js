// src/services/api.js - Centralised Axios instance
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach token ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: handle errors globally ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const validationMessage = error.response?.data?.errors?.[0]?.message;
    const message =
      validationMessage ||
      error.response?.data?.message ||
      (!error.response
        ? `Cannot reach backend API (${api.defaults.baseURL}). Start backend and verify VITE_API_URL.`
        : 'Something went wrong');
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Products API ────────────────────────────────────────────
export const productAPI = {
  getAll:      (params) => api.get('/products', { params }),
  getOne:      (id)     => api.get(`/products/${id}`),
  getTrending: ()       => api.get('/products/trending'),
  search:      (q, limit = 8) => api.get('/products/search', { params: { q, limit } }),
  getLowStock: ()       => api.get('/products/low-stock'),
  create:      (data)   => api.post('/products', data),
  update:      (id, data) => api.put(`/products/${id}`, data),
  delete:      (id)     => api.delete(`/products/${id}`),
};

// ─── Cart API ────────────────────────────────────────────────
export const cartAPI = {
  get:    ()           => api.get('/cart'),
  add:    (data)       => api.post('/cart/add', data),
  update: (id, data)   => api.put(`/cart/update/${id}`, data),
  remove: (id)         => api.delete(`/cart/remove/${id}`),
  clear:  ()           => api.delete('/cart/clear'),
};

// ─── Orders API ──────────────────────────────────────────────
export const orderAPI = {
  place:     (data)   => api.post('/orders/place', data),
  getAll:    (params) => api.get('/orders', { params }),
  getOne:    (id)     => api.get(`/orders/${id}`),
  adminAll:  (params) => api.get('/orders/admin/all', { params }),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

// ─── Reviews API ────────────────────────────────────────────
export const reviewAPI = {
  add:        (data) => api.post('/reviews', data),
  getProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  helpful:    (id)   => api.post(`/reviews/${id}/helpful`),
};

// ─── Wishlist API ────────────────────────────────────────────
export const wishlistAPI = {
  get:         ()           => api.get('/wishlist'),
  add:         (product_id) => api.post('/wishlist', { product_id }),
  remove:      (productId)  => api.delete(`/wishlist/${productId}`),
  moveToCart:  (product_id) => api.post('/wishlist/move-to-cart', { product_id }),
};

// ─── Categories API ─────────────────────────────────────────
export const categoryAPI = {
  getAll:  ()       => api.get('/categories'),
  create:  (data)   => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
};

// ─── Analytics API ─────────────────────────────────────────
export const analyticsAPI = {
  dashboard:   ()       => api.get('/analytics/dashboard'),
  salesTrend:  (period) => api.get('/analytics/sales-trend', { params: { period } }),
  users:       ()       => api.get('/analytics/users'),
};

export default api;
