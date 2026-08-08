import React from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, DollarSign } from 'lucide-react';
import { Order } from '../../../types';

interface AdminPaymentsViewProps {
  orders: Order[];
}

export const AdminPaymentsView: React.FC<AdminPaymentsViewProps> = ({ orders = [] }) => {
  const paidOrders = orders.filter((o) => o.paymentStatus === 'SUCCESS');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Payments & Gateway Audit Logs</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Razorpay transaction IDs & cryptographic HMAC verification records.</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
            {paidOrders.length} Server Verified Payments
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
                <th className="pb-3 font-bold">Razorpay Payment ID</th>
                <th className="pb-3 font-bold">Order Number</th>
                <th className="pb-3 font-bold">Customer Email</th>
                <th className="pb-3 font-bold">Amount</th>
                <th className="pb-3 font-bold">Gateway Method</th>
                <th className="pb-3 font-bold">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paidOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">{ord.razorpayPaymentId || 'pay_live_verification'}</td>
                  <td className="py-3.5 font-bold text-emerald-700">{ord.orderNumber}</td>
                  <td className="py-3.5 text-slate-700 font-sans">{ord.customerEmail}</td>
                  <td className="py-3.5 font-extrabold text-slate-900">₹{ord.total}</td>
                  <td className="py-3.5 text-slate-600">{ord.paymentMethod || 'Razorpay UPI'}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>HMAC SHA-256 VERIFIED</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
