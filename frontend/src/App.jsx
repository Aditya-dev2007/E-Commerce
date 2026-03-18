// src/App.jsx - Root application with routing
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, initialized } = useAuth();
  if (!initialized) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-500" />
  </div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

// Layout wrapper (Navbar + Footer)
const Layout = ({ children, noFooter = false }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">{children}</main>
    {!noFooter && <Footer />}
  </div>
);

const AppRoutes = () => (
  <AnimatePresence mode="wait">
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
      <Route path="/product/:id" element={<Layout><ProductDetailPage /></Layout>} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* Auth required */}
      <Route path="/cart" element={<Layout><CartPage /></Layout>} />
      <Route path="/checkout" element={
        <ProtectedRoute><Layout noFooter><CheckoutPage /></Layout></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
      } />
      <Route path="/dashboard/:tab" element={
        <ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly><Layout><AdminPage /></Layout></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={
        <Layout>
          <div className="min-h-screen flex items-center justify-center text-center px-4 pt-20">
            <div>
              <div className="text-8xl font-display font-bold text-gray-200 mb-4">404</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Page not found</h2>
              <p className="text-gray-500 mb-6">The page you're looking for doesn't exist</p>
              <a href="/" className="btn-primary inline-block">Go Home</a>
            </div>
          </div>
        </Layout>
      } />
    </Routes>
  </AnimatePresence>
);

const App = () => (
  <AuthProvider>
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  </AuthProvider>
);

export default App;
