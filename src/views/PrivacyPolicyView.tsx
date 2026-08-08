import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-3 border border-slate-800 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold uppercase">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>DATA PRIVACY</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          How Omove Store collects, uses, protects, and handles your personal information when you use our website, services, and digital store catalog.
        </p>
        <span className="text-[11px] text-slate-400 font-mono block pt-1">Last Updated: August 2026</span>
      </div>

      {/* Main Content Card */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-8 leading-relaxed text-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            1. Information We Collect
          </h2>
          <p className="text-slate-600">
            We collect information necessary to fulfill digital software orders, maintain customer accounts, and provide remote technical support:
          </p>
          <ul className="space-y-2 text-slate-600 list-disc pl-5">
            <li><strong>Account & Contact Info:</strong> Your name, email address, and optional phone number.</li>
            <li><strong>Order & License Logs:</strong> Purchase records, generated license keys, and order timestamps.</li>
            <li><strong>Support Session Details:</strong> Documented Remote Support issue notes and AnyDesk IDs shared during technical repair requests.</li>
            <li><strong>Technical Diagnostics:</strong> Anonymized browser type, IP address, and session traffic metrics for security audit logs.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            2. Payment Data Security (Razorpay)
          </h2>
          <p className="text-slate-600">
            Payment transactions are processed securely through our authorized payment partner <strong>Razorpay</strong> via encrypted HTTPS connection with HMAC SHA-256 signature verification.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono">
            <strong>Important Security Notice:</strong> Omove Store does not store, process, or record raw credit card numbers, debit CVV codes, or bank account PINs on our servers.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            3. How We Use Your Information
          </h2>
          <ul className="space-y-2 text-slate-600 list-disc pl-5">
            <li>Delivering digital product software keys and installer setup packages.</li>
            <li>Verifying order authenticity and preventing fraudulent transactions.</li>
            <li>Connecting technicians for scheduled Remote PC Support sessions.</li>
            <li>Sending critical order confirmations and invoice records.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            4. Information Sharing & Disclosure
          </h2>
          <p className="text-slate-600">
            We do not sell, rent, or trade your personal data to third-party marketers. Limited sharing occurs only with essential service providers:
          </p>
          <ul className="space-y-2 text-slate-600 list-disc pl-5">
            <li><strong>Payment Gateways:</strong> Razorpay for transaction verification and processing.</li>
            <li><strong>Email Providers:</strong> Authorized SMTP infrastructure for delivering digital purchase receipts.</li>
            <li><strong>Legal Compliance:</strong> When strictly required by law enforcement or valid court orders.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans border-b border-slate-100 pb-2">
            5. Your Data Rights & Deletion
          </h2>
          <p className="text-slate-600">
            You hold the right to access, update, or permanently delete your account and personal data at any time under Account Settings (`/dashboard?tab=settings`) or by contacting <strong>ashikdaspc@gmail.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
