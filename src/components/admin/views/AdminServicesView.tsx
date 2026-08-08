import React, { useState } from 'react';
import { RemoteService } from '../../../types';
import { Wrench, Plus, Edit3, Trash2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { ServiceEditorModal } from '../modals/ServiceEditorModal';

interface AdminServicesViewProps {
  services: RemoteService[];
  onAddService?: (service: RemoteService) => void;
  onUpdateService?: (service: RemoteService) => void;
  onDeleteService?: (serviceId: string) => void;
}

export const AdminServicesView: React.FC<AdminServicesViewProps> = ({
  services = [],
  onAddService,
  onUpdateService,
  onDeleteService
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<RemoteService | null>(null);

  const handleOpenAdd = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleOpenEdit = (srv: RemoteService) => {
    setEditingService(srv);
    setShowModal(true);
  };

  const handleSaveService = (serviceData: Partial<RemoteService>) => {
    if (serviceData.id && editingService) {
      if (onUpdateService) {
        onUpdateService(serviceData as RemoteService);
      }
    } else {
      const newService: RemoteService = {
        id: `srv-${Date.now()}`,
        title: serviceData.title || 'New Remote Support Service',
        description: serviceData.description || 'Remote PC support package.',
        price: Number(serviceData.price) || 39,
        originalPrice: Number(serviceData.originalPrice) || 499,
        category: serviceData.category || 'Windows Fix',
        estimatedTime: serviceData.estimatedTime || '15 Mins',
        iconName: 'Wrench',
        popular: serviceData.popular ?? false,
        features: serviceData.features || ['Expert Support', 'Secure Remote Repair']
      };
      if (onAddService) {
        onAddService(newService);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Toolbar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            <span>Services Catalog</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Manage remote computer support package cards, features, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
            {services.length} Active Services
          </span>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD NEW SERVICE</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-sans space-y-3 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs">
          <Wrench className="w-10 h-10 mx-auto text-emerald-600/60" />
          <p className="text-sm font-medium text-slate-600">No Service Cards found in catalog.</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono font-bold text-xs shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Service Package Card</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      {srv.category}
                    </span>
                    {srv.popular && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <strong className="text-lg font-extrabold font-mono text-slate-900 block">₹{srv.price}</strong>
                    {srv.originalPrice > srv.price && (
                      <span className="text-[11px] text-slate-400 font-mono line-through block">₹{srv.originalPrice}</span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base font-sans group-hover:text-emerald-700 transition-colors">
                  {srv.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed whitespace-pre-line">{srv.description}</p>

                {/* Features Pill List */}
                {srv.features && srv.features.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {srv.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="line-clamp-1">{feat}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duration: {srv.estimatedTime || '15 Mins'}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(srv)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {onDeleteService && (
                    <button
                      onClick={() => onDeleteService(srv.id)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-colors"
                      title="Delete Service Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      <ServiceEditorModal
        isOpen={showModal}
        service={editingService}
        onClose={() => setShowModal(false)}
        onSave={handleSaveService}
      />
    </div>
  );
};
