import React, { useState } from 'react';
import { RemoteService } from '../../../types';
import { Wrench, Plus, Edit3, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { ServiceEditorModal } from '../modals/ServiceEditorModal';
import { AdminConfirmDialog } from '../ui/AdminConfirmDialog';

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
  const [serviceToDelete, setServiceToDelete] = useState<RemoteService | null>(null);

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
    setShowModal(false);
  };

  const handleConfirmDelete = () => {
    if (!serviceToDelete || !onDeleteService) return;
    onDeleteService(serviceToDelete.id);
    setServiceToDelete(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              Services Catalog
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              {services.length} services
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Manage remote computer support packages, pricing, and feature highlights.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services Cards Grid */}
      {services.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-slate-200 space-y-3 shadow-xs">
          <Wrench className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">No Services Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
            Add remote support services to appear in the customer booking catalog.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Service</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group font-sans"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      {srv.category}
                    </span>
                    {srv.popular && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
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
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-sans">{srv.description}</p>

                {srv.features && srv.features.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    {srv.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Est: {srv.estimatedTime || '15 Mins'}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(srv)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Edit Service"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceToDelete(srv)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Delete Service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Editor Modal */}
      {showModal && (
        <ServiceEditorModal
          isOpen={showModal}
          service={editingService}
          onClose={() => setShowModal(false)}
          onSave={handleSaveService}
        />
      )}

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={Boolean(serviceToDelete)}
        title="Delete Service Package?"
        description={`Are you sure you want to delete "${serviceToDelete?.title}"?`}
        confirmLabel="Delete Service"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setServiceToDelete(null)}
      />
    </div>
  );
};
