import React from 'react';
import { RemoteService } from '../../../types';
import { Wrench, Plus, Edit3, Trash2 } from 'lucide-react';

interface AdminServicesViewProps {
  services: RemoteService[];
  onAddService?: (service: RemoteService) => void;
  onDeleteService?: (serviceId: string) => void;
}

export const AdminServicesView: React.FC<AdminServicesViewProps> = ({ services = [], onDeleteService }) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Services Catalog</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Manage remote computer support packages and pricing.</p>
        </div>
        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
          {services.length} Active Services
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div key={srv.id} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  {srv.category}
                </span>
                <strong className="text-base font-extrabold font-mono text-slate-900">₹{srv.price}</strong>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{srv.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{srv.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Duration: {srv.duration}</span>
              {onDeleteService && (
                <button
                  onClick={() => onDeleteService(srv.id)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
