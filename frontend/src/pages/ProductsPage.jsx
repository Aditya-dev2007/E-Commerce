// src/pages/ProductsPage.jsx - Full product listing with filters, sort, pagination
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton, Pagination, SectionHeader } from '../components/common';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: 'rating',    label: 'Highest Rated' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = {
    category:  searchParams.get('category') || '',
    sort:      searchParams.get('sort') || 'newest',
    search:    searchParams.get('search') || '',
    minPrice:  searchParams.get('minPrice') || '',
    maxPrice:  searchParams.get('maxPrice') || '',
    inStock:   searchParams.get('inStock') || '',
    featured:  searchParams.get('featured') || '',
    page:      parseInt(searchParams.get('page') || '1'),
  };

  const setFilter = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  const clearFilters = () => setSearchParams({});
  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.inStock || filters.featured;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({
        page: filters.page, limit: 12,
        category: filters.category, sort: filters.sort,
        search: filters.search, minPrice: filters.minPrice,
        maxPrice: filters.maxPrice, inStock: filters.inStock, featured: filters.featured,
      });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [searchParams]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { categoryAPI.getAll().then(r => setCategories(r.data.data)); }, []);

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              {filters.search ? `Results for "${filters.search}"` :
               filters.category ? (categories.find(c => c.slug === filters.category)?.name || 'Products') :
               filters.featured ? 'Featured Products' : 'All Products'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {loading ? 'Loading...' : `${pagination.total} products found`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
                className="input-field pr-8 py-2.5 text-sm appearance-none cursor-pointer">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button onClick={() => setFiltersOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors
                ${filtersOpen || hasActiveFilters ? 'bg-secondary text-white border-secondary' : 'border-gray-200 hover:border-secondary text-gray-700'}`}>
              <SlidersHorizontal size={16} /> Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white/80" />}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          <AnimatePresence>
            {filtersOpen && (
              <motion.aside initial={{ opacity: 0, x: -20, width: 0 }} animate={{ opacity: 1, x: 0, width: 260 }}
                exit={{ opacity: 0, x: -20, width: 0 }} className="shrink-0 overflow-hidden">
                <div className="glass-card p-5 w-64 space-y-6 sticky top-24">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-xs text-secondary font-medium flex items-center gap-1">
                        <X size={12}/> Clear all
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Category</p>
                    <div className="space-y-1.5">
                      <button onClick={() => setFilter('category', '')}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                          ${!filters.category ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-indigo-50 hover:text-secondary'}`}>
                        All Categories
                      </button>
                      {categories.map(c => (
                        <button key={c.id} onClick={() => setFilter('category', c.slug)}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between
                            ${filters.category === c.slug ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-indigo-50 hover:text-secondary'}`}>
                          <span>{c.icon} {c.name}</span>
                          <span className={`text-xs ${filters.category === c.slug ? 'text-white/70' : 'text-gray-400'}`}>{c.product_count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Price Range (₹)</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filters.minPrice}
                        onChange={e => setFilter('minPrice', e.target.value)} className="input-field text-sm py-2 w-full" />
                      <input type="number" placeholder="Max" value={filters.maxPrice}
                        onChange={e => setFilter('maxPrice', e.target.value)} className="input-field text-sm py-2 w-full" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={filters.inStock === 'true'}
                      onChange={e => setFilter('inStock', e.target.checked ? 'true' : '')}
                      className="w-4 h-4 rounded accent-indigo-500" />
                    <span className="text-sm text-gray-700">In Stock Only</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={filters.featured === 'true'}
                      onChange={e => setFilter('featured', e.target.checked ? 'true' : '')}
                      className="w-4 h-4 rounded accent-indigo-500" />
                    <span className="text-sm text-gray-700">Featured Only</span>
                  </label>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(12).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
                <Pagination page={pagination.page} pages={pagination.pages}
                  onPageChange={p => setFilter('page', String(p))} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
