import React from 'react';
import { ShoppingBag, ShieldCheck, Headphones, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-sans text-slate-800">
      {/* Hero Banner */}
      <div className="scroll-reveal p-8 sm:p-12 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>ABOUT OMOVE STORE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
          Built for Students, Creators & PC Users
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Omove Store is a dedicated digital software catalog and certified remote PC support platform built to deliver genuine digital products, instant Google Drive downloads, and expert AnyDesk technical repairs.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div style={{ '--reveal-delay': '0ms' } as React.CSSProperties} className="scroll-reveal p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Digital Software Catalog</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Curated catalog of Windows tools, CAD software, and productivity suites with instant Google Drive delivery.
          </p>
        </div>

        <div style={{ '--reveal-delay': '140ms' } as React.CSSProperties} className="scroll-reveal p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Headphones className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Live Remote PC Repair</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Certified technicians resolve Windows OS bugs, BSOD errors, and software setup via secure AnyDesk sessions.
          </p>
        </div>

        <div style={{ '--reveal-delay': '280ms' } as React.CSSProperties} className="scroll-reveal p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Guaranteed Support</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            100% refund guarantee on remote support if our technicians cannot fix your documented issue.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="scroll-reveal p-8 rounded-3xl bg-white border border-slate-200 shadow-xs text-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-900">Need PC Support or Software Advice?</h3>
          <p className="text-xs text-slate-500">Our support team is available online to assist with your order.</p>
        </div>
        <Link
          to="/contact"
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs whitespace-nowrap transition-colors"
        >
          Contact Support →
        </Link>
      </div>
    </div>
  );
};
