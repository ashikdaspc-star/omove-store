import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../../../types';
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
  Zap,
  LayoutGrid,
  List,
  HardDrive,
  ShieldCheck
} from 'lucide-react';

interface AdminDigitalProductsViewProps {
  products: Product[];
  onOpenAddModal: () => void;
  onEditProduct: (prod: Product) => void;
  onDuplicateProduct: (prodId: string) => void;
  onTogglePublishStatus: (prodId: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => void;
  onDeleteProduct: (prodId: string, permanent: boolean) => Promise<void>;
  onSelectProductPreview?: (prod: Product) => void;
}

export const AdminDigitalProductsView: React.FC<AdminDigitalProductsViewProps> = ({
  products,
  onOpenAddModal,
  onEditProduct,
  onDuplicateProduct,
  onTogglePublishStatus,
  onDeleteProduct,
  onSelectProductPreview = (_prod: Product) => {}
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Portal dropdown menu state
  const [menuAnchor, setMenuAnchor] = useState<{ id: string; rect: DOMRect } | null>(null);

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

  // Filter EXCLUSIVELY Digital Products (productType === 'DIGITAL')
  const digitalProductsOnly = products.filter(
    (p) => p.productType === 'DIGITAL' || (!p.productType && !p.tags?.includes('Store Card'))
  );

  const filtered = digitalProductsOnly.filter((p) => {
    const matchesStatus = statusFilter === 'All' || (p.status || 'PUBLISHED') === statusFilter;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      {/* Top Banner & Header Actions — Directly on Admin Background */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>DIGITAL PRODUCTS CATALOG MANAGEMENT</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Digital Products & Instant Keys</h2>
          <p className="text-xs text-slate-500 font-sans">
            Dedicated catalog management for software keys, instant access digital files, and version updates.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Switcher Toggle */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Add Digital Product Button */}
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD DIGITAL PRODUCT</span>
          </button>
        </div>
      </div>

      {/* Search & Status Filter Strip — Directly on Admin Background */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search digital products by name, description, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
          >
            <option value="All">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Drafts Only</option>
            <option value="ARCHIVED">Archived Only</option>
          </select>

          <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            {filtered.length} Digital Products
          </span>
        </div>
      </div>

      {/* CATALOG BODY — Natural Height, Directly on Admin Background */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-sans space-y-3 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
          <Sparkles className="w-10 h-10 mx-auto text-emerald-600/60" />
          <p className="text-sm font-medium text-slate-600">No Digital Products match your filter criteria.</p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono font-bold text-xs shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Digital Product</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Digital Product Table — Natural Height with No Clipping & No Extra Padding */
        <div className="w-full">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-2 font-bold">Digital Product</th>
                <th className="py-3 px-2 font-bold">Version</th>
                <th className="py-3 px-2 font-bold">Price</th>
                <th className="py-3 px-2 font-bold">Access Type</th>
                <th className="py-3 px-2 font-bold">Status</th>
                <th className="py-3 px-2 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-100/70 transition-colors group">
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-3">
                      <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div>
                        <strong className="text-slate-900 text-xs font-sans font-bold block line-clamp-1">{prod.name}</strong>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5">
                          <span className="text-slate-400">ID: {prod.id}</span>
                          {prod.subCategory && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase">
                              {prod.subCategory}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 font-bold text-emerald-700">{prod.version || 'v2026.1'}</td>
                  <td className="py-3.5 px-2 font-extrabold text-slate-900">₹{prod.price}</td>
                  <td className="py-3.5 px-2 text-slate-600">{prod.licenseType || 'Instant Digital Key'}</td>
                  <td className="py-3.5 px-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
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
                  <td className="py-3.5 px-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectProductPreview(prod)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditProduct(prod)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDuplicateProduct(prod.id)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                        title="Duplicate Product"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleOpenMenu(e, prod.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          menuAnchor?.id === prod.id
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title="More Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Card Header Image & Badges */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] uppercase border border-emerald-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      {prod.version || 'v2026.1'}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono shadow-xs ${
                        (prod.status || 'PUBLISHED') === 'PUBLISHED'
                          ? 'bg-emerald-600 text-white'
                          : prod.status === 'DRAFT'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {prod.status || 'PUBLISHED'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs shadow-md">
                    ₹{prod.price}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                  <strong className="text-slate-900 font-sans font-bold text-sm line-clamp-1 block group-hover:text-emerald-700 transition-colors">
                    {prod.name}
                  </strong>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                    {prod.shortDescription}
                  </p>
                </div>

                {/* Details Pill List */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {prod.licenseType || 'Instant Digital Key'}
                  </span>
                  {prod.downloadSize && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      {prod.downloadSize}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs font-mono">
                <button
                  onClick={() => onSelectProductPreview(prod)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition-colors"
                  title="Preview Product"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Preview</span>
                </button>

                <button
                  onClick={() => onEditProduct(prod)}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1 transition-colors"
                  title="Edit Product"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => onDuplicateProduct(prod.id)}
                  className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1 transition-colors"
                  title="Duplicate Card"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                </button>

                <button
                  onClick={() => setDeletingProduct(prod)}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold flex items-center gap-1 transition-colors"
                  title="Delete Product Card"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REACT PORTAL ACTIONS POPUP DROPDOWN (Renders at document.body with z-[9999], completely unclipped & auto-flipped) */}
      {menuAnchor && (() => {
        const prod = filtered.find((p) => p.id === menuAnchor.id);
        if (!prod) return null;
        const { rect } = menuAnchor;
        const popupHeight = 180;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < popupHeight && rect.top > popupHeight;

        const top = openUpward ? rect.top - popupHeight - 6 : rect.bottom + 6;
        const right = Math.max(12, window.innerWidth - rect.right);

        return createPortal(
          <div
            style={{ top: `${top}px`, right: `${right}px` }}
            className="fixed w-52 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-[9999] animate-fadeIn text-left font-sans text-xs text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onDuplicateProduct(prod.id);
                setMenuAnchor(null);
              }}
              className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition-colors"
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
              className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{(prod.status || 'PUBLISHED') === 'PUBLISHED' ? 'Unpublish (Draft)' : 'Publish'}</span>
            </button>

            <button
              onClick={() => {
                onDeleteProduct(prod.id, false);
                setMenuAnchor(null);
              }}
              className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-amber-700 font-medium transition-colors"
            >
              <Archive className="w-4 h-4 text-amber-600" />
              <span>Archive Product</span>
            </button>

            <button
              onClick={() => {
                setDeletingProduct(prod);
                setMenuAnchor(null);
              }}
              className="w-full px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 font-semibold transition-colors border-t border-slate-100"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
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
          }
        }}
      />
    </div>
  );
};
