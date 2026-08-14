import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DigitalProduct, DigitalCategory, Product } from '../../../types';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import {
  Sparkles,
  Search,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Eye,
  CheckCircle2,
  Archive,
  MoreVertical,
  LayoutGrid,
  List,
  ChevronRight,
  FolderTree,
  ExternalLink
} from 'lucide-react';

interface AdminDigitalProductsViewProps {
  products: any[];
  categories?: DigitalCategory[];
  onOpenAddModal: () => void;
  onEditProduct: (prod: any) => void;
  onDuplicateProduct: (prodId: string) => void;
  onTogglePublishStatus: (prodId: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => void;
  onDeleteProduct: (prodId: string, permanent: boolean) => Promise<void>;
  onSelectProductPreview?: (prod: any) => void;
}

export const AdminDigitalProductsView: React.FC<AdminDigitalProductsViewProps> = ({
  products = [],
  categories = [],
  onOpenAddModal,
  onEditProduct,
  onDuplicateProduct,
  onTogglePublishStatus,
  onDeleteProduct,
  onSelectProductPreview = (_prod: any) => {}
}) => {
  const [digitalProds, setDigitalProds] = useState<any[]>([]);
  const [digitalCats, setDigitalCats] = useState<DigitalCategory[]>(categories);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ id: string; rect: DOMRect } | null>(null);

  const fetchDigitalData = () => {
    fetch('/api/admin/digital-products?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setDigitalProds(data);
      })
      .catch(() => {});

    fetch('/api/digital-categories?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setDigitalCats(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDigitalData();
  }, []);

  const displayList = digitalProds.length > 0 ? digitalProds : (products || []).filter(p => p.productType === 'DIGITAL' || !p.tags?.includes('Store Card'));

  useEffect(() => {
    if (!menuAnchor) return;
    const handleClose = () => setMenuAnchor(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [menuAnchor]);

  const filtered = displayList.filter((p) => {
    const matchesStatus = statusFilter === 'All' || (p.status || 'PUBLISHED') === statusFilter;
    const matchesCategory = categoryFilter === 'All' || p.categoryId === categoryFilter || p.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.shortDescription || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getCategoryName = (catId?: string, catName?: string) => {
    if (catId) {
      const found = digitalCats.find((c) => c.id === catId || c.slug === catId);
      if (found) return found.name;
    }
    return catName || 'Digital Product';
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, prodId: string) => {
    e.stopPropagation();
    if (menuAnchor && menuAnchor.id === prodId) {
      setMenuAnchor(null);
    } else {
      setMenuAnchor({ id: prodId, rect: e.currentTarget.getBoundingClientRect() });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span>Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-emerald-700 font-bold">Commerce</span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Digital Products Catalog
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Manage your digital products, downloads, pricing, and product information.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Table / Grid Toggle */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Digital Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name, tag, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans shadow-2xs transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs font-sans text-xs"
          >
            <option value="All">All Categories</option>
            {digitalCats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs font-sans text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <span className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
          </span>
        </div>
      </div>

      {/* Product List or Empty State */}
      {filtered.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight">
              No digital products yet
            </h3>
            <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
              Create your first digital product to get started.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add First Digital Product</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-3xl shadow-xs">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[11px] bg-slate-50/80">
                <th className="py-4 px-5 font-bold">Product</th>
                <th className="py-4 px-5 font-bold">Category</th>
                <th className="py-4 px-5 font-bold">Price</th>
                <th className="py-4 px-5 font-bold">Status</th>
                <th className="py-4 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prod) => {
                const isFree = prod.price === 0 && (prod.originalPrice === 0 || !prod.originalPrice);
                const hasDiscount = prod.originalPrice && prod.originalPrice > prod.price;
                const discountPct = hasDiscount
                  ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
                  : 0;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Product Cover & Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={prod.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                          alt={prod.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div className="max-w-xs">
                          <strong className="text-slate-900 text-xs font-bold block line-clamp-1">
                            {prod.name}
                          </strong>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {prod.shortDescription || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category & Tags */}
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-mono font-bold border border-slate-200">
                        {getCategoryName(prod.categoryId, prod.category)}
                      </span>
                    </td>

                    {/* Pricing */}
                    <td className="py-4 px-5">
                      {isFree ? (
                        <span className="font-mono font-black text-emerald-600 text-sm">FREE</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            ₹{prod.price}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="font-mono text-xs text-slate-400 line-through">
                                ₹{prod.originalPrice}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-mono font-black text-[10px] border border-rose-200">
                                {discountPct}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                          (prod.status || 'PUBLISHED') === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : prod.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {prod.status || 'PUBLISHED'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-mono">
                        <button
                          onClick={() => onSelectProductPreview(prod)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Preview Product"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditProduct(prod)}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDuplicateProduct(prod.id)}
                          className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                          title="Duplicate Product"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleOpenMenu(e, prod.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="More Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prod) => {
            const isFree = prod.price === 0 && (prod.originalPrice === 0 || !prod.originalPrice);
            const hasDiscount = prod.originalPrice && prod.originalPrice > prod.price;
            const discountPct = hasDiscount
              ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
              : 0;

            return (
              <div
                key={prod.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Cover Image & Badges */}
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-100">
                    <img
                      src={prod.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 text-emerald-400 font-mono font-bold text-[10px] uppercase border border-emerald-500/30 backdrop-blur-xs">
                        Digital Product
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      {isFree ? (
                        <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-xl font-mono font-black text-xs shadow-md">
                          FREE
                        </span>
                      ) : (
                        <div className="bg-slate-950/90 text-white px-2.5 py-1 rounded-xl font-mono font-bold text-xs shadow-md backdrop-blur-xs flex items-center gap-1.5">
                          <span className="text-emerald-400 font-black">₹{prod.price}</span>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">₹{prod.originalPrice}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                        {getCategoryName(prod.categoryId, prod.category)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          (prod.status || 'PUBLISHED') === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {prod.status || 'PUBLISHED'}
                      </span>
                    </div>

                    <strong className="text-slate-900 font-sans font-bold text-sm line-clamp-1 block mt-1">
                      {prod.name}
                    </strong>
                    <p className="text-slate-500 text-xs line-clamp-2 mt-1 leading-relaxed">
                      {prod.shortDescription || 'No description available.'}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs font-mono">
                  <button
                    onClick={() => onEditProduct(prod)}
                    className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingProduct(prod)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Popup Portal for Dropdown Menu */}
      {menuAnchor && (() => {
        const prod = filtered.find((p) => p.id === menuAnchor.id);
        if (!prod) return null;
        const { rect } = menuAnchor;
        const top = rect.bottom + 6;
        const right = Math.max(12, window.innerWidth - rect.right);

        return createPortal(
          <div
            style={{ top: `${top}px`, right: `${right}px` }}
            className="fixed w-52 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-[9999] text-left font-sans text-xs text-slate-800 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onDuplicateProduct(prod.id);
                setMenuAnchor(null);
              }}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition-colors"
            >
              <Copy className="w-4 h-4 text-indigo-600" />
              <span>Duplicate Product</span>
            </button>

            <button
              onClick={() => {
                onTogglePublishStatus(
                  prod.id,
                  (prod.status || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
                );
                setMenuAnchor(null);
              }}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {(prod.status || 'PUBLISHED') === 'PUBLISHED'
                  ? 'Unpublish (Draft)'
                  : 'Publish Product'}
              </span>
            </button>

            <button
              onClick={() => {
                setDeletingProduct(prod);
                setMenuAnchor(null);
              }}
              className="w-full px-4 py-2 hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 font-bold border-t border-slate-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Permanently</span>
            </button>
          </div>,
          document.body
        );
      })()}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingProduct)}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={async (permanent) => {
          if (deletingProduct) {
            await onDeleteProduct(deletingProduct.id, permanent);
            setDigitalProds((prev) => prev.filter((p) => p.id !== deletingProduct.id));
          }
        }}
      />
    </div>
  );
};
