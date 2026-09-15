import React, { useState, useEffect } from 'react';
import { RemoteBooking } from '../../../types';
import { Headphones, CheckCircle2, Clock, Monitor, User, Trash2, RefreshCw } from 'lucide-react';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';
import { AdminConfirmDialog } from '../ui/AdminConfirmDialog';

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
  const [bookingToDelete, setBookingToDelete] = useState<RemoteBooking | null>(null);

  const fetchBookings = () => {
    fetch('/api/bookings?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setServerBookings(data);
      })
      .catch((err) => console.warn('Admin bookings fetch notice:', err));
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const displayBookings = serverBookings.length > 0 ? serverBookings : bookings;

  const handleConfirmDelete = () => {
    if (!bookingToDelete || !onDeleteBooking) return;
    onDeleteBooking(bookingToDelete.id);
    setBookingToDelete(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              Live Remote Support Queue
            </h2>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Manage incoming AnyDesk remote PC inspection and repair sessions in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBookings}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-mono text-xs font-semibold border border-emerald-200">
            {displayBookings.length} Active Bookings
          </span>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        {displayBookings.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Monitor className="w-10 h-10 mx-auto text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">No Active Remote Support Bookings</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
              New customer remote support requests submitted via the store will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold bg-slate-50/75">
                  <th className="py-3.5 px-4 font-semibold">Booking ID</th>
                  <th className="py-3.5 px-4 font-semibold">Customer Info</th>
                  <th className="py-3.5 px-4 font-semibold">Service & Issue</th>
                  <th className="py-3.5 px-4 font-semibold">Remote Tool & ID</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono">
                      {bk.bookingNumber || bk.id}
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {bk.createdAt ? new Date(bk.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-sans">{bk.customerName || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{bk.email}</div>
                      {bk.phone && <div className="text-[10px] text-slate-400 font-mono">{bk.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-sans">{bk.serviceTitle || 'Remote Support'}</div>
                      <div className="text-[11px] text-slate-500 max-w-xs truncate font-sans">
                        {bk.problemDescription || bk.issueCategory || 'PC Fix'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-cyan-700">
                        <Monitor className="w-3.5 h-3.5 shrink-0" />
                        <span>{bk.remoteTool || 'AnyDesk'}: {bk.remoteId || 'N/A'}</span>
                      </div>
                      {bk.remotePassword && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Pass: {bk.remotePassword}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {(bk as any).paymentProvider === 'paypal' ? (
                        <span className="text-blue-600 font-mono">
                          ${((bk as any).paymentAmountUsd || ((bk.amount || 39) / 95)).toFixed(2)} USD
                        </span>
                      ) : (
                        <span className="font-mono">₹{bk.amount !== undefined ? bk.amount : 39} INR</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={bk.status || 'In Progress'} type="booking" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {onDeleteBooking && (
                        <button
                          type="button"
                          onClick={() => setBookingToDelete(bk)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={Boolean(bookingToDelete)}
        title="Delete Support Booking?"
        description={`Are you sure you want to remove remote support booking "${bookingToDelete?.bookingNumber || bookingToDelete?.id}"?`}
        confirmLabel="Delete Booking"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBookingToDelete(null)}
      />
    </div>
  );
};
