import React from 'react';
import { Download, Zap, ShieldCheck } from 'lucide-react';

export const DeliveryPolicyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-3 border border-slate-800 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold uppercase">
          <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>DIGITAL DELIVERY</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Digital Delivery Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Information regarding electronic fulfillment, download access, license key generation, and delivery verification for Omove Store products.
        </p>
        <span className="text-[11px] text-slate-400 font-mono block pt-1">Last Updated: August 2026</span>
      </div>

      {/* Content */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-8 leading-relaxed text-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            1. Electronic Product Delivery
          </h2>
          <p className="text-slate-600">
            All software licenses, activation keys, and digital product files offered on Omove Store are delivered <strong>100% electronically</strong>. No physical boxes, discs, or shipping containers are dispatched.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            2. Instant Delivery Access Channels
          </h2>
          <p className="text-slate-600">
            Upon successful payment verification, digital access is immediately provided through two primary methods:
          </p>
          <ul className="space-y-2 text-slate-600 list-disc pl-5">
            <li><strong>Instant Checkout Screen:</strong> Your order confirmation screen instantly displays your unique product license keys and official download links.</li>
            <li><strong>Customer Dashboard:</strong> All purchased keys and installer packages are permanently accessible under <strong>Account → My Orders & Downloads</strong> (`/dashboard?tab=orders`).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            3. Delivery Timeframes & Verification
          </h2>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono text-xs space-y-1">
            <strong className="block font-sans text-sm">Instant Delivery (0 to 5 Minutes)</strong>
            <span>99% of orders are generated instantly upon payment confirmation.</span>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm pt-2">
            In rare instances where payment verification requires manual gateway sync, delivery will complete within a maximum of 2 hours.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            4. Delivery Troubleshooting & Support
          </h2>
          <p className="text-slate-600">
            If payment is completed but you have not received your digital key within 15 minutes, please check your spam folder or contact support with your Order ID:
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
            Email: <strong>ashikdaspc@gmail.com</strong> | WhatsApp: <strong>+91 8345968169</strong>
          </div>
        </section>
      </div>
    </div>
  );
};
