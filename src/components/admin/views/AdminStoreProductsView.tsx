import React, { useState } from 'react';
import { Product } from '../../../types';
import { CATEGORIES } from '../../../data/mockData';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import {
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Eye,
  CheckCircle2,
  Archive,
  ShoppingBag,
  LayoutGrid,
  List,
  Tag,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

interface AdminStoreProductsViewProps {
  products: Product[];
  onOpenAddModal: () => void;
  onEditProduct: (prod: Product) => void;
  onDuplicateProduct: (prodId: string) => void;
  onTogglePublishStatus: (prodId: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => void;
  onDeleteProduct: (prodId: string, permanent: boolean) => Promise<void>;
  onSelectProductPreview: (prod: Product) => void;
}

export const AdminStoreProductsView: React.FC<AdminStoreProductsViewProps> = ({
  products,
  onOpenAddModal,
  onEditProduct,
  onDuplicateProduct,
  onTogglePublishStatus,
  onDeleteProduct,
  onSelectProductPreview
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Strict Filter: STORE PRODUCTS ONLY
  const storeProductsOnly = products.filter(
    (p) => p.productType === 'STORE' || (!p.productType && p.tags?.includes('Store Card'))
  );

  const filtered = storeProductsOnly.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || (p.status || 'PUBLISHED') === statusFilter;
    const matchesQuery =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Clean Single Catalog Container */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <span>Store Products Catalog</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Manage, edit, publish, duplicate, or delete store product cards.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Switcher Toggle */}
            <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 font-mono text-xs">
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
            </div>

            {/* Add Card Button */}
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-xs flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD STORE PRODUCT</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search store products by name, description, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
            >
              <option value="All">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
              <option value="ARCHIVED">Archived Only</option>
            </select>

            <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              {filtered.length} Store Products
            </span>
          </div>
        </div>

        {/* CATALOG BODY */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-sans space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No Store Products match your filter criteria.</p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono font-bold text-xs shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Store Product</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Product Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((prod) => (
              <div
                key={prod.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Card Header Image & Badges */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 border border-slate-100">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white font-mono font-bold text-[10px] uppercase border border-slate-700/60">
                        {prod.category}
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

                  {/* Specs Pill List */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {prod.licenseType || 'Lifetime License'}
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
        ) : (
          /* Table List View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-bold">Product</th>
                  <th className="pb-3 font-bold">Category</th>
                  <th className="pb-3 font-bold">Price</th>
                  <th className="pb-3 font-bold">License</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                        <div>
                          <strong className="text-slate-900 text-xs font-sans font-bold block line-clamp-1">{prod.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {prod.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-slate-700">{prod.category}</td>
                    <td className="py-3.5 font-extrabold text-slate-900">₹{prod.price}</td>
                    <td className="py-3.5 text-slate-600">{prod.licenseType || 'Lifetime License'}</td>
                    <td className="py-3.5">
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
                    <td className="py-3.5 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectProductPreview(prod)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
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
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingProduct(prod)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
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
