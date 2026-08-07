import React, { useState } from 'react';
import { Product, RemoteService, BlogPost } from '../types';
import { CATEGORIES } from '../data/mockData';
import { ProductCard } from '../components/ProductCard';
import {
  ShieldCheck,
  Headphones,
  Download,
  CheckCircle2,
  ArrowRight,
  Star,
  Clock,
  ChevronRight,
  Laptop,
  Wrench
} from 'lucide-react';

interface HomeViewProps {
  products: Product[];
  services: RemoteService[];
  blogs: BlogPost[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  setCurrentView: (view: string) => void;
  setSelectedCategory: (cat: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  services,
  blogs,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  wishlist,
  onToggleWishlist,
  setCurrentView,
  setSelectedCategory
}) => {
  const [diagnosticIssue, setDiagnosticIssue] = useState<string>('bsod');

  const featuredProducts = products.filter((p) => p.isFeatured || p.isBestSeller).slice(0, 6);

  const handleCategoryClick = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85dvh] flex items-center justify-center py-12 lg:py-16 overflow-hidden bg-gradient-to-br from-[#042F2E] via-[#064E3B] to-[#0f172a] text-white rounded-b-[40px] shadow-xl">
        {/* Soft Ambient Background Mesh Glows */}
        <div className="absolute top-1/4 left-1/4 w-[650px] h-[450px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[400px] bg-teal-400/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="w-full max-w-[1536px] mx-auto px-6 sm:px-10 lg:px-14 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* LEFT SIDE CONTENT */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              
              {/* Certified Remote Experts Badge */}
              <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-200 text-xs font-mono font-bold shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span className="tracking-wide">Certified Remote PC Experts</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
                Fix Your Windows PC <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                  Without Leaving Home.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-xl text-emerald-100/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
                We professionally repair PCs remotely. Get live, 1-on-1 troubleshooting for Windows errors, BSOD crashes, driver installations, and instant access to genuine software licenses.
              </p>

              {/* Trust Points */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs sm:text-sm font-mono text-emerald-100 max-w-2xl mx-auto lg:mx-0">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span>Certified Experts</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span>Secure Session</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span>Genuine Software</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span>Instant Downloads</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <button
                  onClick={() => {
                    setCurrentView('remote-support');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-9 py-4.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base font-mono tracking-wider shadow-2xl shadow-emerald-500/35 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  <Wrench className="w-5 h-5" />
                  <span>FIX MY PC</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setCurrentView('store');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-9 py-4.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-base font-mono tracking-wider border border-white/20 flex items-center justify-center gap-3 transition-all hover:-translate-y-1"
                >
                  <Download className="w-5 h-5 text-emerald-300" />
                  <span>BROWSE DIGITAL STORE</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-emerald-800/60 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-xs sm:text-sm font-mono text-emerald-100/80">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-300">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                  <span className="font-bold text-white">4.9 Rating</span>
                </div>

                <div className="h-4 w-[1px] bg-emerald-700/60 hidden sm:block" />

                <div>
                  <span className="font-bold text-white">25,000+</span> Repairs
                </div>

                <div className="h-4 w-[1px] bg-emerald-700/60 hidden sm:block" />

                <div className="flex items-center gap-1.5 text-emerald-300">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">&lt;15 Mins</span> Response
                </div>
              </div>

            </div>

            {/* RIGHT SIDE - LAPTOP MOCKUP */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-xl lg:max-w-none">
                
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[40px] blur-2xl opacity-25 animate-pulse pointer-events-none" />

                <div className="relative bg-slate-900 p-5 sm:p-7 rounded-[32px] border border-slate-700 shadow-2xl space-y-4 animate-float">
                  
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
                      <span className="text-xs font-mono text-slate-400 ml-2 font-semibold">OMOVE Remote Tech Console v2026</span>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Technician Online</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-5 font-mono text-xs sm:text-sm shadow-inner">
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="flex items-center gap-2.5 text-white font-bold">
                          <Headphones className="w-4.5 h-4.5 text-emerald-400" />
                          Connecting Certified Expert...
                        </span>
                        <span className="text-emerald-400 font-bold">100% Connected</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-full rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="flex items-center gap-2.5 text-white font-bold">
                          <Wrench className="w-4.5 h-4.5 text-cyan-400" />
                          Installing Drivers & Optimizing OS...
                        </span>
                        <span className="text-emerald-400 font-bold">Done</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 w-full rounded-full animate-pulse" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-extrabold text-white text-sm block">Repair Complete</span>
                          <span className="text-xs text-slate-400 font-sans">Windows System Verified & Optimized</span>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">
                        ✓ SYSTEM HEALTHY
                      </span>
                    </div>

                  </div>

                  <div className="pt-2 flex justify-center">
                    <div className="w-32 h-1.5 bg-slate-700 rounded-full" />
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE DIAGNOSIS TOOL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md space-y-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
                1-Click Troubleshooting Guide
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                What Problem Are You Facing With Your PC?
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-xs font-medium">
              Select your system issue below to view our instant solution or get remote expert assistance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'bsod', label: 'Blue Screen (BSOD)', desc: 'IRQL, Memory Dump, WHEA Error' },
              { id: 'slow', label: 'Slow PC / High CPU', desc: '100% Disk usage, laggy performance' },
              { id: 'drivers', label: 'Missing Drivers / WiFi', desc: 'No sound, graphics or network' },
              { id: 'virus', label: 'Malware / Ransomware', desc: 'Popups, hijacked browser, locked files' }
            ].map((issue) => (
              <button
                key={issue.id}
                onClick={() => setDiagnosticIssue(issue.id)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  diagnosticIssue === issue.id
                    ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm font-mono text-slate-900">{issue.label}</span>
                  {diagnosticIssue === issue.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500">{issue.desc}</p>
              </button>
            ))}
          </div>

          {/* Diagnostic Result Output Box */}
          <div className="p-6 rounded-2xl bg-emerald-900 text-white border border-emerald-800 grid md:grid-cols-3 gap-6 items-center shadow-inner">
            <div className="md:col-span-2 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-700">
                RECOMMENDED ACTION PLAN
              </span>
              <h3 className="text-lg font-bold text-white">
                {diagnosticIssue === 'bsod' && 'WHEA & Minidump Sector Diagnostic Service'}
                {diagnosticIssue === 'slow' && 'OMOVE WinMaster Pro 2026 Debloater'}
                {diagnosticIssue === 'drivers' && 'DriverVault Offline All-in-One 38GB Pack'}
                {diagnosticIssue === 'virus' && 'Deep Malware & Trojan Rootkit Purge Service'}
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
                {diagnosticIssue === 'bsod' && 'Our certified experts connect via AnyDesk to analyze your memory dumps, fix corrupt registry keys, and isolate hardware voltage faults.'}
                {diagnosticIssue === 'slow' && 'Download WinMaster Pro 2026 to safely disable background telemetry, clear 40GB+ temp junk, and optimize RAM scheduling instantly.'}
                {diagnosticIssue === 'drivers' && 'Get 1,200,000+ hardware drivers offline. Install missing WiFi, NVIDIA graphics, and chipset drivers with zero internet required.'}
                {diagnosticIssue === 'virus' && 'Connect remotely with a technician to execute deep boot-time rootkit scans and restore hijacked browser configurations.'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (diagnosticIssue === 'slow' || diagnosticIssue === 'drivers') {
                    setCurrentView('store');
                  } else {
                    setCurrentView('remote-support');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="py-3.5 px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-md shadow-emerald-400/20"
              >
                <span>GET INSTANT SOLUTION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
                Top Software & Digital Tools
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Popular Digital Downloads
              </h2>
            </div>
            <button
              onClick={() => {
                setCurrentView('store');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-bold font-mono text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>VIEW ALL DIGITAL PRODUCTS</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. POPULAR PRODUCT CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
            Browse By Category
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Explore Digital Ecosystem
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.slice(0, 10).map((cat) => (
            <div
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500/40 hover:shadow-md cursor-pointer transition-all space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{cat.description}</p>
                <span className="text-[10px] text-emerald-700 font-mono font-bold mt-2 inline-block">
                  {cat.count} items
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. REMOTE COMPUTER SUPPORT SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#064E3B] via-slate-900 to-[#042F2E] text-white border border-emerald-500/30 shadow-xl relative overflow-hidden grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold">
              <Headphones className="w-4 h-4 text-emerald-300" />
              <span>LIVE CERTIFIED TECHNICIAN SUPPORT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Remote PC Support
            </h2>

            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Get secure remote support from certified technicians. We connect to your PC using AnyDesk and stay in touch through WhatsApp to diagnose, troubleshoot, and resolve your Windows or software issues quickly and safely.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 text-xs text-emerald-100 font-mono">
              {[
                'Direct Expert Support',
                'PC & Software Solutions',
                'Secure Remote Repair',
                'WhatsApp Support'
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Refund Guarantee Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-400/30 flex items-start gap-2.5 text-xs text-emerald-200">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="text-white block font-mono font-bold text-[11px] uppercase tracking-wider mb-0.5">100% Automatic Refund Guarantee</strong>
                If we're unable to resolve your issue, your payment will be automatically refunded within 2–3 business days.
              </span>
            </div>

            <button
              onClick={() => {
                setCurrentView('remote-support');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs font-mono tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <span>BOOK REMOTE SERVICE NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Remote Workflow Diagram */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs text-slate-200">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              3-Step Remote Repair Workflow
            </h4>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center">1</span>
                <div>
                  <h5 className="font-bold text-white text-xs">Select Service & Book</h5>
                  <p className="text-[10px] text-slate-400">Choose issue & enter AnyDesk ID</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center">2</span>
                <div>
                  <h5 className="font-bold text-white text-xs">Technician Connects Live</h5>
                  <p className="text-[10px] text-slate-400">Accept connection request on your desktop screen</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-400 text-slate-950 font-bold flex items-center justify-center">3</span>
                <div>
                  <h5 className="font-bold text-white text-xs">Issue Solved & Invoice Issued</h5>
                  <p className="text-[10px] text-slate-400">System tested, report generated & invoice emailed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LATEST BLOG POSTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
              Tech Knowledge Base
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Latest PC Repair Tutorials & Guides
            </h2>
          </div>
          <button
            onClick={() => {
              setCurrentView('blog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-bold font-mono text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>VIEW ALL BLOGS</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {blogs.slice(0, 2).map((post) => (
            <div
              key={post.id}
              onClick={() => {
                setCurrentView('blog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-500/40 cursor-pointer transition-all space-y-4 hover:shadow-md"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {post.category}
                </span>
                <span>{post.readTime}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span>By {post.author} ({post.authorRole})</span>
                <span className="text-emerald-700 font-bold font-mono flex items-center gap-1">
                  Read Article <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
