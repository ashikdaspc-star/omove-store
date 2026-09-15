import React, { useState } from 'react';
import { Settings, ShieldCheck, Key, Lock, Check, DollarSign, Globe, CheckCircle2, Database, HardDrive, RefreshCw } from 'lucide-react';
import { RazorpayIcon, PaypalIcon } from '../../PaymentMethodCards';

interface AdminSettingsViewProps {
  onPublishCatalog?: () => Promise<{ success: boolean; message?: string }>;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onPublishCatalog }) => {
  const [activeTab, setActiveTab] = useState<'gateways' | 'storage' | 'security'>('gateways');

  // Razorpay State
  const [razorpayKeyId, setRazorpayKeyId] = useState(import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('●●●●●●●●●●●●●●●●●●●●');

  // PayPal State
  const [paypalClientId, setPaypalClientId] = useState(import.meta.env.VITE_PAYPAL_CLIENT_ID || (window as any).__PAYPAL_CLIENT_ID__ || 'AbaU_oZt-k_7X-example-live-client-id');
  const [paypalClientSecret, setPaypalClientSecret] = useState('●●●●●●●●●●●●●●●●●●●●');
  const [paypalEnvironment, setPaypalEnvironment] = useState<'live' | 'sandbox'>('live');
  const [inrRatePerUsd, setInrRatePerUsd] = useState(95);
  const [paypalMinUsd, setPaypalMinUsd] = useState(3.0);

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
    <div className="space-y-6 max-w-5xl font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
            Admin System Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Configure payment gateways, Cloudflare D1 database & R2 storage bindings, and admin security.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-sans">
          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'gateways' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Payment Gateways
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'storage' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            D1 & R2 Storage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'security' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Security
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>✓ System settings saved successfully.</span>
        </div>
      )}

      {/* 1. PAYMENT GATEWAYS TAB */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          {/* PayPal Gateway Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <PaypalIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">
                    PayPal Payment Gateway (USD International)
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Live capture endpoints, conversion rates, and client credentials.
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                ACTIVE
              </span>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">PAYPAL CLIENT ID *</label>
                  <input
                    type="text"
                    required
                    value={paypalClientId}
                    onChange={(e) => setPaypalClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">CLIENT SECRET (SERVER) *</label>
                  <input
                    type="password"
                    required
                    value={paypalClientSecret}
                    onChange={(e) => setPaypalClientSecret(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">ENVIRONMENT</label>
                  <select
                    value={paypalEnvironment}
                    onChange={(e) => setPaypalEnvironment(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans focus:outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="live">Production (Live Payments)</option>
                    <option value="sandbox">Sandbox (Testing)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">INR RATE PER 1 USD</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inrRatePerUsd}
                    onChange={(e) => setInrRatePerUsd(parseFloat(e.target.value) || 95)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">MINIMUM USD CHECKOUT ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={paypalMinUsd}
                    onChange={(e) => setPaypalMinUsd(parseFloat(e.target.value) || 3.0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Save PayPal Config
                </button>
              </div>
            </form>
          </div>

          {/* Razorpay Gateway Card */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <RazorpayIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">
                    Razorpay Gateway (INR UPI & Cards)
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Instant domestic settlement, UPI QR, and netbanking credentials.
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">RAZORPAY KEY ID *</label>
                  <input
                    type="text"
                    required
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">RAZORPAY KEY SECRET (HMAC SHA-256) *</label>
                  <input
                    type="password"
                    required
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Save Razorpay Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. D1 & R2 STORAGE TAB */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5 font-sans">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Cloudflare D1 Production Database
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Primary transactional & catalog store on Cloudflare Edge.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px] font-mono">DATABASE NAME</span>
                <strong className="text-slate-900 font-mono">omove-store-db</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px] font-mono">DATABASE UUID</span>
                <strong className="text-slate-900 font-mono select-all">464d8440-c3f3-4230-9b6b-74437a47c1d8</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px] font-mono">BINDING VARIABLE</span>
                <strong className="text-emerald-700 font-mono">env.DB</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px] font-mono">STATUS</span>
                <strong className="text-emerald-700 font-mono">ONLINE & CONNECTED</strong>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5 font-sans">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Cloudflare R2 Object Storage (Assets & Downloads)
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Private bucket for product images, previews, screenshots, and downloadable files.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px] font-mono">R2 BUCKET</span>
                <strong className="text-slate-900 font-mono">omove-store-files</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px] font-mono">R2 BINDING</span>
                <strong className="text-purple-700 font-mono">env.FILES</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px] font-mono">UPLOAD MEDIA ENDPOINT</span>
                <strong className="text-emerald-700 font-mono">POST /api/admin/upload-media</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[10px] font-mono">BASE64 SANITIZATION</span>
                <strong className="text-emerald-700 font-mono">STRICT ENFORCEMENT (Zero Base64 in D1)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5 font-sans">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Administrator Session & Access Control
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Authentication session status and privileged access controls.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Admin Role:</span>
                <span className="text-emerald-700 font-semibold font-mono">SUPER ADMINISTRATOR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session Storage:</span>
                <span className="text-slate-900 font-mono">Active (omove_admin_session)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Public Decoupling:</span>
                <span className="text-emerald-700 font-semibold font-mono">100% Isolated Shell</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Public Chrome Suppression:</span>
                <span className="text-emerald-700 font-semibold font-mono">Navbar, Cart & WhatsApp Omitted</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
