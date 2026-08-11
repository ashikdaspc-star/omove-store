import React, { useState, useEffect } from 'react';
import { RemoteBooking } from '../../../types';
import { Headphones, CheckCircle2, Clock, Monitor, User } from 'lucide-react';

interface AdminRemoteSupportViewProps {
  bookings: RemoteBooking[];
  onUpdateBooking?: (booking: RemoteBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

export const AdminRemoteSupportView: React.FC<AdminRemoteSupportViewProps> = ({
  bookings = [],
  onUpdateBooking
}) => {
  const [serverBookings, setServerBookings] = useState<RemoteBooking[]>([]);

  useEffect(() => {
    fetch('/api/bookings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setServerBookings(data);
      })
      .catch((err) => console.warn('Admin bookings fetch note:', err));
  }, []);

  const displayBookings = serverBookings.length > 0 ? serverBookings : bookings;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Live Remote Support Queue</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Manage incoming AnyDesk remote PC inspection requests.</p>
        </div>
        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
          {displayBookings.length} Remote Bookings
        </span>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
                <th className="pb-3 font-bold">Booking ID</th>
                <th className="pb-3 font-bold">Customer Email</th>
                <th className="pb-3 font-bold">Remote Tool & ID</th>
                <th className="pb-3 font-bold">Issue Category</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayBookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">{bk.bookingNumber || bk.id}</td>
                  <td className="py-3.5 text-slate-700 font-sans">{bk.email}</td>
                  <td className="py-3.5 font-bold text-emerald-700">
                    {bk.remoteTool}: {bk.remoteId}
                  </td>
                  <td className="py-3.5 text-slate-600">{bk.issueCategory || 'Windows Fix'}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        bk.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {bk.status || 'Technician Assigned'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {onUpdateBooking && (
                      <select
                        value={bk.status || 'Technician Assigned'}
                        onChange={(e) => onUpdateBooking({ ...bk, status: e.target.value as any })}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-900 font-bold"
                      >
                        <option value="Technician Assigned">Technician Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    )}
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
