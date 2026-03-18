// src/pages/HomePage.jsx - Landing page with 3D hero, features, trending
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import { ShoppingBag, Zap, Shield, Truck, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton, SectionHeader } from '../components/common';

// ─── 3D Animated Sphere ───────────────────────────────────────
const AnimatedSphere = () => {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1.8, 128, 128]}>
        <MeshDistortMaterial
          color="#6366F1"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

// ─── 3D Scene ──────────────────────────────────────────────────
const HeroScene = () => (
  <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
    <ambientLight intensity={0.5} />
    <directionalLight position={[10, 10, 5]} intensity={1} />
    <pointLight position={[-10, -10, -10]} color="#a855f7" intensity={0.5} />
    <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
    <AnimatedSphere />
  </Canvas>
);

const features = [
  { icon: <Zap className="text-secondary" size={24} />, title: 'Smart Pricing', desc: 'AI-driven dynamic pricing based on real-time demand and inventory.' },
  { icon: <Truck className="text-accent" size={24} />, title: 'Fast Delivery', desc: 'Free shipping on orders above ₹499. Track your order live.' },
  { icon: <Shield className="text-amber-500" size={24} />, title: 'Secure Checkout', desc: 'Bank-grade encryption. Pay with UPI, card, or cash on delivery.' },
  { icon: <Star className="text-purple-500" size={24} />, title: 'Genuine Reviews', desc: 'Verified purchase reviews. No fake ratings, ever.' },
];

const HomePage = () => {
  const [trending, setTrending]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, -80]);

  useEffect(() => {
    Promise.all([productAPI.getTrending(), categoryAPI.getAll()])
      .then(([tRes, cRes]) => {
        setTrending(tRes.data.data.slice(0, 8));
        setCategories(cRes.data.data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary via-slate-800 to-indigo-950 overflow-hidden">
        {/* 3D Canvas */}
        <motion.div style={{ y }} className="absolute inset-0 opacity-70">
          <HeroScene />
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 border border-secondary/30 rounded-full text-secondary text-sm font-semibold mb-6"
            >
              <TrendingUp size={14} /> Smart Pricing Active
            </motion.span>

            <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white leading-[1.1] mb-6">
              Shop Smarter,<br />
              <span className="text-gradient">Live Better.</span>
            </h1>

            <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              AI-powered recommendations, dynamic pricing, and a curated selection of
              premium products — all in one place.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-accent flex items-center gap-2 text-base px-8 py-4">
                <ShoppingBag size={20} /> Start Shopping
              </Link>
              <Link to="/products?featured=true" className="btn-secondary flex items-center gap-2 text-base px-8 py-4 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white">
                View Featured <ArrowRight size={18} />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-white/10">
              {[['10K+', 'Products'], ['50K+', 'Customers'], ['4.8★', 'Avg Rating'], ['2-Day', 'Delivery']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-2xl font-display font-bold text-white">{val}</p>
                  <p className="text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────── */}
      <section className="section">
        <SectionHeader tag="Browse by" title="Shop by Category" center />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {(loading ? Array(6).fill(null) : categories).map((cat, i) => (
            loading ? (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ) : (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="glass-card flex flex-col items-center justify-center p-5 h-28 gap-2
                             hover:border-secondary hover:shadow-glow group transition-all duration-300"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                  <span className="text-xs font-semibold text-gray-700 text-center">{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.product_count} items</span>
                </Link>
              </motion.div>
            )
          ))}
        </div>
      </section>

      {/* ── TRENDING PRODUCTS ────────────────────────────────── */}
      <section className="section bg-slate-50/50">
        <div className="flex items-end justify-between mb-12">
          <SectionHeader tag="Hot Right Now" title="Trending Products" />
          <Link to="/products?sort=popular" className="hidden md:flex items-center gap-2 text-secondary font-semibold hover:gap-3 transition-all text-sm">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading
            ? Array(8).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
            : trending.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="section">
        <SectionHeader tag="Why SmartStore" title="Everything You Need" center />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-brand rounded-3xl p-12 text-center text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #6366F1 0%, transparent 50%), radial-gradient(circle at 80% 50%, #22C55E 0%, transparent 50%)' }} />
          <div className="relative z-10">
            <h2 className="font-display text-4xl font-extrabold mb-4">Ready to Shop Smarter?</h2>
            <p className="text-slate-300 text-lg mb-8">Join 50,000+ customers saving with dynamic pricing.</p>
            <Link to="/register" className="btn-accent inline-flex items-center gap-2 text-base px-10 py-4">
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
