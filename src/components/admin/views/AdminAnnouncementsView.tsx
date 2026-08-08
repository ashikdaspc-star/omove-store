import React, { useState } from 'react';
import { Megaphone, Check } from 'lucide-react';

export const AdminAnnouncementsView: React.FC = () => {
  const [announcementText, setAnnouncementText] = useState('🔥 SPECIAL PROMO: Get Instant Access License Keys With 100% Refund Guarantee!');
  const [ctaText, setCtaText] = useState('SHOP NOW');
  const [ctaUrl, setCtaUrl] = useState('/store');
  const [enabled, setEnabled] = useState(true);
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
          <Megaphone className="w-5 h-5 text-emerald-600" />
          <span>Top Announcement Banner</span>
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-1">Configure live website top announcement bar.</p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
          ✓ Announcement banner updated live on website!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
        <div>
          <label className="font-bold text-slate-900 block mb-1">Announcement Message *</label>
          <input
            type="text"
            required
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-900 block mb-1">CTA Button Text</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="font-bold text-slate-900 block mb-1">CTA Target URL</label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-2">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
          <span className="font-bold text-slate-900">Enable Live Announcement Banner</span>
        </label>

        <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs">
          SAVE ANNOUNCEMENT BANNER
        </button>
      </form>
    </div>
  );
};
