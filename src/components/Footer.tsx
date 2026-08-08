import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Headphones,
  Zap,
  RefreshCw,
  ChevronDown,
  Mail,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';

interface FooterProps {
  setCurrentView?: (view: string) => void;
  setSelectedCategory?: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView, setSelectedCategory }) => {
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
    <footer className="bg-slate-950 text-slate-300 font-sans border-t border-slate-800/80">
      {/* Compact Support CTA Strip */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-sans">Need help with your order?</h4>
              <p className="text-xs text-slate-400">Talk to Omove Store Support and we'll help you get it sorted.</p>
            </div>
          </div>

          <Link
            to="/contact"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all hover:scale-105 shrink-0"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main 4-Column Footer */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Column 1 — OMOVE STORE (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-extrabold text-sm font-mono shadow-xs">
                O
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight font-sans">
                OMOVE STORE
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Digital products, software solutions and reliable PC support — built for students, creators, professionals and everyday PC users.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-emerald-400 pt-1">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure Payments</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Support</span>
              </span>
            </div>

            {/* Compact Newsletter Input */}
            <div className="pt-2 max-w-sm">
              <span className="text-[11px] font-mono font-bold text-slate-400 block mb-1.5">
                Get useful PC fixes & software updates.
              </span>
              {isSubscribed ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  ✓ Thank you for subscribing!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shrink-0 transition-all"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 2 — SHOP (2.5 Cols) */}
          <div className="lg:col-span-2.5 space-y-3">
            <div
              onClick={() => toggleSection('shop')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-slate-800 pb-2 md:pb-0"
            >
              <h3 className="text-[11px] font-extrabold uppercase font-mono tracking-wider text-slate-400">
                SHOP
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-500 md:hidden" />
            </div>

            {openSections.shop && (
              <ul className="space-y-2.5 text-xs font-sans text-slate-400">
                <li>
                  <Link to="/digital-products" className="hover:text-emerald-400 transition-colors">
                    Digital Products
                  </Link>
                </li>
                <li>
                  <Link to="/store" className="hover:text-emerald-400 transition-colors">
                    Software Store
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-emerald-400 transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <Link to="/remote-support" className="hover:text-emerald-400 transition-colors">
                    Remote Support
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=orders" className="hover:text-emerald-400 transition-colors">
                    Downloads
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Column 3 — SUPPORT (2.5 Cols) */}
          <div className="lg:col-span-2.5 space-y-3">
            <div
              onClick={() => toggleSection('support')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-slate-800 pb-2 md:pb-0"
            >
              <h3 className="text-[11px] font-extrabold uppercase font-mono tracking-wider text-slate-400">
                SUPPORT
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-500 md:hidden" />
            </div>

            {openSections.support && (
              <ul className="space-y-2.5 text-xs font-sans text-slate-400">
                <li>
                  <Link to="/services" className="hover:text-emerald-400 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-emerald-400 transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=orders" className="hover:text-emerald-400 transition-colors">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=account" className="hover:text-emerald-400 transition-colors">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard?tab=orders" className="hover:text-emerald-400 transition-colors">
                    Download Center
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Column 4 — COMPANY & LEGAL (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div
              onClick={() => toggleSection('company')}
              className="flex items-center justify-between cursor-pointer md:cursor-default border-b md:border-b-0 border-slate-800 pb-2 md:pb-0"
            >
              <h3 className="text-[11px] font-extrabold uppercase font-mono tracking-wider text-slate-400">
                COMPANY & LEGAL
              </h3>
              <ChevronDown className="w-4 h-4 text-slate-500 md:hidden" />
            </div>

            {openSections.company && (
              <ul className="space-y-2.5 text-xs font-sans text-slate-400">
                <li>
                  <Link to="/about" className="hover:text-emerald-400 transition-colors">
                    About Omove Store
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-emerald-400 transition-colors">
                    Blog & Tutorials
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-emerald-400 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-emerald-400 transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-emerald-400 transition-colors">
                    Refund & Return Policy
                  </Link>
                </li>
                <li>
                  <Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/delivery-policy" className="hover:text-emerald-400 transition-colors">
                    Digital Product Policy
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Minimal Trust Strip */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 py-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-around gap-4 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>SECURE CHECKOUT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>DIGITAL DELIVERY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-emerald-400" />
            <span>CUSTOMER SUPPORT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>TRANSPARENT REFUNDS</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 bg-slate-950 py-5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© 2026 Omove Store. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <Link to="/refund-policy" className="hover:text-slate-300 transition-colors">
              Refund Policy
            </Link>
            <Link to="/cookie-policy" className="hover:text-slate-300 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
