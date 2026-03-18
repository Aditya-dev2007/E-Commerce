// src/pages/ProductDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star, Shield, Truck, RefreshCw, Zap, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { productAPI, wishlistAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import { Badge, StarRating, PriceDisplay, Spinner } from '../components/common';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [imgIndex, setImgIndex]   = useState(0);
  const [qty, setQty]             = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    setLoading(true);
    productAPI.getOne(id)
      .then(res => setProduct(res.data.data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Spinner size="lg" />
    </div>
  );
  if (!product) return null;

  const images = [product.thumbnail, ...(product.images || [])].filter(Boolean);
  const price = product.dynamic_price || product.base_price;
  const isOnSale = product.dynamic_price && product.dynamic_price < product.base_price;
  const isHighDemand = product.dynamic_price && product.dynamic_price > product.base_price;

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in'); return; }
    setAddingCart(true);
    await addToCart(product.id, qty);
    setAddingCart(false);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAddingCart(true);
    const ok = await addToCart(product.id, qty);
    setAddingCart(false);
    if (ok !== false) navigate('/cart');
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please sign in'); return; }
    try {
      if (wishlisted) { await wishlistAPI.remove(product.id); setWishlisted(false); toast.success('Removed from wishlist'); }
      else { await wishlistAPI.add(product.id); setWishlisted(true); toast.success('Added to wishlist'); }
    } catch {}
  };

  const ratingDist = product.rating_distribution || [];
  const totalReviews = ratingDist.reduce((s, r) => s + parseInt(r.count), 0);

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <button onClick={() => navigate('/products')} className="hover:text-secondary transition-colors">Products</button>
          <span>/</span>
          {product.category_name && (
            <><button onClick={() => navigate(`/products?category=${product.category_slug}`)}
                className="hover:text-secondary transition-colors">{product.category_name}</button>
              <span>/</span></>
          )}
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Image Gallery ─────────────────────────────── */}
          <div className="space-y-4">
            <div className="relative glass-card overflow-hidden aspect-square">
              <motion.img
                key={imgIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={images[imgIndex] || 'https://via.placeholder.com/600'}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIndex(i => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 glass-card flex items-center justify-center hover:bg-white transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 glass-card flex items-center justify-center hover:bg-white transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors
                      ${i === imgIndex ? 'border-secondary' : 'border-gray-200 hover:border-gray-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ──────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.brand && <Badge variant="info">{product.brand}</Badge>}
              {product.category_name && <Badge variant="primary">{product.category_name}</Badge>}
              {product.is_low_stock && product.stock_quantity > 0 && (
                <Badge variant="warning">Only {product.stock_quantity} left!</Badge>
              )}
              {product.stock_quantity === 0 && <Badge variant="danger">Out of Stock</Badge>}
              {isHighDemand && (
                <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
                  <Zap size={10} /> High Demand Pricing
                </span>
              )}
              {isOnSale && <Badge variant="success">Price Dropped</Badge>}
            </div>

            <h1 className="font-display text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={product.avg_rating} count={product.review_count} size="md" />
                <span className="text-sm text-gray-500">{Number(product.avg_rating).toFixed(1)} out of 5</span>
              </div>
            )}

            {/* Price */}
            <PriceDisplay price={price} originalPrice={isOnSale ? product.base_price : null} className="text-2xl" />

            {/* Qty + CTA */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold">−</button>
                  <span className="w-12 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold">+</button>
                </div>
                <span className="text-sm text-gray-400">{product.stock_quantity} available</span>
              </div>

              <div className="flex gap-3">
                <button onClick={handleAddToCart} disabled={!product.stock_quantity || addingCart}
                  className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {addingCart ? <Spinner size="sm" /> : <ShoppingCart size={18} />}
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button onClick={handleBuyNow} disabled={!product.stock_quantity}
                  className="flex-1 btn-accent flex items-center justify-center gap-2">
                  Buy Now
                </button>
                <button onClick={handleWishlist}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors
                    ${wishlisted ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-200 hover:border-red-300 hover:text-red-500 text-gray-500'}`}>
                  <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: <Truck size={16} className="text-accent"/>, text: 'Free over ₹499' },
                { icon: <Shield size={16} className="text-secondary"/>, text: 'Secure Payment' },
                { icon: <RefreshCw size={16} className="text-amber-500"/>, text: '7-Day Returns' },
              ].map(item => (
                <div key={item.text} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center">
                  {item.icon}
                  <span className="text-xs text-gray-600 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Tabs: Description / Specs / Reviews ────────── */}
        <div className="mt-16">
          <div className="flex gap-0 border-b border-gray-200 mb-8">
            {['description', 'specifications', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-colors
                  ${activeTab === tab ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {tab} {tab === 'reviews' && `(${product.review_count || 0})`}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-8 prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed text-base">{product.description}</p>
            </motion.div>
          )}

          {activeTab === 'specifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8">
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                      <span className="text-gray-500 text-sm min-w-[140px] font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-800 text-sm font-semibold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No specifications available</p>
              )}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Rating summary */}
              {totalReviews > 0 && (
                <div className="glass-card p-6 flex flex-col sm:flex-row gap-8 items-center">
                  <div className="text-center">
                    <p className="text-6xl font-display font-bold text-gray-900">{Number(product.avg_rating).toFixed(1)}</p>
                    <StarRating rating={product.avg_rating} size="md" />
                    <p className="text-sm text-gray-500 mt-1">{totalReviews} reviews</p>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {[5,4,3,2,1].map(star => {
                      const r = ratingDist.find(d => parseInt(d.rating) === star);
                      const count = r ? parseInt(r.count) : 0;
                      const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-4">{star}★</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-8">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Review list */}
              <div className="space-y-4">
                {(product.reviews || []).map(review => (
                  <div key={review.id} className="glass-card p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {review.user_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">{review.user_name}</p>
                            {review.is_verified_purchase && (
                              <span className="flex items-center gap-1 text-xs text-accent font-medium">
                                <Check size={10}/> Verified
                              </span>
                            )}
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    {review.title && <p className="font-semibold text-gray-800 mb-1">{review.title}</p>}
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
                {(!product.reviews || product.reviews.length === 0) && (
                  <div className="text-center py-12 text-gray-400">
                    <Star size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Frequently Bought Together ──────────────────── */}
        {product.frequently_bought_together?.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Frequently Bought Together</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {product.frequently_bought_together.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
