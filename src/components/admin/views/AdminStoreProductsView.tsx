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
  ShoppingBag
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Delete modal state
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
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <span>Store Products Catalog</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Manage, publish, duplicate, or edit store software products.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-xs flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ ADD STORE PRODUCT</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search store products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
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

            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              {filtered.length} Store Products
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No Store Products found. Click <strong>+ ADD STORE PRODUCT</strong> to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectProductPreview(prod)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditProduct(prod)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setOpenMenuId(openMenuId === prod.id ? null : prod.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === prod.id && (
                          <div
                            className="absolute right-0 top-10 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn text-left font-sans text-xs"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <button
                              onClick={() => onDuplicateProduct(prod.id)}
                              className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                            >
                              <Copy className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Duplicate</span>
                            </button>

                            <button
                              onClick={() =>
                                onTogglePublishStatus(
                                  prod.id,
                                  (prod.status || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
                                )
                              }
                              className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{(prod.status || 'PUBLISHED') === 'PUBLISHED' ? 'Unpublish (Draft)' : 'Publish'}</span>
                            </button>

                            <button
                              onClick={() => onDeleteProduct(prod.id, false)}
                              className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-amber-700 font-medium"
                            >
                              <Archive className="w-3.5 h-3.5 text-amber-600" />
                              <span>Archive Product</span>
                            </button>

                            <button
                              onClick={() => setDeletingProduct(prod)}
                              className="w-full px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium border-t border-slate-100"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
