import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Headphones,
  Zap,
  RefreshCw,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  Coffee
} from 'lucide-react';

interface FooterProps {
  setCurrentView?: (view: string) => void;
  setSelectedCategory?: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Mobile Collapsible Sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    shop: true,
    support: true,
    company: true
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 4000);
      setEmailInput('');
    }
  };

  return (
    <footer className="bg-[#F3FAF7] text-slate-900 font-sans border-t border-emerald-100/90 relative overflow-hidden">
      {/* Subtle Ambient Brand Glow (5-8% opacity) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -mt-20" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. ELEGANT SUPPORT CTA STRIP                                              */}
        {/* ========================================================================= */}
        <div className="pt-6 sm:pt-8">
          <div className="py-3 px-4 sm:py-3.5 sm:px-6 rounded-xl sm:rounded-2xl bg-white/90 border border-emerald-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/70">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Need help with your order?
                </h4>
                <span className="hidden sm:inline text-slate-300">•</span>
                <p className="text-xs sm:text-sm text-slate-600">
                  Our support team is ready to help.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <Link
                to="/support"
                className="px-3 py-2 rounded-lg sm:rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/90 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all duration-200 shrink-0 whitespace-nowrap cursor-pointer hover:border-amber-300 hover:scale-[1.02] active:scale-95 group"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
                <span>Buy a Coffee ☕</span>
              </Link>

              <Link
                to="/contact"
                className="px-4 py-2 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
              >
                <span>Contact Support</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PROPORTIONAL 4-COLUMN MAIN FOOTER GRID                                 */}
        {/* ========================================================================= */}
        <div className="py-8 sm:py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
          
          {/* COLUMN 1 — BRAND & NEWSLETTER (~38% | lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4 pr-0 lg:pr-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-2xs group-hover:bg-emerald-700 transition-colors">
                O
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-sans">
                OMOVE STORE
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              Digital products, software solutions and reliable PC support for students, creators, professionals and everyday PC users.
            </p>

            {/* Trust Checks */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-700 font-medium pt-0.5">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Secure Checkout</span>
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Digital Delivery</span>
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Customer Support</span>
              </span>
            </div>

            {/* Compact Newsletter */}
            <div className="pt-2 max-w-sm space-y-2">
              <span className="text-xs font-bold text-slate-900 block">
                Get useful PC fixes & software updates.
              </span>
              {isSubscribed ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  ✓ Thank you for subscribing!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-white border border-emerald-100 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs font-sans"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    Subscribe →
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* COLUMN 2 — SHOP (~17% | lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <div
              onClick={() => toggleSection('shop')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-emerald-100 pb-1.5 md:pb-0"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                SHOP
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-400 md:hidden" />
            </div>

            {openSections.shop && (
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li>
                  <Link to="/digital-products" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Digital Products
                  </Link>
                </li>
                <li>
                  <Link to="/store" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Software Store
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Remote Support
                  </Link>
                </li>
                <li>
                  <Link to="/downloads" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Downloads
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* COLUMN 3 — SUPPORT (~17% | lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <div
              onClick={() => toggleSection('support')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-emerald-100 pb-1.5 md:pb-0"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                SUPPORT
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-400 md:hidden" />
            </div>

            {openSections.support && (
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li>
                  <Link to="/services" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Remote Support
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="hover:text-amber-700 transition-colors flex items-center gap-1.5 whitespace-nowrap font-medium text-amber-800/90">
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span>Buy Me a Coffee ☕</span>
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=orders" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link to="/downloads" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Download Center
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* COLUMN 4 — COMPANY & LEGAL (~28% | lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <div
              onClick={() => toggleSection('company')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-emerald-100 pb-1.5 md:pb-0"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                COMPANY & LEGAL
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-400 md:hidden" />
            </div>

            {openSections.company && (
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li>
                  <Link to="/about" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    About Omove Store
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Refund & Return Policy
                  </Link>
                </li>
                <li>
                  <Link to="/cookie-policy" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/delivery-policy" className="hover:text-emerald-700 transition-colors block whitespace-nowrap">
                    Digital Product Policy
                  </Link>
                </li>
              </ul>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. LIGHT PREMIUM HORIZONTAL TRUST BAR                                     */}
      {/* ========================================================================= */}
      <div className="border-y border-emerald-100/80 bg-white/60 py-3 relative z-10">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">Secure Checkout</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>

          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">Digital Delivery</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>

          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">Customer Support</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>

          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">Transparent Refunds</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CLEAN LIGHT BOTTOM COPYRIGHT BAR                                       */}
      {/* ========================================================================= */}
      <div className="bg-[#F3FAF7] py-4 relative z-10">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
          <p className="whitespace-nowrap">© 2026 Omove Store. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link to="/privacy-policy" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              Terms
            </Link>
            <Link to="/refund-policy" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              Refund Policy
            </Link>
            <Link to="/cookie-policy" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
