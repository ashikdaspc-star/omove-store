import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../data/mockData';
import { ProductCard } from '../components/ProductCard';
import {
  Search,
  Grid,
  List,
  ShoppingBag,
  Zap,
  Check
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
  products,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  wishlist,
  onToggleWishlist,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedLicense, setSelectedLicense] = useState<string>('All');

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesQuery =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPrice = p.price <= maxPrice;
        const matchesLicense = selectedLicense === 'All' || p.licenseType === selectedLicense;

        return matchesCategory && matchesQuery && matchesPrice && matchesLicense;
      })
      .sort((a, b) => {
        if (sortOption === 'price-low') return a.price - b.price;
        if (sortOption === 'price-high') return b.price - a.price;
        if (sortOption === 'rating') return b.rating - a.rating;
        return b.salesCount - a.salesCount;
      });
  }, [products, selectedCategory, searchQuery, maxPrice, selectedLicense, sortOption]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) {
        const catName = CATEGORIES.find((c) => c.name.toLowerCase() === p.category.toLowerCase())?.name || p.category;
        counts[catName] = (counts[catName] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Store Header */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
              Digital Software & Keys Store
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Browse Software Catalog
            </h1>
          </div>
          <div>
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200/80">
              {filteredProducts.length} Items Found
            </span>
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.name] || 0;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search software by name, tag or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Price Range */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-mono">Max Price:</span>
            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-20 accent-emerald-600"
            />
            <span className="font-mono font-bold text-slate-900">₹{maxPrice}</span>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* Grid/List View Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-900 ${
                viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : ''
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-900 ${
                viewMode === 'list' ? 'bg-emerald-600 text-white shadow-xs' : ''
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Display List */}
      {filteredProducts.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting your search query or category filters.</p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setMaxPrice(5000);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-sm hover:bg-emerald-700"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
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
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/40 shadow-xs hover:shadow-md flex flex-col md:flex-row items-center justify-between gap-6 transition-all"
            >
              <div className="flex items-center gap-4 w-full md:w-auto cursor-pointer" onClick={() => onSelectProduct(product)}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-24 h-20 rounded-xl object-cover border border-slate-200"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{product.category}</span>
                  <h3 className="font-bold text-base text-slate-900 hover:text-emerald-700 transition-colors">{product.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{product.shortDescription}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                <div className="text-right font-mono">
                  <span className="text-lg font-bold text-slate-900">₹{product.price}</span>
                  <span className="block text-[10px] text-emerald-700 font-semibold">{product.licenseType}</span>
                </div>
                <button
                  onClick={() => onBuyNow(product)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-sm"
                >
                  BUY NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
