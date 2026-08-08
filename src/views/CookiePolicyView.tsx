import React from 'react';
import { Cookie, ShieldCheck } from 'lucide-react';

export const CookiePolicyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-3 border border-slate-800 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold uppercase">
          <Cookie className="w-3.5 h-3.5 text-emerald-400" />
          <span>STORAGE & COOKIES</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Cookie Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Understanding how Omove Store uses browser cookies and local storage technology to deliver a secure, reliable e-commerce experience.
        </p>
        <span className="text-[11px] text-slate-400 font-mono block pt-1">Last Updated: August 2026</span>
      </div>

      {/* Main Content */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-8 leading-relaxed text-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            1. What Are Cookies and Browser LocalStorage?
          </h2>
          <p className="text-slate-600">
            Cookies and browser LocalStorage are small data files stored locally on your browser or device when you visit websites. They help remember your shopping cart items, active sessions, and user preferences.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            2. Types of Storage We Use
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">Essential Functional Storage (Required)</strong>
              <p className="text-slate-600 text-xs">
                Used to maintain your active shopping cart contents, customer authentication tokens, and security CSRF state during checkout. Disabling these prevents cart functionality.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">Security & Real-Time Traffic Engine (Internal)</strong>
              <p className="text-slate-600 text-xs">
                Tracks active session status to prevent duplicate order submissions and ensure server-authoritative Razorpay payment verification.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            3. Managing Your Browser Storage
          </h2>
          <p className="text-slate-600">
            You can clear or block cookies and LocalStorage through your browser settings (Chrome, Edge, Firefox, Safari). Note that clearing storage will sign you out of your account and clear any active cart items.
          </p>
        </section>
      </div>
    </div>
  );
};
