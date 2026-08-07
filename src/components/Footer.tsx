import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck, Mail, Phone, Lock, Heart, ArrowRight, MessageSquare, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  setSelectedCategory: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setSelectedCategory }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
      setEmail('');
    }
  };

  const navigateToCategory = (cat: string) => {
    setSelectedCategory(cat);
    navigate('/store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#064E3B] pt-16 pb-12 text-emerald-100 text-sm">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section Card */}
        <div className="mb-16 p-8 rounded-3xl bg-[#04392b] border border-emerald-700/60 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs tracking-wider uppercase mb-2">
                <Zap className="w-4 h-4" />
                <span>Stay Ahead in Tech & PC Fixes</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Get Weekly Windows Fixes, Driver Alerts & Exclusive Discounts
              </h3>
              <p className="text-emerald-100/80 text-sm mt-2">
                Join 1,000+ happy customers and PC enthusiasts. Zero spam, unsubscribe anytime.
              </p>
            </div>
            <div>
              {subscribed ? (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Subscription Confirmed!</p>
                    <p className="text-xs text-emerald-200/80">Check your inbox for a 15% discount coupon code (OMOVE15).</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-[#032a1f] border border-emerald-600/60 text-white placeholder-emerald-300/50 focus:outline-none focus:border-emerald-300 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-3 inline-flex">
              <img
                src="/logo.png"
                alt="Omove Store Logo"
                className="h-12 w-auto object-contain"
              />
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Omove<span className="text-emerald-300">Store</span>
              </span>
            </Link>
            <p className="text-emerald-100/90 text-sm leading-relaxed max-w-sm">
              Omove Store is your premier digital products, software solutions, and remote computer support platform. Buy genuine software licenses, tools, and connect with certified experts live via AnyDesk.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-white bg-[#04392b] px-3 py-1.5 rounded-lg border border-emerald-700/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified SSL</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white bg-[#04392b] px-3 py-1.5 rounded-lg border border-emerald-700/60">
                <Lock className="w-4 h-4 text-emerald-300" />
                <span>Instant Keys</span>
              </div>
            </div>
          </div>

          {/* Software Categories */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Digital Store</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => navigateToCategory('Windows Tools')} className="hover:text-emerald-300 transition-colors">
                  Windows Tools & Debloat
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory('Software')} className="hover:text-emerald-300 transition-colors">
                  PC Software & Utilities
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory('PC Optimization')} className="hover:text-emerald-300 transition-colors">
                  PC Speed Optimizers
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory('Gaming Tools')} className="hover:text-emerald-300 transition-colors">
                  FPS Boosters & Low Latency
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory('Security')} className="hover:text-emerald-300 transition-colors">
                  Anti-Ransomware Suites
                </button>
              </li>
            </ul>
          </div>

          {/* Remote Services */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Remote Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/remote-support" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Remote PC Support (₹39)
                </Link>
              </li>
              <li>
                <Link to="/remote-support" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Blue Screen (BSOD) Fix
                </Link>
              </li>
              <li>
                <Link to="/remote-support" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Deep Malware Elimination
                </Link>
              </li>
              <li>
                <Link to="/remote-support" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Driver & Peripheral Setup
                </Link>
              </li>
              <li>
                <Link to="/remote-support" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  AnyDesk Remote Session
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Company & Help</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/contact" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  About Omove Store
                </Link>
              </li>
              <li>
                <Link to="/dashboard" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Track Orders & Invoices
                </Link>
              </li>
              <li>
                <Link to="/blog" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Tech Blog & Tutorials
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={scrollToTop} className="hover:text-emerald-300 transition-colors">
                  Contact Support Team
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-emerald-700/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-emerald-200/80">
          <p>© 2026 Omove Store Inc. All rights reserved. Built for speed, trust and remote expert support excellence.</p>
          <div className="flex items-center gap-6">
            <span>Powered by Razorpay Secure Payments</span>
            <span>256-Bit SSL Encryption</span>
            <span>AnyDesk Partner</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

