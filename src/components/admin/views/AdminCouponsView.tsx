import React, { useState, useEffect } from 'react';
import { Coupon } from '../../../types';
import { Tag, Plus, CheckCircle2, XCircle, Trash2, Edit3, X, RefreshCw, Percent, DollarSign } from 'lucide-react';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';
import { AdminConfirmDialog } from '../ui/AdminConfirmDialog';

export const AdminCouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Delete dialog
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    let fetchedData: Coupon[] | null = null;
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          fetchedData = data;
        }
      }
    } catch (err) {
      console.warn('Coupons fetch notice:', err);
    }

    if (fetchedData) {
      setCoupons(fetchedData);
      try {
        localStorage.setItem('omove_coupons', JSON.stringify(fetchedData));
      } catch (e) {}
    } else {
      try {
        const stored = localStorage.getItem('omove_coupons');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCoupons(parsed);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {}
      setCoupons([
        { id: 'cpn-1', code: 'OMOVE15', discountType: 'percentage', discountValue: 15, minOrderAmount: 0, description: '15% OFF on all orders & services', isActive: true, usageCount: 42 },
        { id: 'cpn-2', code: 'PROMO50', discountType: 'fixed', discountValue: 50, minOrderAmount: 99, description: 'Flat ₹50 Instant Discount', isActive: true, usageCount: 18 },
        { id: 'cpn-3', code: 'ASHIK20', discountType: 'percentage', discountValue: 20, minOrderAmount: 199, description: 'VIP 20% OFF Special Code', isActive: true, usageCount: 9 }
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const syncLocalCoupons = (updatedList: Coupon[]) => {
    setCoupons(updatedList);
    try {
      localStorage.setItem('omove_coupons', JSON.stringify(updatedList));
    } catch (e) {}
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      id: `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue) || 10,
      minOrderAmount: Number(minOrderAmount) || 0,
      description: description || `Discount Code ${code.trim().toUpperCase()}`,
      isActive,
      usageCount: 0
    };

    const prevCoupons = [...coupons];
    const nextCoupons = [newCoupon, ...coupons];
    syncLocalCoupons(nextCoupons);

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        syncLocalCoupons(prevCoupons);
        console.error('Failed to save coupon:', data.message || data.error);
        return;
      }
    } catch (err: any) {
      syncLocalCoupons(prevCoupons);
      console.error('Network error saving coupon:', err.message);
      return;
    }

    setShowModal(false);
    setCode('');
    setDescription('');
  };

  const handleToggleCoupon = async (id: string) => {
    const prevCoupons = [...coupons];
    const nextCoupons = coupons.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    syncLocalCoupons(nextCoupons);

    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        syncLocalCoupons(prevCoupons);
      }
    } catch (err: any) {
      syncLocalCoupons(prevCoupons);
    }
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    const id = couponToDelete.id;
    const prevCoupons = [...coupons];
    const nextCoupons = coupons.filter((c) => c.id !== id);
    syncLocalCoupons(nextCoupons);

    try {
      await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      setCouponToDelete(null);
    } catch (err) {
      syncLocalCoupons(prevCoupons);
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
              Coupons & Discounts
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {coupons.length} active promo keys
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Create promotional discount keys for store products and digital downloads.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold bg-slate-50/75">
                <th className="py-3.5 px-4 font-semibold">Promo Code</th>
                <th className="py-3.5 px-4 font-semibold">Discount Type</th>
                <th className="py-3.5 px-4 font-semibold">Value</th>
                <th className="py-3.5 px-4 font-semibold">Min Order</th>
                <th className="py-3.5 px-4 font-semibold">Usage</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    No discount coupons found. Create your first coupon above.
                  </td>
                </tr>
              ) : (
                coupons.map((cpn) => (
                  <tr key={cpn.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>{cpn.code}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-sans capitalize">
                      {cpn.discountType}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {cpn.discountType === 'percentage' ? `${cpn.discountValue}% OFF` : `₹${cpn.discountValue} FLAT`}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {cpn.minOrderAmount ? `₹${cpn.minOrderAmount}` : 'No Minimum'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {cpn.usageCount || 0} redeemed
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(cpn.id)}
                        className="transition-opacity hover:opacity-80 cursor-pointer"
                        title="Click to toggle status"
                      >
                        <AdminStatusBadge status={cpn.isActive ? 'ACTIVE' : 'DRAFT'} />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setCouponToDelete(cpn)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl text-xs font-sans text-slate-700"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm font-sans">Create Promotional Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">PROMO CODE *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OMOVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-xs uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">TYPE</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">VALUE *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">MINIMUM ORDER AMOUNT (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">DESCRIPTION</label>
                <input
                  type="text"
                  placeholder="Special launch discount"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={Boolean(couponToDelete)}
        title="Delete Coupon?"
        description={`Are you sure you want to delete promo code "${couponToDelete?.code}"?`}
        confirmLabel="Delete Coupon"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCouponToDelete(null)}
      />
    </div>
  );
};
