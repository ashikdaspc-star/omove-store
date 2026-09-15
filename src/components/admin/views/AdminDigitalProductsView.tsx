import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DigitalCategory, Product } from '../../../types';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';
import { AdminConfirmDialog } from '../ui/AdminConfirmDialog';
import {
  Sparkles,
  Search,
  Plus,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Archive,
  MoreVertical,
  LayoutGrid,
  List,
  FolderTree,
  ExternalLink,
  Key
} from 'lucide-react';

interface AdminDigitalProductsViewProps {
  products: any[];
  categories?: DigitalCategory[];
  onOpenAddModal: () => void;
  onEditProduct: (prod: any) => void;
  onDuplicateProduct: (prodId: string) => void;
  onTogglePublishStatus: (prodId: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => void;
  onDeleteProduct: (prodId: string, permanent?: boolean) => Promise<void> | void;
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
  onSelectProductPreview = () => {}
}) => {
  const [digitalProds, setDigitalProds] = useState<any[]>([]);
  const [digitalCats, setDigitalCats] = useState<DigitalCategory[]>(categories);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Delete modal state
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Portal dropdown state
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
  }, [products]);

  const displayList = useMemo(() => {
    const map = new Map<string, any>();
    if (Array.isArray(products)) {
      products
        .filter((p) => p.productType === 'DIGITAL' || (p.id && p.id.startsWith('dig')))
        .forEach((p) => {
          if (p && p.id) map.set(p.id, p);
        });
    }
    if (Array.isArray(digitalProds)) {
      digitalProds.forEach((p) => {
        if (p && p.id) map.set(p.id, p);
      });
    }
    return Array.from(map.values());
  }, [products, digitalProds]);

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
    const matchesCategory =
      categoryFilter === 'All' || p.categoryId === categoryFilter || p.category === categoryFilter;
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
    return catName || 'Digital Software';
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, prodId: string) => {
    e.stopPropagation();
    if (menuAnchor && menuAnchor.id === prodId) {
      setMenuAnchor(null);
    } else {
      setMenuAnchor({ id: prodId, rect: e.currentTarget.getBoundingClientRect() });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await onDeleteProduct(deletingProduct.id, false);
      setDeletingProduct(null);
      fetchDigitalData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              Digital Products Catalog
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
              {filtered.length} downloads
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage instant digital files, license keys, screenshots, and private R2 storage assets.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Switcher */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center gap-1 font-sans text-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Digital Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs font-sans">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search digital products by name, tag, or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-500 text-xs font-medium font-sans"
          >
            <option value="All">All Digital Categories</option>
            {digitalCats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            {['All', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'All' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-slate-200 space-y-3 shadow-xs">
          <Sparkles className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">No Digital Products Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
            Try adjusting your search query or filters, or upload a new digital product with R2 assets.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Digital Product</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Data Table View */
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold bg-slate-50/75">
                  <th className="py-3.5 px-4 font-semibold">Product</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Access</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Product Cell */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image || prod.previewImage || '/logo.png'}
                          alt={prod.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 bg-slate-50 border border-slate-200"
                        />
                        <div className="min-w-0 max-w-xs">
                          <strong className="block text-slate-900 font-sans text-xs truncate font-semibold group-hover:text-emerald-700 transition-colors">
                            {prod.name}
                          </strong>
                          <span className="text-[11px] text-slate-400 font-mono block truncate mt-0.5">
                            ID: {prod.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category Cell */}
                    <td className="py-3.5 px-4 text-slate-600 font-sans">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                        {getCategoryName(prod.categoryId, prod.category)}
                      </span>
                    </td>

                    {/* Price Cell */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">₹{prod.price}</div>
                      {prod.originalPrice && prod.originalPrice > prod.price && (
                        <div className="text-[10px] text-slate-400 line-through">
                          ₹{prod.originalPrice}
                        </div>
                      )}
                    </td>

                    {/* Access Cell */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono bg-purple-50 text-purple-700 border border-purple-200/80">
                        <Key className="w-2.5 h-2.5" />
                        <span>{prod.instantAccess ? 'Instant' : prod.downloadSize || 'Instant Key'}</span>
                      </span>
                    </td>

                    {/* Status Cell */}
                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={prod.status || 'PUBLISHED'} type="product" />
                    </td>

                    {/* Actions Cell */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, prod.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        aria-label="Actions menu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 group font-sans"
            >
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
                  <img
                    src={prod.image || prod.previewImage || '/logo.png'}
                    alt={prod.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <AdminStatusBadge status={prod.status || 'PUBLISHED'} type="product" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm truncate font-sans group-hover:text-emerald-700 transition-colors">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-sans leading-relaxed">
                    {prod.shortDescription || prod.description || 'Digital download package.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between font-sans text-xs">
                <div>
                  <strong className="text-slate-900 text-sm font-bold">₹{prod.price}</strong>
                  {prod.originalPrice && prod.originalPrice > prod.price && (
                    <span className="text-[10px] text-slate-400 line-through ml-1.5">
                      ₹{prod.originalPrice}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditProduct(prod)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Edit Product"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateProduct(prod.id)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingProduct(prod)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Portal Menu */}
      {menuAnchor &&
        createPortal(
          (() => {
            const activeProduct = displayList.find((p) => p.id === menuAnchor.id);
            if (!activeProduct) return null;

            return (
              <div
                style={{
                  position: 'fixed',
                  top: `${menuAnchor.rect.bottom + 4}px`,
                  left: `${Math.min(menuAnchor.rect.right - 180, window.innerWidth - 190)}px`,
                  zIndex: 9999
                }}
                className="w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 text-xs font-sans text-slate-700 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onEditProduct(activeProduct);
                    setMenuAnchor(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Edit Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDuplicateProduct(activeProduct.id);
                    setMenuAnchor(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span>Duplicate</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {activeProduct.status !== 'PUBLISHED' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePublishStatus(activeProduct.id, 'PUBLISHED');
                      setMenuAnchor(null);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-emerald-50 flex items-center gap-2 text-emerald-700 transition-colors font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Publish Live</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePublishStatus(activeProduct.id, 'DRAFT');
                      setMenuAnchor(null);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-amber-50 flex items-center gap-2 text-amber-700 transition-colors font-semibold"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Revert to Draft</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setDeletingProduct(activeProduct);
                    setMenuAnchor(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>
              </div>
            );
          })(),
          document.body
        )}

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(deletingProduct)}
        title="Delete Digital Product?"
        description={`Are you sure you want to delete "${deletingProduct?.name}"? This will remove the digital catalog record from D1.`}
        confirmLabel="Delete Product"
        cancelLabel="Keep Product"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
};
