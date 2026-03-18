// src/components/common/index.jsx - Reusable UI components

// ─── Skeleton Loader ─────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const ProductCardSkeleton = () => (
  <div className="glass-card p-4 space-y-3">
    <Skeleton className="h-52 w-full rounded-xl" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex justify-between items-center pt-1">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-9 w-24 rounded-xl" />
    </div>
  </div>
);

// ─── Star Rating ─────────────────────────────────────────────
export const StarRating = ({ rating, count, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <div className={`flex items-center gap-1 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
      {count !== undefined && (
        <span className="text-gray-500 ml-1">({count})</span>
      )}
    </div>
  );
};

// ─── Badge ───────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default:  'bg-gray-100 text-gray-700',
    success:  'bg-green-100 text-green-700',
    warning:  'bg-amber-100 text-amber-700',
    danger:   'bg-red-100 text-red-700',
    info:     'bg-blue-100 text-blue-700',
    primary:  'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={`badge ${variants[variant]} ${className}`}>{children}</span>
  );
};

// ─── Price Display ────────────────────────────────────────────
export const PriceDisplay = ({ price, originalPrice, className = '' }) => {
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl font-bold text-gray-900">
        ₹{Number(price).toLocaleString('en-IN')}
      </span>
      {originalPrice && originalPrice > price && (
        <>
          <span className="text-sm text-gray-400 line-through">
            ₹{Number(originalPrice).toLocaleString('en-IN')}
          </span>
          <Badge variant="success">{discount}% off</Badge>
        </>
      )}
    </div>
  );
};

// ─── Empty State ─────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
    {action}
  </div>
);

// ─── Spinner ─────────────────────────────────────────────────
export const Spinner = ({ size = 'md', color = 'secondary' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-500`} />
  );
};

// ─── Order Status Badge ───────────────────────────────────────
export const OrderStatusBadge = ({ status }) => {
  const config = {
    placed:           { variant: 'info',    label: 'Order Placed' },
    confirmed:        { variant: 'primary', label: 'Confirmed' },
    packed:           { variant: 'warning', label: 'Packed' },
    shipped:          { variant: 'warning', label: 'Shipped' },
    out_for_delivery: { variant: 'warning', label: 'Out for Delivery' },
    delivered:        { variant: 'success', label: 'Delivered' },
    cancelled:        { variant: 'danger',  label: 'Cancelled' },
  };
  const { variant, label } = config[status] || { variant: 'default', label: status };
  return <Badge variant={variant}>{label}</Badge>;
};

// ─── Section Header ───────────────────────────────────────────
export const SectionHeader = ({ tag, title, subtitle, center = false }) => (
  <div className={`mb-12 ${center ? 'text-center' : ''}`}>
    {tag && <span className="text-secondary font-semibold text-sm uppercase tracking-widest">{tag}</span>}
    <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mt-2 mb-4">{title}</h2>
    {subtitle && <p className="text-gray-500 text-lg max-w-2xl">{center && 'mx-auto '}{subtitle}</p>}
  </div>
);

// ─── Pagination ───────────────────────────────────────────────
export const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  const getPages = () => {
    const arr = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) arr.push(i);
    return arr;
  };
  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-secondary hover:text-secondary transition-colors"
      >← Prev</button>
      {getPages().map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
            p === page ? 'bg-secondary text-white' : 'border border-gray-200 hover:border-secondary hover:text-secondary'
          }`}
        >{p}</button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-secondary hover:text-secondary transition-colors"
      >Next →</button>
    </div>
  );
};
