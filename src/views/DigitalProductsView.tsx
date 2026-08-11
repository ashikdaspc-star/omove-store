import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DigitalProduct, DigitalCategory } from '../types';
import { DigitalProductCard } from '../components/DigitalProductCard';
import { Search, Sparkles, FolderTree, ChevronRight, Layers, ArrowLeft, Filter, CheckCircle2 } from 'lucide-react';

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

  // Fetch dynamic categories and products if not passed in props
  useEffect(() => {
    fetch('/api/digital-categories?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setDigitalCats(data);
      })
      .catch(() => {});

    fetch('/api/digital-products?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setDigitalProds(data);
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

  // Combined product catalog (backend digital_products.json + props fallback)
  const allDigitalProducts = digitalProds.length > 0
    ? digitalProds
    : (products || []).filter((p) => p.productType === 'DIGITAL' || !p.tags?.includes('Store Card'));

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner & Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl border border-slate-800 space-y-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/30">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>DIGITAL PRODUCTS MARKETPLACE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {activeSubcategory
                ? activeSubcategory.name
                : activeCategory
                ? activeCategory.name
                : 'Premium Digital Files & Design Assets'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeSubcategory?.description || activeCategory?.description || 'Browse high-quality digital templates, graphics, presets, software tools, and digital resources with instant Google Drive file delivery.'}
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search digital assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans shadow-inner"
            />
          </div>
        </div>

        {/* Dynamic Breadcrumbs */}
        <div className="relative z-10 pt-2 border-t border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-400 overflow-x-auto">
          <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <Link to="/digital-products" className="hover:text-emerald-400 transition-colors">Digital Products</Link>

          {activeCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <Link to={`/digital-products/${activeCategory.slug}`} className={`hover:text-emerald-400 transition-colors ${!activeSubcategory ? 'text-emerald-400 font-bold' : ''}`}>
                {activeCategory.name}
              </Link>
            </>
          )}

          {activeSubcategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-emerald-400 font-bold">{activeSubcategory.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Category Filter Pills Navigation */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <span>CATEGORIES</span>
          </span>
          {(activeCategory || activeSubcategory) && (
            <button
              onClick={() => navigate('/digital-products')}
              className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1"
            >
              <span>View All Categories</span>
            </button>
          )}
        </div>

        {/* Top-Level Categories Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => navigate('/digital-products')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
              !categorySlug
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Products
          </button>

          {topLevelCategories.map((cat) => {
            const isSelected = activeCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/digital-products/${cat.slug}`)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Subcategories Selector Bar (when a parent category is selected) */}
        {childSubcategories.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase shrink-0">Subcategories:</span>
            <button
              onClick={() => navigate(`/digital-products/${activeCategory?.slug}`)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                !subcategorySlug
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                    isSubSelected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
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
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs text-slate-500">
          <span className="font-bold text-slate-900">
            Showing {filteredProducts.length} Digital Asset{filteredProducts.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderTree className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 font-mono">No Digital Files Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your selected category filter or search criteria.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                navigate('/digital-products');
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>CLEAR FILTERS</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
