import React from 'react';
import { RefreshCw, ShieldCheck, Mail, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RefundPolicyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-3 border border-slate-800 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold uppercase">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>OFFICIAL POLICY</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Refund & Return Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Clear, fair, and transparent guidelines regarding digital product purchases, remote support services, and eligible refund processing at Omove Store.
        </p>
        <span className="text-[11px] text-slate-400 font-mono block pt-1">Last Updated: August 2026</span>
      </div>

      {/* Main Content Card */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-8 leading-relaxed text-sm">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            1. Digital Product Return Policy
          </h2>
          <p className="text-slate-600">
            Due to the immediate digital nature of software license keys, digital activation codes, and downloadable installer packages, <strong>digital products are generally non-returnable and non-refundable</strong> once successfully delivered or displayed in your account portal.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            2. Eligible Technical Refund Scenarios
          </h2>
          <p className="text-slate-600">
            We stand behind the quality and validity of our software catalog and remote services. A refund may be granted under the following verified conditions:
          </p>
          <ul className="space-y-2 text-slate-600 list-disc pl-5">
            <li>
              <strong>Verified License Key Defect:</strong> If a delivered license key fails to activate and our technical team is unable to provide a replacement key within 24 hours.
            </li>
            <li>
              <strong>Non-Delivery or Access Failure:</strong> If a completed, payment-verified order fails to generate product access due to a system glitch and cannot be resolved by support.
            </li>
            <li>
              <strong>Unresolved Remote PC Support:</strong> If our certified technicians connect via AnyDesk for Remote Support but are unable to resolve your documented Windows or software issue, a full 100% refund will be processed within 2–3 business days.
            </li>
            <li>
              <strong>Duplicate Charges:</strong> If an unintended duplicate billing transaction occurs for the exact same order.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            3. Non-Eligible Refund Conditions
          </h2>
          <ul className="space-y-2 text-slate-600 list-disc pl-5">
            <li>Accidental purchase or change of mind after the digital key has been revealed or redeemed.</li>
            <li>Incompatibility caused by hardware/OS specifications below the explicitly stated system requirements.</li>
            <li>Third-party software modifications or OS corruptions outside the scope of the purchased product.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            4. Refund Processing Timelines & Methods
          </h2>
          <p className="text-slate-600">
            Approved refunds are credited directly back to the original payment source (UPI, Credit/Debit Card, Netbanking) via our authorized gateway Razorpay. Standard processing timelines are:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">UPI & Netbanking</strong>
              <span className="text-slate-500">1 to 3 Business Days</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <strong className="block text-slate-900 font-bold mb-1">Debit & Credit Cards</strong>
              <span className="text-slate-500">3 to 7 Business Days</span>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            5. How to Request a Refund
          </h2>
          <p className="text-slate-600">
            To submit a refund request, contact our support team with your <strong>Order ID (e.g. OMV-ORD-2026-XXXXX)</strong> and a brief description of the issue.
          </p>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>Official Email: ashikdaspc@gmail.com</span>
            <span>WhatsApp Support: +91 8345968169</span>
          </div>
        </section>
      </div>
    </div>
  );
};
