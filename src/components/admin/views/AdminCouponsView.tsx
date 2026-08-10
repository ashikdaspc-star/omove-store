import React, { useState, useEffect } from 'react';
import { Coupon } from '../../../types';
import { Tag, Plus, CheckCircle2, XCircle, Trash2, Edit3, X, RefreshCw } from 'lucide-react';

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
      console.warn('Coupons fetch note:', err);
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

    // Optimistic local update
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
        // Revert on failure
        syncLocalCoupons(prevCoupons);
        alert(`Failed to save coupon: ${data.message || data.error || 'Server error'}`);
        return;
      }
    } catch (err: any) {
      syncLocalCoupons(prevCoupons);
      alert(`Network error saving coupon: ${err.message}`);
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
        console.error('Toggle coupon failed:', data.message || data.error);
      }
    } catch (err: any) {
      syncLocalCoupons(prevCoupons);
      console.error('Toggle coupon network error:', err.message);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon code?')) return;
    const prevCoupons = [...coupons];
    const nextCoupons = coupons.filter((c) => c.id !== id);
    syncLocalCoupons(nextCoupons);

    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        syncLocalCoupons(prevCoupons);
        alert(`Failed to delete coupon: ${data.message || data.error || 'Server error'}`);
      }
    } catch (err: any) {
      syncLocalCoupons(prevCoupons);
      alert(`Network error deleting coupon: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <span>Coupons & Discount Keys Management</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Manage live promo codes, percentage discounts, and fixed monetary coupons.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoupons}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
            title="Refresh Coupons"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
                <th className="pb-3 font-bold">Coupon Code</th>
                <th className="pb-3 font-bold">Discount Value</th>
                <th className="pb-3 font-bold">Min Spend</th>
                <th className="pb-3 font-bold">Description</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((cpn) => (
                <tr key={cpn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5">
                    <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold text-xs">
                      {cpn.code}
                    </span>
                  </td>
                  <td className="py-3.5 font-extrabold text-slate-900">
                    {cpn.discountType === 'percentage' ? `${cpn.discountValue}% OFF` : `₹${cpn.discountValue} FLAT`}
                  </td>
                  <td className="py-3.5 text-slate-600">₹{cpn.minOrderAmount}</td>
                  <td className="py-3.5 text-slate-600 font-sans">{cpn.description}</td>
                  <td className="py-3.5">
                    <button
                      onClick={() => handleToggleCoupon(cpn.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        cpn.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {cpn.isActive ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(cpn.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 text-sm">Create Promo Coupon Code</span>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Coupon Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. OMOVE25"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Special Promo 25% Instant Discount"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                CREATE COUPON CODE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
