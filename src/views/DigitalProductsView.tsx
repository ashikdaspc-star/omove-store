import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DigitalProduct, DigitalCategory } from '../types';
import { DigitalProductCard } from '../components/DigitalProductCard';
import { Search, Sparkles, FolderTree, ChevronRight, Layers, ArrowLeft, Filter, CheckCircle2, Zap, LayoutGrid } from 'lucide-react';

import { isDigitalProduct } from '../utils/productClassifier';

interface DigitalProductsViewProps {
  products: any[];
  categories?: DigitalCategory[];
  onSelectProduct: (product: any) => void;
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
}

export const DigitalProductsView: React.FC<DigitalProductsViewProps> = ({
  products = [],
  categories = [],
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  wishlist = [],
  onToggleWishlist
}) => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug?: string; subcategorySlug?: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [digitalCats, setDigitalCats] = useState<DigitalCategory[]>(categories);

  // Sync or fetch dynamic categories
  useEffect(() => {
    if (categories && categories.length > 0) {
      setDigitalCats(categories);
    } else {
      fetch('/api/digital-categories?v=' + Date.now(), { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setDigitalCats(data);
        })
        .catch(() => {});
    }
  }, [categories]);

  const topLevelCategories = useMemo(() => {
    return digitalCats.filter((c) => !c.parentId && c.active !== false);
  }, [digitalCats]);

  const activeCategory = useMemo(() => {
    if (!categorySlug) return null;
    return digitalCats.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase());
  }, [categorySlug, digitalCats]);

  const activeSubcategory = useMemo(() => {
    if (!subcategorySlug) return null;
    return digitalCats.find((c) => c.slug.toLowerCase() === subcategorySlug.toLowerCase());
  }, [subcategorySlug, digitalCats]);

  const childSubcategories = useMemo(() => {
    if (!activeCategory) return [];
    return digitalCats.filter((c) => c.parentId === activeCategory.id && c.active !== false);
  }, [activeCategory, digitalCats]);

  // Single Authoritative Catalog: Filter EXCLUSIVELY published digital products
  const allDigitalProducts = useMemo(() => {
    return (products || []).filter(
      (p) => isDigitalProduct(p) && (p.status || 'PUBLISHED') === 'PUBLISHED'
    );
  }, [products]);

  // Filter products by category, subcategory, and search query
  const filteredProducts = useMemo(() => {
    return allDigitalProducts.filter((prod) => {
      // 1. Status Filter
      if ((prod as any).status && (prod as any).status !== 'PUBLISHED') return false;

      // 2. Category / Subcategory Filter
      if (activeSubcategory) {
        if (prod.subcategoryId !== activeSubcategory.id && prod.subcategoryId !== activeSubcategory.slug) {
          return false;
        }
      } else if (activeCategory) {
        // Parent category matches products directly assigned OR products in child subcategories
        const childIds = digitalCats.filter((c) => c.parentId === activeCategory.id).map((c) => c.id);
        const matchesParent = prod.categoryId === activeCategory.id || prod.categoryId === activeCategory.slug;
        const matchesChild = prod.subcategoryId && childIds.includes(prod.subcategoryId);
        const matchesByName = (prod.category || '').toLowerCase() === activeCategory.name.toLowerCase();
        if (!matchesParent && !matchesChild && !matchesByName) return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (prod.name || '').toLowerCase().includes(q);
        const matchesDesc = (prod.shortDescription || (prod as any).description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [allDigitalProducts, activeCategory, activeSubcategory, digitalCats, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 font-sans">
      {/* Top Control Bar */}
      <div className="scroll-reveal p-3 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Breadcrumbs & Title */}
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-500">
            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link to="/digital-products" className="hover:text-slate-900 transition-colors">Digital Products</Link>
            {activeCategory && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-emerald-700 font-semibold">{activeCategory.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeSubcategory
                ? activeSubcategory.name
                : activeCategory
                ? activeCategory.name
                : 'Digital Marketplace'}
            </h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-4">
          {/* Center: Inline Category Navigation Pills */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => navigate('/digital-products')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                !categorySlug
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>All Products ({allDigitalProducts.length})</span>
            </button>

            {topLevelCategories.map((cat) => {
              const isSelected = activeCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/digital-products/${cat.slug}`)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Right: Slim Search Input */}
          <div className="relative w-full md:w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Subcategories strip (only if active category has subcategories) */}
        {childSubcategories.length > 0 && (
          <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center gap-1 sm:gap-1.5 overflow-x-auto text-xs w-full">
            <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold shrink-0">Subcategories:</span>
            <button
              onClick={() => navigate(`/digital-products/${activeCategory?.slug}`)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer ${
                !subcategorySlug
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-transparent'
              }`}
            >
              All {activeCategory?.name}
            </button>

            {childSubcategories.map((sub) => {
              const isSubSelected = activeSubcategory?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => navigate(`/digital-products/${activeCategory?.slug}/${sub.slug}`)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer ${
                    isSubSelected
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-transparent'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Catalog Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-slate-500">
          <span className="font-bold text-slate-800 text-xs">
            Showing {filteredProducts.length} Digital Asset{filteredProducts.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="scroll-reveal p-8 sm:p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderTree className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 font-mono">No Digital Assets Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your selected category filter or search criteria.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                navigate('/digital-products');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>CLEAR FILTERS</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
            {filteredProducts.map((prod, idx) => (
              <DigitalProductCard
                key={prod.id}
                product={prod as any}
                staggerIndex={idx}
                onSelect={(p) => navigate(`/digital-products/${p.slug || p.id}`)}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                isWishlisted={wishlist.includes(prod.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
