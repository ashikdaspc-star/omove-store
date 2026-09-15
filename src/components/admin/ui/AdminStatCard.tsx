import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  icon: LucideIcon;
  iconColor?: 'emerald' | 'indigo' | 'amber' | 'cyan' | 'purple' | 'rose' | 'blue';
  onClick?: () => void;
  badge?: string;
}

const colorMap = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
  amber: 'bg-amber-50 text-amber-600 border-amber-200/80',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
  purple: 'bg-purple-50 text-purple-600 border-purple-200/80',
  rose: 'bg-rose-50 text-rose-600 border-rose-200/80',
  blue: 'bg-blue-50 text-blue-600 border-blue-200/80'
};

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  iconColor = 'emerald',
  onClick,
  badge
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick!() : undefined}
      className={`relative p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition-all duration-200 flex flex-col justify-between group font-sans ${
        isClickable
          ? 'cursor-pointer hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
          : ''
      }`}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 font-sans tracking-tight">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${colorMap[iconColor]}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Center row: Primary Value */}
      <div className="my-2.5">
        <div className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 tracking-tight">
          {value}
        </div>
        {subValue && (
          <div className="text-xs font-medium text-slate-500 mt-0.5 font-sans">
            {subValue}
          </div>
        )}
      </div>

      {/* Bottom row: Trend or Badge */}
      <div className="flex items-center justify-between text-xs font-sans pt-1">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              trend.isPositive ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend.text}</span>
          </span>
        ) : badge ? (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 font-sans">
            {badge}
          </span>
        ) : (
          <span className="text-slate-400">Updated Real-Time</span>
        )}
      </div>
    </div>
  );
};
