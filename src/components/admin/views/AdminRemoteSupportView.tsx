import React, { useState, useEffect } from 'react';
import { RemoteBooking } from '../../../types';
import { Headphones, CheckCircle2, Clock, Monitor, User, Trash2, RefreshCw } from 'lucide-react';

interface AdminRemoteSupportViewProps {
  bookings: RemoteBooking[];
  onUpdateBooking?: (booking: RemoteBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

export const AdminRemoteSupportView: React.FC<AdminRemoteSupportViewProps> = ({
  bookings = [],
  onUpdateBooking,
  onDeleteBooking
}) => {
  const [serverBookings, setServerBookings] = useState<RemoteBooking[]>([]);

  const fetchBookings = () => {
    fetch('/api/bookings?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setServerBookings(data);
      })
      .catch((err) => console.warn('Admin bookings fetch note:', err));
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 8000);
    return () => clearInterval(interval);
  }, []);

  const displayBookings = serverBookings.length > 0 ? serverBookings : bookings;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Live Remote Support Queue</h2>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Manage incoming AnyDesk remote PC inspection and repair requests in real-time.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
            {displayBookings.length} Active Bookings
          </span>
        </div>
      </div>

      {/* Bookings Queue Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        {displayBookings.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 font-mono">No Active Remote Support Bookings</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              New customer remote support requests submitted via the store will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
                  <th className="pb-3 font-bold">Booking ID</th>
                  <th className="pb-3 font-bold">Customer Info</th>
                  <th className="pb-3 font-bold">Service & Issue</th>
                  <th className="pb-3 font-bold">Remote Tool & ID</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">
                      <div className="text-emerald-700">{bk.bookingNumber || bk.id}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {bk.createdAt ? new Date(bk.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-700 font-sans">
                      <div className="font-bold text-slate-900">{bk.customerName || 'Customer'}</div>
                      <div className="text-xs text-slate-500 font-mono">{bk.email}</div>
                      {bk.phone && <div className="text-[10px] text-slate-400 font-mono">{bk.phone}</div>}
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-800">{bk.serviceTitle || 'Remote PC Support'}</div>
                      <div className="text-[11px] text-slate-500 max-w-xs line-clamp-1">{bk.problemDescription || bk.issueCategory || 'Windows Fix'}</div>
                    </td>
                    <td className="py-3.5 font-bold text-emerald-700">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{bk.remoteTool || 'AnyDesk'}: {bk.remoteId || 'N/A'}</span>
                      </div>
                      {bk.remotePassword && (
                        <div className="text-[10px] text-slate-400 font-normal">Pass: {bk.remotePassword}</div>
                      )}
                    </td>
                    <td className="py-3.5 font-bold">
                      {(bk as any).paymentProvider === 'paypal' || (bk as any).paypalOrderId ? (
                        <div>
                          <span className="text-blue-700 font-black block">
                            ${((bk as any).paymentAmountUsd || Math.max(3, (bk.amount || 39) / 95)).toFixed(2)} USD
                          </span>
                          <span className="text-[10px] text-slate-400">Orig: ₹{bk.amount || 39} INR</span>
                        </div>
                      ) : (
                        <span className="text-slate-900">₹{bk.amount !== undefined ? bk.amount : 39} INR</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="space-y-1">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-block ${
                            bk.status === 'Resolved' || bk.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bk.status === 'In Progress'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : bk.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {bk.status || 'Technician Assigned'}
                        </span>
                        {((bk as any).paymentProvider === 'paypal' || (bk as any).paypalOrderId) && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 block w-fit">
                            PayPal Paid
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {onUpdateBooking && (
                          <select
                            value={bk.status || 'Technician Assigned'}
                            onChange={(e) => {
                              const updated = { ...bk, status: e.target.value as any };
                              onUpdateBooking(updated);
                              setServerBookings((prev) => prev.map((b) => (b.id === bk.id ? updated : b)));
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Technician Assigned">Technician Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                        {onDeleteBooking && (
                          <button
                            onClick={() => {
                              onDeleteBooking(bk.id);
                              setServerBookings((prev) => prev.filter((b) => b.id !== bk.id));
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
