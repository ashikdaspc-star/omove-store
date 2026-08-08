import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Sparkles, Search, ShieldCheck, Zap, Key, ShoppingBag, CheckCircle2 } from 'lucide-react';

interface DigitalProductsViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
}

export const DigitalProductsView: React.FC<DigitalProductsViewProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  wishlist,
  onToggleWishlist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter EXCLUSIVELY Digital Products (exclude Store Card items)
  const digitalProducts = products.filter((p) => {
    // Exclude items created as Store Cards
    const isStoreCard = p.tags && p.tags.some((t) => t.toLowerCase().includes('store card'));
    if (isStoreCard) return false;

    const isDigitalProduct = p.category === 'Software' || p.category.toLowerCase().includes('software') || p.instantKeyAvailable;
    const matchesCategory =
      selectedCategory === 'All' ||
      selectedCategory === 'Software Keys' ||
      selectedCategory === 'Lifetime Licenses' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return isDigitalProduct && matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>DIGITAL PRODUCTS & LICENSE KEYS ONLY</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
              Digital Product Sell & Keys
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-sans">
              Exclusive store section dedicated strictly to genuine software activation keys, digital licenses, and premium application suites with 100% instant key delivery.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center font-mono space-y-1 w-full sm:w-auto">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">Delivery Guarantee</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Instant Key Delivery</span>
              </span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="pt-4 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search digital software, keys, activation licenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-sans"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-mono text-xs">
            {['All Digital Products', 'Software Keys', 'Lifetime Licenses'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All Digital Products' ? 'All' : cat)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  (selectedCategory === 'All' && cat === 'All Digital Products') || selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Instant License Keys</h4>
            <p className="text-xs text-slate-500">Keys delivered instantly on checkout screen</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Genuine & Verified</h4>
            <p className="text-xs text-slate-500">Authentic digital product licenses guaranteed</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">100% Refund Guarantee</h4>
            <p className="text-xs text-slate-500">Full refund if key activation fails</p>
          </div>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-extrabold text-slate-900 font-mono flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>Digital Product Catalog ({digitalProducts.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Showing {digitalProducts.length} Items</span>
        </div>

        {digitalProducts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">No digital products found matching "{searchQuery}"</h3>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
              Try searching with another keyword or select "All" to browse all available digital products.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {digitalProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
