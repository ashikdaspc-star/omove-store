import React, { useState } from 'react';
import { Product } from '../../../types';
import { AlertTriangle, X, Trash2, Archive } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (permanent: boolean) => Promise<void>;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !product) return null;

  const isDigital = product.productType === 'DIGITAL';
  const typeLabel = isDigital ? 'Digital Product' : 'Store Product';

  const handleConfirm = async (permanent: boolean) => {
    setIsDeleting(true);
    try {
      await onConfirm(permanent);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Delete {typeLabel}?</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 font-sans">
          <p className="text-slate-600 text-xs">
            Are you sure you want to delete this {typeLabel.toLowerCase()}? This action will remove it from the catalog.
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Item</span>
            <strong className="text-slate-900 text-sm font-sans font-bold block">{product.name}</strong>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>ID: {product.id}</span>
              <span className="font-bold text-slate-900">₹{product.price}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>Purchase Safeguard:</strong> If this product has historical customer orders, it will be automatically <strong>ARCHIVED</strong> to protect customer purchase history and download keys.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => handleConfirm(false)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs flex items-center gap-1.5"
          >
            <Archive className="w-4 h-4" />
            <span>Archive Product</span>
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => handleConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md flex items-center gap-1.5"
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
