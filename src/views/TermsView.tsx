import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';

export const TermsView: React.FC = () => {
  const sections = [
    { num: 1, title: 'Acceptance of Terms', body: 'By accessing or purchasing from Omove Store, you agree to comply with these Terms & Conditions. If you do not agree, please do not use our services.' },
    { num: 2, title: 'Account Registration', body: 'Customers are responsible for maintaining the security of their registered account login credentials and keeping their email updated.' },
    { num: 3, title: 'Product Information', body: 'We ensure product listings accurately reflect software versions, features, and system requirements. Prices are subject to change without prior notice.' },
    { num: 4, title: 'Digital Product Access', body: 'Purchased digital product download links are delivered electronically via your customer account dashboard.' },
    { num: 5, title: 'Digital Product Downloads', body: 'Digital products grant direct Google Drive file download access upon verified order completion.' },
    { num: 6, title: 'Payments', body: 'All transactions are processed in Indian Rupees (₹ INR) securely through authorized payment gateway Razorpay.' },
    { num: 7, title: 'Refunds', body: 'Refund requests are evaluated under our Refund & Return Policy. Digital product downloads are non-returnable except for verified defects.' },
    { num: 8, title: 'Prohibited Use', body: 'Users must not engage in fraudulent purchase attempts, unauthorized file redistribution, or malicious site exploitation.' },
    { num: 9, title: 'Intellectual Property', body: 'All website branding, software names, custom code, logos, and UI designs are owned by Omove Store or third-party software rights holders.' },
    { num: 10, title: 'Third-Party Software/Services', body: 'Omove Store provides legitimate software products and AnyDesk remote connection support. Third-party software belongs to their respective owners.' },
    { num: 11, title: 'Technical Support', body: 'Remote PC Support is provided live via AnyDesk for diagnosed Windows OS issues. Technicians perform actions only with customer consent.' },
    { num: 12, title: 'Service Availability', body: 'While we strive for 99.9% uptime, website availability may experience brief maintenance windows.' },
    { num: 13, title: 'Limitation of Liability', body: 'Omove Store shall not be liable for indirect damages, OS corruptions caused by third-party malware, or user error.' },
    { num: 14, title: 'Changes to Terms', body: 'We reserve the right to modify these Terms at any time. Continued use of Omove Store constitutes acceptance of updated terms.' },
    { num: 15, title: 'Contact Information', body: 'For inquiries regarding these Terms, contact support at ashikdaspc@gmail.com or +91 8345968169.' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans text-slate-800">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-3 border border-slate-800 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold uppercase">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>LEGAL AGREEMENT</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Terms & Conditions
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Please review the terms governing your use of Omove Store software catalog, digital product access, and remote support services.
        </p>
        <span className="text-[11px] text-slate-400 font-mono block pt-1">Last Updated: August 2026</span>
      </div>

      {/* 15 Sections */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6 leading-relaxed text-sm">
        {sections.map((sec) => (
          <div key={sec.num} className="space-y-1.5 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
            <h2 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {sec.num}
              </span>
              <span>{sec.title}</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed pl-7">{sec.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
