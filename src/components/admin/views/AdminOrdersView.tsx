import React, { useState } from 'react';
import { Order } from '../../../types';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Eye,
  X,
  CreditCard,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

interface AdminOrdersViewProps {
  orders: Order[];
  onOpenInvoiceModal?: (order: Order) => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({ orders = [], onOpenInvoiceModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = (orders || []).filter((ord) => {
    if (!ord) return false;
    const matchesStatus = statusFilter === 'All' || ord.paymentStatus === statusFilter;
    const matchesQuery =
      !searchQuery ||
      (ord.orderNumber || ord.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.customerEmail && ord.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              Orders & Fulfillment
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              {filtered.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Real-time server records for Razorpay INR & PayPal USD transactions and digital license fulfillment.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs font-sans">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, customer email, or buyer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
          {['All', 'SUCCESS', 'PENDING'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {st === 'SUCCESS' ? 'Paid Verified' : st === 'PENDING' ? 'Pending' : 'All Orders'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold bg-slate-50/75">
                <th className="py-3.5 px-4 font-semibold">Order ID</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Items</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Payment</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    No orders match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {ord.orderNumber || ord.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-sans">{ord.customerName || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{ord.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-sans max-w-xs truncate">
                      {(ord.items || []).map((it) => it?.productName || 'Product').join(', ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {(ord as any).paymentProvider === 'paypal'
                        ? `$${((ord as any).paymentAmountUsd || 0).toFixed(2)} USD`
                        : `₹${ord.total}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={ord.paymentStatus || 'PENDING'} type="payment" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Slide-Over Drawer Modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl text-xs font-sans text-slate-700 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    {selectedOrder.orderNumber || selectedOrder.id}
                  </h3>
                  <span className="text-[10px] text-slate-400">Order Inspection Drawer</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Payment Meta */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900 font-sans">{selectedOrder.customerName || 'Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-emerald-600 font-semibold">{selectedOrder.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <AdminStatusBadge status={selectedOrder.paymentStatus || 'PENDING'} type="payment" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {(selectedOrder as any).paymentProvider === 'paypal'
                    ? `$${((selectedOrder as any).paymentAmountUsd || 0).toFixed(2)} USD`
                    : `₹${selectedOrder.total} INR`}
                </span>
              </div>
              {selectedOrder.paymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Transaction ID:</span>
                  <span className="text-slate-700 font-mono truncate max-w-[200px]">{selectedOrder.paymentId}</span>
                </div>
              )}
            </div>

            {/* Items Purchased */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Purchased Items ({selectedOrder.items?.length || 0})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <strong className="block text-slate-900 font-sans text-xs">{it?.productName || 'Product Item'}</strong>
                      <span className="text-[10px] text-slate-400">Qty: {it?.quantity || 1}</span>
                    </div>
                    <span className="font-bold text-slate-900">₹{it?.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              {onOpenInvoiceModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenInvoiceModal(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-sans text-xs font-semibold transition-colors cursor-pointer"
                >
                  Print / View Invoice
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
