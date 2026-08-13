import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw, Search, ShieldCheck, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

interface SupportPaymentRecord {
  id: string;
  name: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
  paidAt?: string;
}

export const AdminSupportPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<SupportPaymentRecord[]>([]);
  const [stats, setStats] = useState<{
    totalSupport: number;
    successfulContributions: number;
    totalContributions: number;
  }>({ totalSupport: 0, successfulContributions: 0, totalContributions: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchSupportPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/support-payments');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setPayments(data.payments || []);
        if (data.stats) {
          setStats(data.stats);
        }
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
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.customerEmail || '').toLowerCase().includes(term) ||
      (p.razorpayPaymentId || '').toLowerCase().includes(term) ||
      (p.razorpayOrderId || '').toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500/20" />
            Support Contributions
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Real-time voluntary customer contributions stored in Cloudflare D1.
          </p>
        </div>

        <button
          onClick={fetchSupportPayments}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            ₹
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">₹{stats.totalSupport.toLocaleString()}</div>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase">Total Support Collected</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.successfulContributions}</div>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase">Successful Contributions</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalContributions}</div>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase">Total Submissions</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by supporter name, payment ID, or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none text-slate-800 placeholder-slate-400 font-mono"
        />
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6 font-bold">Contributor</th>
                <th className="py-3.5 px-6 font-bold">Email</th>
                <th className="py-3.5 px-6 font-bold">Amount</th>
                <th className="py-3.5 px-6 font-bold">Status</th>
                <th className="py-3.5 px-6 font-bold">Razorpay Payment ID</th>
                <th className="py-3.5 px-6 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                    Loading support contributions from D1...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No support contribution records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {payment.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {payment.customerEmail || '-'}
                    </td>
                    <td className="py-4 px-6 font-mono font-extrabold text-emerald-600">
                      ₹{payment.amount}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
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
                    <td className="py-4 px-6 font-mono text-xs text-slate-600 select-all">
                      {payment.razorpayPaymentId || payment.razorpayOrderId || '-'}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : new Date(payment.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
