import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DigitalProduct, DigitalCategory } from '../types';
import { DigitalProductCard } from '../components/DigitalProductCard';
import { Search, Sparkles, FolderTree, ChevronRight, Layers, ArrowLeft, Filter, CheckCircle2, Zap, LayoutGrid } from 'lucide-react';

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
  const [digitalProds, setDigitalProds] = useState<DigitalProduct[]>([]);

  // Fetch dynamic categories
  useEffect(() => {
    fetch('/api/digital-categories?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setDigitalCats(data);
      })
      .catch(() => {});
  }, []);

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

  // Single Authoritative Catalog: Filter published digital products directly from products prop
  const allDigitalProducts = useMemo(() => {
    return (products || []).filter(
      (p) => (p.productType === 'DIGITAL' || !p.tags?.includes('Store Card')) &&
             (p.status || 'PUBLISHED') === 'PUBLISHED'
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
        if (!matchesParent && !matchesChild) return false;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 font-sans">
      {/* Ultra-Compact & Eye-Catchy Unified Glassmorphic Control Bar */}
      <div className="relative p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white overflow-hidden shadow-xl border border-emerald-500/30 backdrop-blur-xl">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Title & Breadcrumbs */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <Link to="/" className="hover:underline">Home</Link>
                <span>/</span>
                <Link to="/digital-products" className="hover:underline">Digital</Link>
                {activeCategory && (
                  <>
                    <span>/</span>
                    <span className="font-bold text-white">{activeCategory.name}</span>
                  </>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none mt-0.5">
                {activeSubcategory
                  ? activeSubcategory.name
                  : activeCategory
                  ? activeCategory.name
                  : 'Digital Marketplace'}
              </h1>
            </div>
          </div>

          {/* Center: Inline Category Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => navigate('/digital-products')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                !categorySlug
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/30 scale-105'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Products</span>
            </button>

            {topLevelCategories.map((cat) => {
              const isSelected = activeCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/digital-products/${cat.slug}`)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/30 scale-105'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Right: Slim Search Input */}
          <div className="relative w-full md:w-52 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 focus:border-emerald-400 text-xs text-white placeholder-slate-400 focus:outline-none font-sans transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Subcategories strip (only if active category has subcategories) */}
        {childSubcategories.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
            <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Subcategories:</span>
            <button
              onClick={() => navigate(`/digital-products/${activeCategory?.slug}`)}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                !subcategorySlug
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
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
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                    isSubSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'text-slate-400 hover:text-white'
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
          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((prod) => (
              <DigitalProductCard
                key={prod.id}
                product={prod as any}
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
