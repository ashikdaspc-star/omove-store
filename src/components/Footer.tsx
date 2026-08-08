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
  MessageSquare
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
    <footer className="bg-gradient-to-b from-[#042F2C] via-[#052327] to-[#071426] text-slate-200 font-sans border-t border-emerald-500/20 relative">
      {/* Top Support CTA Card Container */}
      <div className="pt-10 max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-emerald-900/90 border border-emerald-500/30 shadow-xl backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-extrabold text-white font-sans tracking-tight">
                Need help with your order?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 font-sans">
                Talk to Omove Store Support and we'll help you get it sorted.
              </p>
            </div>
          </div>

          <Link
            to="/contact"
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 shrink-0"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main 4-Column Footer Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1 — OMOVE STORE Brand & Newsletter (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-extrabold text-base font-mono shadow-xs group-hover:scale-105 transition-all">
                O
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight font-sans">
                OMOVE STORE
              </span>
            </Link>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md font-sans">
              Digital products, software solutions and reliable PC support for students, creators, professionals and everyday PC users.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-emerald-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Secure Checkout</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Digital Delivery</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Customer Support</span>
              </span>
            </div>

            {/* Compact Newsletter Input */}
            <div className="pt-2 max-w-md space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 block">
                Get useful PC fixes & software updates.
              </span>
              {isSubscribed ? (
                <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                  ✓ Thank you for subscribing!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-sans"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shrink-0 shadow-xs transition-all hover:scale-105"
                  >
                    Subscribe →
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 2 — SHOP (2.3 Cols) */}
          <div className="lg:col-span-2.5 space-y-3.5">
            <div
              onClick={() => toggleSection('shop')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-slate-800 pb-2 md:pb-0"
            >
              <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-emerald-300">
                SHOP
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-400 md:hidden" />
            </div>

            {openSections.shop && (
              <ul className="space-y-3 text-sm font-sans text-slate-300">
                <li>
                  <Link to="/digital-products" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Digital Products
                  </Link>
                </li>
                <li>
                  <Link to="/store" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Software Store
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Services
                  </Link>
                </li>
                <li>
                  <Link to="/remote-support" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Remote Support
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=orders" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Downloads
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Column 3 — SUPPORT (2.3 Cols) */}
          <div className="lg:col-span-2.5 space-y-3.5">
            <div
              onClick={() => toggleSection('support')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-slate-800 pb-2 md:pb-0"
            >
              <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-emerald-300">
                SUPPORT
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-400 md:hidden" />
            </div>

            {openSections.support && (
              <ul className="space-y-3 text-sm font-sans text-slate-300">
                <li>
                  <Link to="/services" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=orders" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=account" className="hover:text-emerald-400 transition-colors duration-200 block">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=orders" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Download Center
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Column 4 — COMPANY & LEGAL (2.2 Cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <div
              onClick={() => toggleSection('company')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-slate-800 pb-2 md:pb-0"
            >
              <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-emerald-300">
                COMPANY & LEGAL
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-400 md:hidden" />
            </div>

            {openSections.company && (
              <ul className="space-y-3 text-sm font-sans text-slate-300">
                <li>
                  <Link to="/about" className="hover:text-emerald-400 transition-colors duration-200 block">
                    About Omove Store
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Blog & Tutorials
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Refund & Return Policy
                  </Link>
                </li>
                <li>
                  <Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/delivery-policy" className="hover:text-emerald-400 transition-colors duration-200 block">
                    Digital Product Policy
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Redesigned Minimal Horizontal Trust Strip */}
      <div className="border-t border-emerald-500/20 bg-slate-950/40 py-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Secure Checkout</span>
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>Digital Delivery</span>
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>

          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-emerald-400" />
            <span>Customer Support</span>
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>

          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Transparent Refunds</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <p>© 2026 Omove Store. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">
              Terms
            </Link>
            <Link to="/refund-policy" className="hover:text-emerald-400 transition-colors">
              Refund Policy
            </Link>
            <Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
