import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';

export const AdminWebsiteContentView: React.FC = () => {
  const [heroHeading, setHeroHeading] = useState('Official Software & Digital Products');
  const [heroSubheading, setHeroSubheading] = useState('Instant License Key Delivery & Certified Remote Computer Repairs');
  const [whatsappNumber, setWhatsappNumber] = useState('+91 8345968169');
  const [supportEmail, setSupportEmail] = useState('ashikdaspc@gmail.com');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6 max-w-2xl">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <span>Website Content & Contact Settings</span>
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-1">Configure website hero text and support contacts.</p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
          ✓ Website content settings updated!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
        <div>
          <label className="font-bold text-slate-900 block mb-1">Homepage Hero Main Heading *</label>
          <input
            type="text"
            required
            value={heroHeading}
            onChange={(e) => setHeroHeading(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="font-bold text-slate-900 block mb-1">Homepage Subheading *</label>
          <textarea
            rows={2}
            required
            value={heroSubheading}
            onChange={(e) => setHeroSubheading(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-900 block mb-1">WhatsApp Support Number</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="font-bold text-slate-900 block mb-1">Support Email</label>
            <input
              type="text"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs">
          SAVE CONTENT SETTINGS
        </button>
      </form>
    </div>
  );
};
