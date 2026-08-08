import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

export const AdminActivityLogView: React.FC = () => {
  const auditLogs = [
    { action: 'CATALOG_PUBLISHED', target: 'Live Website Catalog Sync', admin: 'Super Admin', time: '5 mins ago' },
    { action: 'PRODUCT_EDITED', target: 'OMOVE WinMaster Pro 2026', admin: 'Super Admin', time: '12 mins ago' },
    { action: 'ORDER_VERIFIED', target: 'OMV-ORD-2026-9812 (Razorpay HMAC)', admin: 'System Engine', time: '1 hour ago' },
    { action: 'ADMIN_LOGIN', target: 'Admin Portal Login', admin: 'Super Admin', time: '2 hours ago' }
  ];

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Admin Activity Audit Trail</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Audit log of system actions and administrator changes.</p>
        </div>
        <span className="px-3.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
          AUDIT ENGINE ACTIVE
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
              <th className="pb-3 font-bold">Action</th>
              <th className="pb-3 font-bold">Target</th>
              <th className="pb-3 font-bold">Admin</th>
              <th className="pb-3 font-bold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditLogs.map((log, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 font-bold text-emerald-700">{log.action}</td>
                <td className="py-3.5 text-slate-900 font-sans font-bold">{log.target}</td>
                <td className="py-3.5 text-slate-600">{log.admin}</td>
                <td className="py-3.5 text-slate-400">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
