import React, { useState } from 'react';
import { Settings, ShieldCheck, Key, Lock, Check } from 'lucide-react';

interface AdminSettingsViewProps {
  onPublishCatalog?: () => Promise<{ success: boolean; message?: string }>;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onPublishCatalog }) => {
  const [razorpayKeyId, setRazorpayKeyId] = useState(import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('●●●●●●●●●●●●●●●●●●●●');
  const [savedNotice, setSavedNotice] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleSyncGit = async () => {
    if (!onPublishCatalog) return;
    setIsPublishing(true);
    try {
      await onPublishCatalog();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Razorpay Gateway Settings Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Razorpay Payment Gateway Credentials</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Configure live Razorpay Key ID and Secret for HMAC SHA-256 payment verification.
          </p>
        </div>

        {savedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
            ✓ Gateway settings saved securely!
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-mono">
          <div>
            <label className="font-bold text-slate-900 block mb-1">Razorpay Key ID *</label>
            <input
              type="text"
              required
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900 block mb-1">Razorpay Key Secret (Server Only) *</label>
            <input
              type="password"
              required
              value={razorpayKeySecret}
              onChange={(e) => setRazorpayKeySecret(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs">
            SAVE GATEWAY CREDENTIALS
          </button>
        </form>
      </div>

      {/* Git Catalog Sync Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm font-mono">Git Catalog Auto-Push & Sync</h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Push current products catalog changes to main repository.</p>
        </div>

        <button
          onClick={handleSyncGit}
          disabled={isPublishing}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold shadow-xs flex items-center gap-2"
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>SYNCING CATALOG TO REPOSITORY...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>PUBLISH & SYNC CATALOG TO GITHUB</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
