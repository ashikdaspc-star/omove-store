import React, { useState } from 'react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Clean Single Container with Premium Dark Theme */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 text-white">
        {/* Top Banner & Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>DIGITAL PRODUCTS CATALOG MANAGEMENT</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Digital Products & Instant Keys</h2>
            <p className="text-xs text-slate-300 font-sans">
              Dedicated catalog management for software keys, instant access digital files, and version updates.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Switcher */}
            <div className="p-1 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {/* Add Digital Product Button */}
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-xs flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD DIGITAL PRODUCT</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search digital products by name, description, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="All">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
              <option value="ARCHIVED">Archived Only</option>
            </select>

            <span className="px-3.5 py-2 rounded-xl bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-500/40">
              {filtered.length} Digital Products
            </span>
          </div>
        </div>

        {/* CATALOG BODY */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-sans space-y-3 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
            <Sparkles className="w-10 h-10 mx-auto text-emerald-400/60" />
            <p className="text-sm font-medium text-slate-300">No Digital Products match your filter criteria.</p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono font-bold text-xs shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Digital Product</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((prod) => (
              <div
                key={prod.id}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Card Header Image & Badges */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 backdrop-blur-xs text-emerald-300 font-mono font-bold text-[10px] uppercase border border-emerald-500/40 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
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
                    <strong className="text-white font-sans font-bold text-sm line-clamp-1 block group-hover:text-emerald-400 transition-colors">
                      {prod.name}
                    </strong>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      {prod.shortDescription}
                    </p>
                  </div>

                  {/* Details Pill List */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {prod.licenseType || 'Instant Digital Key'}
                    </span>
                    {prod.downloadSize && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-slate-400" />
                        {prod.downloadSize}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => onSelectProductPreview(prod)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1 transition-colors"
                    title="Preview Product"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  <button
                    onClick={() => onEditProduct(prod)}
                    className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 transition-colors"
                    title="Edit Product"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onDuplicateProduct(prod.id)}
                    className="p-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 font-bold flex items-center gap-1 transition-colors"
                    title="Duplicate Card"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => setDeletingProduct(prod)}
                    className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1 transition-colors"
                    title="Delete Product Card"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="pb-3 font-bold">Digital Product</th>
                  <th className="pb-3 font-bold">Version</th>
                  <th className="pb-3 font-bold">Price</th>
                  <th className="pb-3 font-bold">Access Type</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-950/60 transition-colors group">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0" />
                        <div>
                          <strong className="text-white text-xs font-sans font-bold block line-clamp-1">{prod.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {prod.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-emerald-400">{prod.version || 'v2026.1'}</td>
                    <td className="py-3.5 font-extrabold text-white">₹{prod.price}</td>
                    <td className="py-3.5 text-slate-300">{prod.licenseType || 'Instant Digital Key'}</td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          (prod.status || 'PUBLISHED') === 'PUBLISHED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : prod.status === 'DRAFT'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {prod.status || 'PUBLISHED'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectProductPreview(prod)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditProduct(prod)}
                          className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDuplicateProduct(prod.id)}
                          className="p-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingProduct(prod)}
                          className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
