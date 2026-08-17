import React, { useState } from 'react';
import { Order } from '../../../types';
import { Package, Search, CheckCircle2, Clock, ShieldCheck, Download, Eye, X } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Orders & Fulfillment</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Real-time payment verified customer order records.</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
            {filtered.length} Total Orders
          </span>
        </div>

        {/* Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID, email, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            {['All', 'SUCCESS', 'PENDING'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {st === 'SUCCESS' ? 'Paid' : st === 'PENDING' ? 'Pending' : 'All Orders'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
                <th className="pb-3 font-bold">Order ID</th>
                <th className="pb-3 font-bold">Customer Email</th>
                <th className="pb-3 font-bold">Items</th>
                <th className="pb-3 font-bold">Amount</th>
                <th className="pb-3 font-bold">Payment</th>
                <th className="pb-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">{ord.orderNumber || ord.id}</td>
                  <td className="py-3.5 text-slate-700 font-sans">{ord.customerEmail || ord.customerName}</td>
                  <td className="py-3.5 text-slate-600">
                    {(ord.items || []).map((it) => it?.productName || 'Product').join(', ')}
                  </td>
                  <td className="py-3.5 font-extrabold text-slate-900">
                    {(ord as any).paymentProvider === 'paypal'
                      ? `$${((ord as any).paymentAmountUsd || 0).toFixed(2)} USD`
                      : `₹${ord.total}`}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        ord.paymentStatus === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {ord.paymentStatus === 'SUCCESS' ? 'PAID VERIFIED' : 'PENDING'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <strong className="text-slate-900 text-sm">{selectedOrder.orderNumber}</strong>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Email:</span>
                <strong className="text-slate-900 font-sans">{selectedOrder.customerEmail}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <strong className="text-emerald-700">{selectedOrder.paymentStatus}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Provider:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  (selectedOrder as any).paymentProvider === 'paypal'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}>
                  {(selectedOrder as any).paymentProvider === 'paypal' ? 'PAYPAL' : 'RAZORPAY'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {(selectedOrder as any).paymentProvider === 'paypal' ? 'PayPal Capture ID:' : 'Razorpay Payment ID:'}
                </span>
                <strong className="text-slate-900">
                  {(selectedOrder as any).paymentProvider === 'paypal'
                    ? ((selectedOrder as any).paypalCaptureId || 'N/A')
                    : (selectedOrder.razorpayPaymentId || 'N/A')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Payable:</span>
                <strong className="text-slate-900 text-sm">
                  {(selectedOrder as any).paymentProvider === 'paypal'
                    ? `$${((selectedOrder as any).paymentAmountUsd || 0).toFixed(2)} USD`
                    : `₹${selectedOrder.total}`}
                </strong>
              </div>
            </div>

            <div>
              <strong className="text-slate-900 block mb-2 font-mono">Purchased Products ({selectedOrder.items.length})</strong>
              <div className="space-y-2">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                    <span className="font-bold text-slate-900 font-sans block">{it.productName}</span>
                    <div className="flex justify-between text-[11px] text-emerald-800">
                      <span>Fulfillment: Google Drive Link</span>
                      <span>₹{it.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
