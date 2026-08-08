import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { DigitalProductCard } from '../components/DigitalProductCard';
import { Search, ShoppingBag, CheckCircle2, Zap, ShieldCheck, Tag } from 'lucide-react';

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

  // Filter EXCLUSIVELY Digital Products for /digital-products route
  const digitalProductsOnly = products.filter(
    (p) => (p.productType === 'DIGITAL' || (!p.productType && !p.tags?.includes('Store Card'))) &&
           (p.status || 'PUBLISHED') === 'PUBLISHED'
  );

  // Extract all Sub-Categories dynamically from admin-created products
  const availableSubCategories = useMemo(() => {
    const subSet = new Set<string>();
    digitalProductsOnly.forEach((p) => {
      if (p.subCategory && p.subCategory.trim()) {
        subSet.add(p.subCategory.trim());
      }
    });
    // Include fallback defaults if none present yet
    if (subSet.size === 0) {
      subSet.add('Software Keys');
      subSet.add('Operating Systems');
      subSet.add('CAD & Design Tools');
      subSet.add('Antivirus & Security');
    }
    return ['All', ...Array.from(subSet)];
  }, [digitalProductsOnly]);

  const digitalProducts = digitalProductsOnly.filter((p) => {
    const pCat = p.category || '';
    const pSubCat = p.subCategory || '';
    const pName = p.name || '';
    const pDesc = p.shortDescription || '';

    const matchesCategory =
      selectedCategory === 'All' ||
      pSubCat.toLowerCase() === selectedCategory.toLowerCase() ||
      pCat.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pSubCat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((p.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-8 space-y-6">
      {/* Simplified Compact Header & Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
              DIGITAL PRODUCTS
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Digital Products & License Keys
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-2xl">
              Explore our digital products, genuine software license keys, and operating systems with instant access after purchase.
            </p>
          </div>

          {/* Compact Benefit Highlights Line */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono font-bold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 shrink-0">
            <span className="flex items-center gap-1 text-emerald-700">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Instant Access</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Genuine Products</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Refund Guarantee</span>
            </span>
          </div>
        </div>

        {/* Search & Sub-Category Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search digital products & sub-categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 font-mono text-xs scrollbar-none">
            {availableSubCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedCategory(sub)}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === sub
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {sub === 'All' ? 'All Sub-Categories' : sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Catalog Grid - Starts Quickly */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h2 className="text-lg font-bold text-slate-900 font-mono flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>Digital Product Catalog ({digitalProducts.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Showing {digitalProducts.length} Items</span>
        </div>

        {digitalProducts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">No digital products found matching "{searchQuery}"</h3>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
              Try searching with another keyword or select "All" to browse all available digital products.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {digitalProducts.map((product) => (
              <DigitalProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
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
