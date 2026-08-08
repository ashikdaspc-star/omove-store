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
  Zap
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Filter EXCLUSIVELY Digital Products (productType === 'DIGITAL')
  const digitalProducts = products.filter((p) => {
    const isDigital = p.productType === 'DIGITAL' || (!p.productType && !p.tags?.includes('Store Card'));
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return isDigital && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-xs flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD DIGITAL PRODUCT</span>
          </button>
        </div>

        {/* Search */}
        <div className="pt-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search digital products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
                <th className="pb-3 font-bold">Digital Product</th>
                <th className="pb-3 font-bold">Version</th>
                <th className="pb-3 font-bold">Price</th>
                <th className="pb-3 font-bold">Access Type</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {digitalProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No Digital Products found. Click <strong>+ ADD DIGITAL PRODUCT</strong> to add one.
                  </td>
                </tr>
              ) : (
                digitalProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                        <div>
                          <strong className="text-slate-900 font-sans text-xs block font-bold">{prod.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">Size: {prod.downloadSize || '50 MB'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-slate-700">{prod.version || 'v2026.1'}</td>
                    <td className="py-3.5 font-extrabold text-slate-900">₹{prod.price}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                        <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                        <span>Instant Access</span>
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (prod.status || 'PUBLISHED') === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {prod.status || 'PUBLISHED'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectProductPreview && onSelectProductPreview(prod)}
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
