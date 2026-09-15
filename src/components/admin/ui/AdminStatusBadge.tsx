import React from 'react';
import { CheckCircle2, Clock, XCircle, Archive } from 'lucide-react';

interface AdminStatusBadgeProps {
  status: string;
  type?: 'product' | 'payment' | 'booking' | 'review' | 'generic';
  className?: string;
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  status,
  type = 'generic',
  className = ''
}) => {
  const norm = (status || '').toUpperCase();

  // Published / Success / Paid / Confirmed / Resolved / Active
  if (['PUBLISHED', 'SUCCESS', 'PAID', 'CONFIRMED', 'RESOLVED', 'ACTIVE'].includes(norm)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>{status}</span>
      </span>
    );
  }

  // Pending / Draft / In Progress
  if (['PENDING', 'DRAFT', 'IN PROGRESS', 'PROCESSING'].includes(norm)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>{status}</span>
      </span>
    );
  }

  // Archived / Hidden
  if (['ARCHIVED', 'HIDDEN'].includes(norm)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
      >
        <Archive className="w-3 h-3 text-slate-400" />
        <span>{status}</span>
      </span>
    );
  }

  // Failed / Rejected / Cancelled
  if (['FAILED', 'REJECTED', 'CANCELLED'].includes(norm)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{status}</span>
      </span>
    );
  }

  // Default neutral
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      <span>{status}</span>
    </span>
  );
};
