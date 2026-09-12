import React from 'react';
import {
  AlertCircle,
  DownloadCloud,
  Headphones,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Mail,
  FileText,
  Lock,
  XCircle,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONTACT_CONFIG } from '../config/contactConfig';

export const RefundPolicyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 font-sans text-slate-800">
      
      {/* ========================================================================= */}
      {/* PAGE HERO                                                                 */}
      {/* ========================================================================= */}
      <div className="scroll-reveal p-6 sm:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>OFFICIAL STORE POLICY</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
          Refund & Return Policy
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          Please review our policy carefully before purchasing any digital product from Omove Store.
        </p>

        <span className="text-[11px] text-slate-400 block pt-1 font-mono">
          Last Updated: August 2026
        </span>
      </div>

      {/* ========================================================================= */}
      {/* PROMINENT POLICY NOTICE: ALL DIGITAL PRODUCTS ARE NON-REFUNDABLE         */}
      {/* ========================================================================= */}
      <div className="scroll-reveal p-6 sm:p-7 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 shadow-2xs space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/80 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              All Digital Products Are Non-Refundable
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              All digital products sold on Omove Store are strictly <strong>non-refundable and non-returnable</strong> after purchase. This includes Ebooks, digital bundles, templates, graphics, software, digital files, guides, courses/resources, downloadable products, and any other digitally delivered item.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED POLICY SECTIONS CARD                                             */}
      {/* ========================================================================= */}
      <div className="scroll-reveal p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-8 leading-relaxed text-sm">
        
        {/* Section 1 */}
        <section className="space-y-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">1</span>
            <span>Digital Products Are Non-Refundable</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            All digital products purchased from Omove Store are completely non-refundable and non-returnable. Because digital products are delivered electronically and may be accessed, viewed, copied, or downloaded immediately after purchase, customers cannot return the product once the transaction has been completed.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">2</span>
            <span>Before Purchasing</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Customers should carefully evaluate all product information before making a purchase. Please ensure you have reviewed:
          </p>
          <div className="grid sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-700">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full product description</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Product images & previews</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>File format specifications</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>System & compatibility info</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Included files & features</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Technical specifications</span>
            </div>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm pt-1">
            Once the purchase is completed, the order cannot normally be cancelled or refunded.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">3</span>
            <span>No Change-of-Mind Refunds</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Omove Store does not offer refunds or replacements under any of the following circumstances:
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 list-disc pl-5">
            <li>The customer changed their mind after ordering.</li>
            <li>The customer no longer needs or wants the product.</li>
            <li>The customer purchased the wrong product or wrong file format.</li>
            <li>The customer expected something different despite full product descriptions and previews being available.</li>
            <li>The customer does not like the contents or style of the product after purchase.</li>
            <li>The customer accidentally purchased a product.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">4</span>
            <span>Digital Delivery</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Digital products are delivered electronically through the delivery method specified on the product and order confirmation page (such as direct Google Drive link access or download center). Once the product has been successfully delivered or access has been made available in your account, the transaction is considered complete and final.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">5</span>
            <span>Technical Support</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Although all digital products are strictly non-refundable, customers can contact Omove Store support if they experience a genuine technical issue with accessing or downloading their purchased files. Our team is happy to assist with troubleshooting link access or providing alternative download assistance.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <strong>Important Notice:</strong> Providing technical support or download assistance does <strong>NOT</strong> mean that the customer is entitled to a refund.
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">6</span>
            <span>Duplicate Purchases</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Duplicate purchases of the same product are non-refundable unless Omove Store investigates and decides otherwise at its sole discretion.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">7</span>
            <span>Unauthorized / Fraudulent Transactions</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            If you believe an order was placed using your payment method without your authorization, please contact Omove Store support immediately. Omove Store reserves the right to investigate suspicious or fraudulent transactions.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">8</span>
            <span>Chargebacks & Payment Disputes</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Customers should contact Omove Store support directly to resolve any concerns before initiating a payment dispute or chargeback with their bank or payment processor. Unauthorized redistribution, misuse of digital assets, or fraudulent refund/chargeback attempts may result in immediate account termination and permanent access revocation.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3 pt-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">9</span>
            <span>Need Help? Contact Support</span>
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Our support team is available to assist you with:
          </p>
          <ul className="space-y-1 text-xs sm:text-sm text-slate-600 list-disc pl-5">
            <li>Download or file unzipping problems</li>
            <li>Access or link permissions</li>
            <li>Technical troubleshooting</li>
            <li>General order and receipt questions</li>
          </ul>
          <p className="text-xs text-slate-500 italic pt-1">
            Please remember that all digital products remain strictly non-refundable.
          </p>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono mt-3">
            <div className="space-y-0.5">
              <span className="text-slate-500 uppercase block text-[10px] font-bold">Email Support</span>
              <span className="font-bold text-slate-900">omovetech@gmail.com</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 uppercase block text-[10px] font-bold">WhatsApp Support</span>
              <span className="font-bold text-emerald-800">{CONTACT_CONFIG.whatsapp.display}</span>
            </div>
            <Link
              to="/contact"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs text-center whitespace-nowrap"
            >
              Contact Support →
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
