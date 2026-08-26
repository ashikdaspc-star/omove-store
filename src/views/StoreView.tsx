import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { useOnlineStatus } from '../components/OfflineBanner';
import { isStoreProduct } from '../utils/productClassifier';
import {
  Search,
  Grid,
  List,
  ShoppingBag,
  Zap,
  Check,
  Star,
  Sparkles,
  ArrowRight,
  Monitor,
  Cpu
} from 'lucide-react';

interface StoreViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  products = [],
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  wishlist = [],
  onToggleWishlist,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const isOnline = useOnlineStatus();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');
  const [maxPrice, setMaxPrice] = useState<number>(5000);

  // Filter EXCLUSIVELY Store / Software Products
  const storeCatalogProducts = useMemo(() => {
    return (products || []).filter(
      (p) => isStoreProduct(p) && (p.status || 'PUBLISHED') === 'PUBLISHED'
    );
  }, [products]);

  // Dynamic Store Categories with active products count > 0
  const storeCategories = useMemo(() => {
    const countsMap = new Map<string, number>();
    storeCatalogProducts.forEach((p) => {
      const cat = p.category || 'Software';
      countsMap.set(cat, (countsMap.get(cat) || 0) + 1);
    });
    return Array.from(countsMap.entries()).map(([name, count]) => ({ name, count }));
  }, [storeCatalogProducts]);

  // Filter & sort store products
  const filteredProducts = useMemo(() => {
    return storeCatalogProducts
      .filter((p) => {
        const pCat = p.category || 'Software';
        const pName = p.name || '';
        const pDesc = p.shortDescription || (p as any).description || '';

        const matchesCategory =
          selectedCategory === 'All' ||
          selectedCategory === 'All Store Products' ||
          !selectedCategory ||
          pCat.toLowerCase() === selectedCategory.toLowerCase();

        const matchesQuery =
          !searchQuery.trim() ||
          pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesPrice = (p.price || 0) <= maxPrice;

        return matchesCategory && matchesQuery && matchesPrice;
      })
      .sort((a, b) => {
        if (sortOption === 'price-low') return (a.price || 0) - (b.price || 0);
        if (sortOption === 'price-high') return (b.price || 0) - (a.price || 0);
        if (sortOption === 'rating') return (b.rating || 0) - (a.rating || 0);
        return (b.salesCount || 0) - (a.salesCount || 0);
      });
  }, [storeCatalogProducts, selectedCategory, searchQuery, maxPrice, sortOption]);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setMaxPrice(5000);
    setSortOption('popular');
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8] text-slate-900 font-sans pb-16 relative overflow-hidden">
      {/* Subtle Ambient Background Highlights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/35 rounded-full blur-3xl pointer-events-none -mt-20" />
      <div className="absolute top-96 left-10 w-[400px] h-[400px] bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. COMPACT STORE CATEGORY NAVIGATION                                      */}
        {/* ========================================================================= */}
        <div className="scroll-reveal flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'All' || selectedCategory === 'All Store Products' || !selectedCategory
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
            }`}
          >
            All Store Products ({storeCatalogProducts.length})
          </button>

          {storeCategories.map((cat) => {
            const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 2. UNIFIED SEARCH + FILTER TOOLBAR                                        */}
        {/* ========================================================================= */}
        <div className="scroll-reveal p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Dominant Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search software, tools, licenses, utilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Inline Filter Controls Strip */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end text-xs">
            
            {/* Price Filter */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Max:</span>
              <input
                type="range"
                min="200"
                max="5000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-20 accent-emerald-600 cursor-pointer"
              />
              <span className="font-bold text-slate-900">₹{maxPrice}</span>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              aria-label="Sort store products"
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* Grid / List View Toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-2xs' : ''
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-emerald-600 text-white shadow-2xs' : ''
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. STORE RESULT HEADER                                                    */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span className="text-slate-800 font-bold">
            Official Software & Windows Tools
          </span>
          <span>
            Showing {filteredProducts.length} store product{filteredProducts.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 4. PRODUCT DISPLAY GRID / LIST                                            */}
        {/* ========================================================================= */}
        {filteredProducts.length === 0 ? (
          <div className="scroll-reveal p-12 sm:p-16 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">No store products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try another search or browse all software and tools in our store catalog.
              </p>
            </div>
            <button
              onClick={resetAllFilters}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              View All Store Products
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => {
              const discount = product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  data-scroll-reveal="card"
                  style={{ '--reveal-delay': `${(idx % 4) * 140}ms` } as React.CSSProperties}
                  className="scroll-reveal group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-emerald-500/40 transition-all duration-300 shadow-2xs hover:shadow-md hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div
                      className="relative aspect-video w-full overflow-hidden bg-slate-100 cursor-pointer"
                      onClick={() => onSelectProduct(product)}
                    >
                      <img
                        src={product.image || product.previewImage || '/logo.png'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40" />

                      {/* Category & Discount Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                          {product.category || 'SOFTWARE'}
                        </span>
                        {discount > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            -{discount}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          {product.licenseType || 'Genuine License'}
                        </span>
                        {product.rating && (
                          <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{product.rating}</span>
                          </div>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectProduct(product)}
                        className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {product.shortDescription || (product as any).description || 'High-quality software package delivered with instant activation.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom / Pricing & Action */}
                  <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-slate-900">₹{product.price}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Product</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-4">
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id}
                data-scroll-reveal="card"
                style={{ '--reveal-delay': `${(idx % 4) * 140}ms` } as React.CSSProperties}
                className="scroll-reveal p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/40 shadow-2xs hover:shadow-md flex flex-col md:flex-row items-center justify-between gap-5 transition-all"
              >
                <div
                  className="flex items-center gap-4 w-full md:w-auto cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.image || product.previewImage || '/logo.png'}
                    alt={product.name}
                    className="w-24 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {product.category || 'Software'}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 hover:text-emerald-700 transition-colors truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{product.shortDescription}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-slate-900">₹{product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="block text-[11px] text-slate-400 line-through">₹{product.originalPrice}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View Product</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
