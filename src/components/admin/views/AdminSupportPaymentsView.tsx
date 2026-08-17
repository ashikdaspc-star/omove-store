import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw, Search, ShieldCheck, DollarSign, CheckCircle2, AlertCircle, Coffee } from 'lucide-react';
import { RazorpayIcon, PaypalIcon } from '../../PaymentMethodCards';

interface SupportPaymentRecord {
  id: string;
  name: string;
  customerEmail?: string;
  amount: number;
  usdAmount?: number;
  currency: string;
  paymentProvider?: 'razorpay' | 'paypal';
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
  paidAt?: string;
}

export const AdminSupportPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<SupportPaymentRecord[]>([]);
  const [stats, setStats] = useState<{
    totalSupport: number;
    totalSupportUsd?: number;
    successfulContributions: number;
    totalContributions: number;
  }>({ totalSupport: 0, totalSupportUsd: 0, successfulContributions: 0, totalContributions: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [gatewayFilter, setGatewayFilter] = useState<'ALL' | 'PAYPAL' | 'RAZORPAY'>('ALL');

  const fetchSupportPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/support-payments');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const rawPayments: SupportPaymentRecord[] = data.payments || [];
        setPayments(rawPayments);

        const successPayments = rawPayments.filter((p) => p.paymentStatus === 'SUCCESS');
        const inrTotal = successPayments
          .filter((p) => p.paymentProvider !== 'paypal' && !p.paypalOrderId)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const usdTotal = successPayments
          .filter((p) => p.paymentProvider === 'paypal' || p.paypalOrderId)
          .reduce((sum, p) => sum + (p.usdAmount || Math.max(3, (p.amount || 0) / 95)), 0);

        setStats({
          totalSupport: inrTotal,
          totalSupportUsd: usdTotal,
          successfulContributions: successPayments.length,
          totalContributions: rawPayments.length
        });
      } else {
        setError(data.error || 'Failed to load support payments from server.');
      }
    } catch (err: any) {
      console.error('Error fetching support payments:', err);
      setError(err.message || 'Error fetching support payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const isPaypal = p.paymentProvider === 'paypal' || !!p.paypalOrderId || !!p.paypalCaptureId;
    if (gatewayFilter === 'PAYPAL' && !isPaypal) return false;
    if (gatewayFilter === 'RAZORPAY' && isPaypal) return false;

    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.customerEmail || '').toLowerCase().includes(term) ||
      (p.razorpayPaymentId || '').toLowerCase().includes(term) ||
      (p.razorpayOrderId || '').toLowerCase().includes(term) ||
      (p.paypalOrderId || '').toLowerCase().includes(term) ||
      (p.paypalCaptureId || '').toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Coffee className="w-6 h-6 text-emerald-600" />
            <span>Buy Me a Coffee & Voluntary Contributions</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Real-time supporter contributions via PayPal USD ($) and Razorpay INR (₹).
          </p>
        </div>

        <button
          onClick={fetchSupportPayments}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Total Received</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              ₹ / $
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            ₹{stats.totalSupport.toLocaleString()}
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 block">
            + ${(stats.totalSupportUsd || 0).toFixed(2)} USD (PayPal)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Verified Contributions</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">{stats.successfulContributions}</div>
          <span className="text-[11px] font-mono text-emerald-700 font-bold block">100% Verified</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">Total Submissions</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">{stats.totalContributions}</div>
          <span className="text-[11px] font-mono text-slate-500 block">All Intent Records</span>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by supporter name, email, PayPal order ID, or Razorpay ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs outline-none text-slate-800 placeholder-slate-400 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold shrink-0">
          <button
            onClick={() => setGatewayFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              gatewayFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setGatewayFilter('PAYPAL')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              gatewayFilter === 'PAYPAL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            <PaypalIcon className="w-3.5 h-3.5" />
            <span>PayPal</span>
          </button>
          <button
            onClick={() => setGatewayFilter('RAZORPAY')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              gatewayFilter === 'RAZORPAY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            <RazorpayIcon className="w-3.5 h-3.5" />
            <span>Razorpay</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6 font-bold">Contributor</th>
                <th className="py-3.5 px-6 font-bold">Email</th>
                <th className="py-3.5 px-6 font-bold">Amount Received</th>
                <th className="py-3.5 px-6 font-bold">Gateway</th>
                <th className="py-3.5 px-6 font-bold">Gateway Transaction ID</th>
                <th className="py-3.5 px-6 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading support contributions...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No support contribution records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const isPaypal = payment.paymentProvider === 'paypal' || !!payment.paypalOrderId || !!payment.paypalCaptureId;
                  const paymentId = payment.paypalCaptureId || payment.paypalOrderId || payment.razorpayPaymentId || payment.razorpayOrderId || '-';
                  const usdVal = payment.usdAmount || Math.max(3, (payment.amount || 0) / 95);

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 font-sans">
                        {payment.name}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-sans">
                        {payment.customerEmail || <span className="text-slate-400 italic">none provided</span>}
                      </td>
                      <td className="py-4 px-6 font-extrabold">
                        {isPaypal ? (
                          <div>
                            <span className="text-blue-700 font-black block">${usdVal.toFixed(2)} USD</span>
                            <span className="text-[10px] text-slate-400">Orig: ₹{payment.amount}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-black">₹{payment.amount} INR</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          isPaypal
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isPaypal ? <PaypalIcon className="w-3.5 h-3.5" /> : <RazorpayIcon className="w-3.5 h-3.5" />}
                          <span>{isPaypal ? 'PayPal USD' : 'Razorpay INR'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 select-all font-bold">
                        {paymentId}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            payment.paymentStatus === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : payment.paymentStatus === 'FAILED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {payment.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
