// src/components/product/ProductCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, Zap } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { wishlistAPI } from '../../services/api';
import { Badge } from '../common';
import toast from 'react-hot-toast';

const ProductCard = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [wishListed, setWishListed] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  const price = product.dynamic_price || product.base_price;
  const isOnSale = product.dynamic_price && product.dynamic_price < product.base_price;
  const isExpensive = product.dynamic_price && product.dynamic_price > product.base_price;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please sign in to add to cart'); return; }
    setAddingCart(true);
    await addToCart(product.id);
    setAddingCart(false);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please sign in'); return; }
    try {
      if (wishListed) {
        await wishlistAPI.remove(product.id);
        setWishListed(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product.id);
        setWishListed(true);
        toast.success('Added to wishlist');
      }
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/product/${product.id}`} className="product-card group block">
        {/* Image */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
          <img
            src={product.thumbnail || 'https://via.placeholder.com/400x300?text=Product'}
            alt={product.name}
            className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_featured && <Badge variant="primary">Featured</Badge>}
            {product.is_low_stock && product.stock_quantity > 0 && (
              <Badge variant="warning">Only {product.stock_quantity} left!</Badge>
            )}
            {product.stock_quantity === 0 && <Badge variant="danger">Out of Stock</Badge>}
            {isOnSale && <Badge variant="success">Price Drop</Badge>}
            {isExpensive && (
              <span className="badge bg-amber-500/90 text-white flex items-center gap-1">
                <Zap size={10} /> High Demand
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
              backdrop-blur-sm transition-all duration-200
              ${wishListed ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500'}`}
          >
            <Heart size={15} fill={wishListed ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {product.category_name && (
            <p className="text-xs font-medium text-secondary uppercase tracking-wider mb-1">
              {product.category_name}
            </p>
          )}
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-secondary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {(product.avg_rating > 0 || product.review_count > 0) && (
            <div className="flex items-center gap-1 mb-3">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700">
                {Number(product.avg_rating).toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">({product.review_count})</span>
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                ₹{Number(price).toLocaleString('en-IN')}
              </span>
              {isOnSale && (
                <span className="text-xs text-gray-400 line-through ml-1.5">
                  ₹{Number(product.base_price).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || addingCart}
              className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-white text-xs font-semibold rounded-xl
                         hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                         active:scale-95 transition-all duration-200"
            >
              {addingCart ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCart size={13} />
              )}
              {product.stock_quantity === 0 ? 'Sold Out' : 'Add'}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
