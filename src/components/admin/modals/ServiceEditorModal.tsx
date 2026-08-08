import React, { useState, useEffect } from 'react';
import { RemoteService, ServiceCategory } from '../../../types';
import { X, Check, Wrench, DollarSign, Clock, Sparkles } from 'lucide-react';

interface ServiceEditorModalProps {
  service?: RemoteService | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: Partial<RemoteService>) => void;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Windows Fix',
  'Driver Repair',
  'Virus & Malware',
  'PC Optimization',
  'Data Recovery',
  'Hardware Setup',
  'Network & Wifi'
];

export const ServiceEditorModal: React.FC<ServiceEditorModalProps> = ({
  service,
  isOpen,
  onClose,
  onSave
}) => {
  const isEdit = Boolean(service && service.id);

  const [title, setTitle] = useState(service?.title || '');
  const [category, setCategory] = useState<ServiceCategory>(service?.category || 'Windows Fix');
  const [price, setPrice] = useState<number>(service?.price || 39);
  const [originalPrice, setOriginalPrice] = useState<number>(service?.originalPrice || 499);
  const [estimatedTime, setEstimatedTime] = useState(service?.estimatedTime || '15 Mins');
  const [description, setDescription] = useState(service?.description || '');
  const [featuresInput, setFeaturesInput] = useState(
    (service?.features || [
      'Direct Expert Support',
      'PC & Software Solutions',
      'Secure Remote Repair',
      'WhatsApp Support'
    ]).join('\n')
  );
  const [popular, setPopular] = useState<boolean>(service?.popular ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(service?.title || '');
      setCategory(service?.category || 'Windows Fix');
      setPrice(service?.price || 39);
      setOriginalPrice(service?.originalPrice || 499);
      setEstimatedTime(service?.estimatedTime || '15 Mins');
      setDescription(service?.description || '');
      setFeaturesInput(
        (service?.features || [
          'Direct Expert Support',
          'PC & Software Solutions',
          'Secure Remote Repair',
          'WhatsApp Support'
        ]).join('\n')
      );
      setPopular(service?.popular ?? true);
      setIsSubmitting(false);
    }
  }, [isOpen, service]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const features = featuresInput
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const servicePayload: Partial<RemoteService> = {
      id: service?.id,
      title: title || 'New Remote PC Service',
      description: description || 'Professional remote PC support package.',
      price: Number(price) || 39,
      originalPrice: Number(originalPrice) || 499,
      category,
      estimatedTime: estimatedTime || '15 Mins',
      iconName: 'Wrench',
      popular,
      features: features.length > 0 ? features : ['Expert Support', 'Secure Remote Repair']
    };

    try {
      onSave(servicePayload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-400 block">
                {isEdit ? 'EDIT REMOTE SERVICE CARD' : 'ADD NEW REMOTE SERVICE CARD'}
              </span>
              <h2 className="text-base font-extrabold text-white">
                {isEdit ? `Edit ${service?.title}` : 'Add New Support Package Option'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs font-mono">
          <div>
            <label className="font-bold text-slate-900 block mb-1">Service Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Virus Removal & Deep Malware Cleanup"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-sans text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Estimated Time *</label>
              <input
                type="text"
                required
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 15 Mins, 30 Mins"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Service Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-extrabold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Original Price (₹)</label>
              <input
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900 block mb-1">Service Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is included in this remote support package..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-sans text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900 block mb-1">Feature Bullet Points (One Per Line)</label>
            <textarea
              rows={4}
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="Direct Expert Support&#10;PC & Software Solutions&#10;Secure Remote Repair"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
            />
          </div>

          <div className="pt-1 flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 text-xs">Highlight as Popular Package</span>
            </div>
            <input
              type="checkbox"
              checked={popular}
              onChange={(e) => setPopular(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isEdit ? 'SAVE CHANGES' : 'CREATE SERVICE CARD'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
