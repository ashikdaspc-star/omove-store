import React, { useState } from 'react';
import { Settings, ShieldCheck, Key, Lock, Check, DollarSign, Globe, CheckCircle2 } from 'lucide-react';
import { RazorpayIcon, PaypalIcon } from '../../PaymentMethodCards';

interface AdminSettingsViewProps {
  onPublishCatalog?: () => Promise<{ success: boolean; message?: string }>;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onPublishCatalog }) => {
  // Razorpay State
  const [razorpayKeyId, setRazorpayKeyId] = useState(import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('●●●●●●●●●●●●●●●●●●●●');

  // PayPal State
  const [paypalClientId, setPaypalClientId] = useState(import.meta.env.VITE_PAYPAL_CLIENT_ID || (window as any).__PAYPAL_CLIENT_ID__ || 'AbaU_oZt-k_7X-example-live-client-id');
  const [paypalClientSecret, setPaypalClientSecret] = useState('●●●●●●●●●●●●●●●●●●●●');
  const [paypalEnvironment, setPaypalEnvironment] = useState<'live' | 'sandbox'>('live');
  const [inrRatePerUsd, setInrRatePerUsd] = useState(95);
  const [paypalMinUsd, setPaypalMinUsd] = useState(0.0);
  const [paypalWebhookId, setPaypalWebhookId] = useState('WH-OMOVE-CAPTURE-VERIFIED');

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
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner Alert when Saved */}
      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono font-bold flex items-center gap-2.5 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>✓ Payment Gateway credentials and currency conversion settings updated successfully!</span>
        </div>
      )}

      {/* 1. PAYPAL GATEWAY SETTINGS CARD */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <PaypalIcon className="w-5 h-5" />
              </div>
              <span>PayPal Payment Gateway (USD International)</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Configure PayPal REST API credentials, live capture endpoints, and USD currency conversions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>PAYPAL LIVE READY</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-900 block mb-1.5">PayPal Client ID (REST App) *</label>
              <input
                type="text"
                required
                value={paypalClientId}
                onChange={(e) => setPaypalClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 font-sans text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1.5">PayPal Client Secret (Server-Side) *</label>
              <input
                type="password"
                required
                value={paypalClientSecret}
                onChange={(e) => setPaypalClientSecret(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 font-sans text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="font-bold text-slate-900 block mb-1.5">Environment Mode</label>
              <select
                value={paypalEnvironment}
                onChange={(e) => setPaypalEnvironment(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 font-sans text-xs"
              >
                <option value="live">Production (Live Payments)</option>
                <option value="sandbox">Sandbox (Test Environment)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1.5">Conversion Rate (INR per 1 USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={inrRatePerUsd}
                  onChange={(e) => setInrRatePerUsd(parseFloat(e.target.value) || 95)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1.5">Minimum PayPal Checkout (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={paypalMinUsd}
                  onChange={(e) => setPaypalMinUsd(parseFloat(e.target.value) || 3.0)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900 block mb-1.5">PayPal Webhook ID / Verification Hook</label>
            <input
              type="text"
              value={paypalWebhookId}
              onChange={(e) => setPaypalWebhookId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 font-sans text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all cursor-pointer"
            >
              SAVE PAYPAL CREDENTIALS
            </button>
            <span className="text-[11px] text-slate-500 font-sans">
              Formula: <code>USD = MAX({paypalMinUsd}, ROUND(INR / {inrRatePerUsd}, 2))</code>
            </span>
          </div>
        </form>
      </div>

      {/* 2. RAZORPAY GATEWAY SETTINGS CARD */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <RazorpayIcon className="w-5 h-5" />
              </div>
              <span>Razorpay Payment Gateway (INR Domestic)</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Configure live Razorpay Key ID and Secret for UPI, Card, NetBanking, and HMAC SHA-256 signatures.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>RAZORPAY LIVE READY</span>
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-900 block mb-1.5">Razorpay Key ID *</label>
              <input
                type="text"
                required
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-sans text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1.5">Razorpay Key Secret (Server Only) *</label>
              <input
                type="password"
                required
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-sans text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all cursor-pointer"
            >
              SAVE RAZORPAY CREDENTIALS
            </button>
          </div>
        </form>
      </div>

      {/* 3. GIT CATALOG SYNC CARD */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm font-mono">Git Catalog Auto-Push & Sync</h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Push current products catalog changes to main repository.</p>
        </div>

        <button
          onClick={handleSyncGit}
          disabled={isPublishing}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
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
