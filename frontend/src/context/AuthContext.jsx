// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      authAPI.getMe()
        .then(res => setUser(res.data.data))
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); })
        .finally(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { token, ...userData } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true, user: userData };
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const validationMessage = err.response?.data?.errors?.[0]?.message;
      return { success: false, message: validationMessage || apiMessage || err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      const { token, ...userData } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Account created successfully!');
      return { success: true, user: userData };
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const validationMessage = err.response?.data?.errors?.[0]?.message;
      const networkHint = !err.response ? 'Cannot reach backend (is it running on http://localhost:5000?)' : '';
      return { success: false, message: validationMessage || apiMessage || networkHint || err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((data) => {
    setUser(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, initialized,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
