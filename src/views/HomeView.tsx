import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Product, RemoteService, RemoteBooking, BlogPost } from '../types';
import { sendAdminOrderNotificationEmail } from '../utils/emailNotifier';
import { validateAndApplyCoupon } from '../utils/couponManager';
import { useOnlineStatus } from '../components/OfflineBanner';
import { CATEGORIES, MOCK_PRODUCTS } from '../data/mockData';
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
  Wrench,
  Check,
  Lock,
  X,
  Zap,
  Monitor,
  DownloadCloud,
  ExternalLink,
  MessageSquare,
  Tag,
  WifiOff,
  Heart,
  ShoppingBag
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
  onBookingSuccess?: (booking: RemoteBooking) => void;
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
  onBookingSuccess,
  setCurrentView,
  setSelectedCategory
}) => {
  const isOnline = useOnlineStatus();
  const [diagnosticIssue, setDiagnosticIssue] = useState<string>('bsod');

  // Booking Modal State directly on Home Page
  const [activeBookingService, setActiveBookingService] = useState<RemoteService | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestGateway, setShowTestGateway] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<RemoteBooking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<RemoteBooking | null>(null);

  // Coupon state for booking form
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const handleApplyBookingCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeBookingService) return;
    const res = validateAndApplyCoupon(couponInput, activeBookingService.price);
    if (res.valid) {
      setAppliedDiscount(res.discountAmount);
      setCouponMessage(res.message);
    } else {
      setAppliedDiscount(0);
      setCouponMessage(res.message);
    }
  };

  const displayFeaturedProducts = React.useMemo(() => {
    const sourceList = products || [];
    const pool = sourceList.filter(
      (p) => (p.status || 'PUBLISHED') === 'PUBLISHED'
    );

    const getPriorityScore = (p: Product) => {
      let score = 0;
      if (p.isFeatured) score += 100;
      if (p.isBestSeller) score += 50;
      if (p.salesCount && p.salesCount > 0) score += 20;
      if (p.discountPercent > 0 || (p.originalPrice && p.originalPrice > p.price)) score += 10;
      if (p.isNew) score += 5;
      return score;
    };

    const sorted = [...pool].sort((a, b) => {
      const scoreDiff = getPriorityScore(b) - getPriorityScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.rating || 0) - (a.rating || 0);
    });

    return sorted.slice(0, 4);
  }, [products]);

  const handleCategoryClick = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartBooking = (srv: RemoteService) => {
    setActiveBookingService(srv);
    setConfirmedBooking(null);
    setShowTestGateway(false);
    setCouponInput('');
    setAppliedDiscount(0);
    setCouponMessage('');
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingService) return;
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      alert("You’re offline. Please reconnect to the internet to purchase this product.");
      return;
    }
    setIsSubmitting(true);

    const finalPrice = Math.max(0, activeBookingService.price - appliedDiscount);

    const generatedBookingNum = 'OMV-BOOK-' + Math.floor(1000 + Math.random() * 9000);
    const generatedId = 'bk-' + Date.now();

    const fullClientBooking: RemoteBooking = {
      id: generatedId,
      bookingNumber: generatedBookingNum,
      customerName: customerName || 'Client',
      email: email || 'customer@example.com',
      phone: phone || '+91 8345968169',
      serviceId: activeBookingService.id,
      serviceTitle: activeBookingService.title,
      issueCategory: activeBookingService.category,
      problemDescription: problemDescription || 'Remote PC inspection & repair requested.',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '10:00 AM',
      remoteTool: 'AnyDesk',
      remoteId: remoteId || '982 110 449',
      remotePassword: '',
      amount: finalPrice,
      paymentStatus: 'Paid',
      status: 'Technician Assigned',
      technicianName: 'David Chen (Cert #8821)',
      createdAt: new Date().toISOString()
    };

    let bookingObj: RemoteBooking = fullClientBooking;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullClientBooking)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.booking) {
          bookingObj = { ...fullClientBooking, ...data.booking };
        }
      }
    } catch (err) {
      console.warn('Backend API unavailable, using client-side booking construction:', err);
    }

    if (finalPrice <= 0) {
      if (bookingObj) {
        bookingObj.razorpayPaymentId = 'FREE_COUPON_' + Date.now();
        setConfirmedBooking(bookingObj);
        if (onBookingSuccess) onBookingSuccess(bookingObj);
        sendAdminOrderNotificationEmail({
          type: 'REMOTE_BOOKING',
          customerName: bookingObj.customerName,
          email: bookingObj.email,
          phone: bookingObj.phone,
          title: bookingObj.serviceTitle,
          amount: 0,
          paymentId: 'FREE (100% Coupon Discount)',
          orderOrBookingId: bookingObj.bookingNumber,
          remoteId: bookingObj.remoteId,
          problemDescription: bookingObj.problemDescription
        });
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
      setIsSubmitting(false);
      return;
    }

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G';

      if (typeof (window as any).Razorpay === 'undefined') {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }

      if (typeof (window as any).Razorpay !== 'undefined') {
        const options = {
          key: razorpayKey,
          amount: Math.round(finalPrice * 100),
          currency: 'INR',
          name: 'OMOVE TECH Engine',
          description: `PC Service: ${activeBookingService.title}`,
          image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&auto=format&fit=crop&q=80',
          prefill: {
            name: customerName,
            email: email,
            contact: phone
          },
          theme: { color: '#059669' },
          handler: function (response: any) {
            if (bookingObj) {
              bookingObj.razorpayPaymentId = response.razorpay_payment_id || ('pay_' + Date.now());
              setConfirmedBooking(bookingObj);
              if (onBookingSuccess) onBookingSuccess(bookingObj);
              sendAdminOrderNotificationEmail({
                type: 'REMOTE_BOOKING',
                customerName: bookingObj.customerName,
                email: bookingObj.email,
                phone: bookingObj.phone,
                title: bookingObj.serviceTitle,
                amount: bookingObj.amount,
                paymentId: bookingObj.razorpayPaymentId,
                orderOrBookingId: bookingObj.bookingNumber,
                remoteId: bookingObj.remoteId,
                problemDescription: bookingObj.problemDescription
              });
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
          },
          modal: {
            ondismiss: function () {
              console.log('Razorpay payment popup closed by user');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        setPendingBooking(bookingObj);
        setShowTestGateway(true);
      }
    } catch (err) {
      console.error('Razorpay popup trigger error:', err);
      if (bookingObj) {
        setPendingBooking(bookingObj);
        setShowTestGateway(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTestPayment = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (pendingBooking) {
        setConfirmedBooking(pendingBooking);
        if (onBookingSuccess) onBookingSuccess(pendingBooking);
        sendAdminOrderNotificationEmail({
          type: 'REMOTE_BOOKING',
          customerName: pendingBooking.customerName,
          email: pendingBooking.email,
          phone: pendingBooking.phone,
          title: pendingBooking.serviceTitle,
          amount: pendingBooking.amount,
          paymentId: pendingBooking.razorpayPaymentId || 'TEST_SIMULATED',
          orderOrBookingId: pendingBooking.bookingNumber,
          remoteId: pendingBooking.remoteId,
          problemDescription: pendingBooking.problemDescription
        });
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      setIsSubmitting(false);
      setShowTestGateway(false);
    }, 1000);
  };

  const handleCloseModal = () => {
    setActiveBookingService(null);
    setShowTestGateway(false);
    setConfirmedBooking(null);
  };

  return (
    <div className="space-y-8 sm:space-y-16 pb-12 sm:pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#04392b] to-[#0f172a] text-white pt-8 sm:pt-16 pb-12 sm:pb-24 border-b border-emerald-500/20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT SIDE - HERO TEXT */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] sm:text-xs font-mono font-bold tracking-wider shadow-sm max-w-full">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 animate-pulse shrink-0" />
                <span className="truncate">CERTIFIED REMOTE REPAIR & SOFTWARE SOLUTIONS</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-snug sm:leading-tight">
                Instant PC Repair <br className="hidden sm:block" />
                <span className="text-emerald-400">Direct Remote Support</span>
              </h1>

              <p className="text-xs sm:text-base text-emerald-100/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
                Fix Blue Screen crashes, driver failures, Windows activation, and malware remotely via AnyDesk. Plus digital software tools delivered instantly.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const targetService = services.find((s) => s.id === 'srv-001') || services[0] || {
                      id: 'srv-001',
                      title: 'Remote PC Support',
                      description: 'Get secure remote support from certified technicians.',
                      price: 39,
                      originalPrice: 499,
                      category: 'Windows Fix',
                      estimatedTime: '15 Mins',
                      iconName: 'Search',
                      popular: true,
                      features: ['Direct Expert Support', 'PC & Software Solutions', 'Secure Remote Repair', 'WhatsApp Support']
                    };
                    handleStartBooking(targetService as RemoteService);
                  }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs sm:text-sm tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>BOOK REMOTE REPAIR (₹39)</span>
                </button>

                <a
                  href="/support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  <Heart className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                  <span>SUPPORT Omove Store</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 sm:pt-8 border-t border-emerald-800/60 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-8 text-[11px] sm:text-sm font-mono text-emerald-100/80">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex text-amber-300">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                  <span className="font-bold text-white">4.6 Rating</span>
                </div>

                <div className="h-4 w-[1px] bg-emerald-700/60 hidden sm:block" />

                <div>
                  <span className="font-bold text-white">1,000+</span> Happy Customers
                </div>

                <div className="h-4 w-[1px] bg-emerald-700/60 hidden sm:block" />

                <div className="flex items-center gap-1.5 text-emerald-300">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="font-bold">&lt;15 Mins</span> Response
                </div>
              </div>

            </div>

            {/* RIGHT SIDE - ANIMATED REMOTE PC SUPPORT SERVICE CARD */}
            <div className="lg:col-span-6 relative mt-4 lg:mt-0">
              <div className="relative mx-auto max-w-xl lg:max-w-none">
                {/* Glowing Pulsing Aura */}
                <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-[32px] sm:rounded-[44px] blur-xl sm:blur-2xl opacity-35 animate-pulse-glow pointer-events-none" />

                {/* Floating Card Wrapper */}
                <div className="relative bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[32px] border-2 border-emerald-500/50 shadow-2xl space-y-4 sm:space-y-6 text-slate-900 transition-all duration-500 hover:border-emerald-500 hover:shadow-emerald-500/20 hover:scale-[1.01] animate-float">
                  
                  {/* Header Badges with Live Ping */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] sm:text-xs font-mono font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                      <span>Windows Fix</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-emerald-700 font-mono font-bold flex items-center gap-1 sm:gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      15 Mins Response
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-snug">Remote PC Support</h3>
                      <span className="px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-black bg-amber-400 text-slate-950 uppercase tracking-wider animate-bounce">
                        POPULAR
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 sm:mt-2.5 leading-relaxed">
                      Get secure remote support from certified technicians. We connect to your PC using AnyDesk and stay in touch through WhatsApp to diagnose, troubleshoot, and resolve your Windows or software issues quickly and safely.
                    </p>
                  </div>

                  {/* Feature List */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-mono block">
                      Included Service Features:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 text-xs text-slate-800 font-medium">
                      {['Direct Expert Support', 'PC & Software Solutions', 'Secure Remote Repair', 'WhatsApp Support'].map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 group">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Refund Guarantee Badge */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs text-emerald-950 shadow-xs space-y-1 mt-4 transition-all hover:bg-emerald-100/60">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold font-mono">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="uppercase text-[10px] sm:text-[11px] tracking-wider">100% Refund Guarantee</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-emerald-900 leading-relaxed font-sans">
                        If we're unable to resolve your issue, your payment will be automatically refunded within 2–3 business days.
                      </p>
                    </div>
                  </div>

                  {/* Pricing CTA Box - Direct Order Trigger */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3 sm:space-y-4 shadow-xl relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Special Inspection Fee</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">₹39</span>
                          <span className="text-xs text-slate-500 line-through font-mono">₹499</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-[10px] sm:text-xs font-mono font-black shadow-md animate-pulse">
                        SAVE 92% TODAY
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetService = services.find((s) => s.id === 'srv-001') || services[0] || {
                          id: 'srv-001',
                          title: 'Remote PC Support',
                          description: 'Get secure remote support from certified technicians.',
                          price: 39,
                          originalPrice: 499,
                          category: 'Windows Fix',
                          estimatedTime: '15 Mins',
                          iconName: 'Search',
                          popular: true,
                          features: ['Direct Expert Support', 'PC & Software Solutions', 'Secure Remote Repair', 'WhatsApp Support']
                        };
                        handleStartBooking(targetService as RemoteService);
                      }}
                      className="w-full py-3.5 sm:py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm font-mono tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      <span>PAY ₹39 & GET INSTANT REPAIR</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* 3. FEATURED PRODUCTS SECTION */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 space-y-6 sm:space-y-8 my-8 sm:my-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold mb-2">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>OFFICIAL CATALOG</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore our popular digital products, software and PC solutions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 self-start sm:self-auto group transition-colors"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {displayFeaturedProducts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-mono text-xs">
            No products available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayFeaturedProducts.map((product) => {
              const categoryLabel = product.productType === 'DIGITAL'
                ? 'DIGITAL PRODUCT'
                : (product.productType === 'STORE' ? 'STORE' : (product.category ? product.category.toUpperCase() : 'STORE'));
              const isWishlisted = wishlist.includes(product.id);
              const showPopular = Boolean(product.isFeatured || product.isBestSeller);
              const hasDiscount = product.discountPercent > 0 || (product.originalPrice && product.originalPrice > product.price);
              const calcDiscount = product.discountPercent || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-emerald-500/60 transition-all duration-300 hover:-translate-y-1.5 shadow-xs hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40" />

                      {/* Top Category & Popular Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                          {categoryLabel}
                        </span>
                        {showPopular && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                            POPULAR
                          </span>
                        )}
                      </div>

                      {/* Wishlist Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product.id);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border transition-all z-10 ${
                          isWishlisted
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-white/80 text-slate-700 border-slate-200 hover:text-slate-950 hover:bg-white'
                        }`}
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{product.rating || 5.0}</span>
                          <span className="text-slate-400">({product.reviewCount || 12})</span>
                        </div>
                        {product.licenseType && (
                          <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[120px]">
                            {product.licenseType}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {product.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="p-5 pt-0 mt-auto">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black font-mono text-slate-900">₹{product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through font-mono">₹{product.originalPrice}</span>
                          )}
                        </div>
                        {hasDiscount && calcDiscount > 0 && (
                          <span className="text-[10px] font-bold font-mono text-emerald-600">
                            SAVE {calcDiscount}%
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(product);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 group-hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                      >
                        <span>View Product</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. RECENT KNOWLEDGE BASE GUIDES */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Latest Technical Guides & Solutions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Expert repair guides written by certified engineers</p>
          </div>

          <button
            onClick={() => {
              setCurrentView('blog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
          >
            <span>Explore Knowledge Base ({blogs.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {blogs.slice(0, 2).map((b) => (
            <div
              key={b.id}
              onClick={() => {
                setCurrentView('blog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-100">
                  <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-xs font-mono font-bold">
                    {b.category}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-1">{b.publishedAt} • By {b.author}</span>
                  <h3 className="font-extrabold text-xl text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">{b.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{b.excerpt}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-mono">
                <span className="text-emerald-700 font-bold">{b.readTime} read</span>
                <span className="text-slate-900 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Read Article</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SELF-CONTAINED BOOKING & PAYMENT MODAL DIRECTLY ON HOME PAGE */}
      {activeBookingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white border-b border-emerald-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-mono">
                    {confirmedBooking ? 'BOOKING VERIFIED' : 'PC INSPECTION BOOKING'}
                  </h3>
                  <p className="text-[11px] text-emerald-300 font-mono">{activeBookingService.title} (₹{activeBookingService.price})</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-xl bg-emerald-900 text-emerald-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View 1: Confirmed & Post-Purchase WhatsApp Button */}
            {confirmedBooking ? (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">Payment Successful & Booking Confirmed!</h3>
                  <p className="text-xs text-slate-600">
                    Booking ID: <strong className="font-mono text-emerald-700">{confirmedBooking.bookingNumber}</strong>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <span className="text-xs text-emerald-800 font-mono font-bold block uppercase tracking-wider">
                    ✅ TECHNICIAN ONLINE & ASSIGNED
                  </span>
                  <p className="text-xs text-slate-600">
                    Click below to start live 1-on-1 remote PC inspection chat directly on WhatsApp!
                  </p>
                  <a
                    href={`https://wa.me/918345968169?text=${encodeURIComponent(
                      `Hello OMOVE Expert! I paid ₹${activeBookingService.price} for PC Inspection.\nBooking ID: ${confirmedBooking.bookingNumber}\nName: ${confirmedBooking.customerName}\nPhone: ${confirmedBooking.phone}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-sm font-extrabold inline-flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>CONNECT WITH TECHNICIAN ON WHATSAPP NOW</span>
                    <ExternalLink className="w-4 h-4 opacity-80" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
                >
                  CLOSE WINDOW
                </button>
              </div>
            ) : showTestGateway ? (
              /* View 2: Razorpay Test Gateway */
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold uppercase">
                      RAZORPAY TEST GATEWAY
                    </span>
                    <span className="text-xl font-mono font-extrabold text-slate-900">₹{activeBookingService.price}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Simulating secure payment gateway transaction. Click below to verify payment and connect with your technician.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Customer</span>
                    <span className="text-slate-900 font-bold">{customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Remote Tool</span>
                    <span className="text-emerald-700 font-bold">AnyDesk (WhatsApp Connected)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Service</span>
                    <span className="text-slate-900">{activeBookingService.title}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmTestPayment}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm font-mono tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>VERIFYING PAYMENT...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>COMPLETE SIMULATED PAYMENT (₹{activeBookingService.price})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* View 3: Customer Form */
              <form onSubmit={handleProceedToPayment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">WhatsApp Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* AnyDesk Official Download Card */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 font-sans">
                      <div className="flex items-center gap-1.5 text-slate-900 font-mono font-bold text-xs">
                        <Monitor className="w-4 h-4 text-emerald-600" />
                        <span>AnyDesk Remote Software</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Download free AnyDesk so our expert can inspect your PC live.
                      </p>
                    </div>
                    <a
                      href="https://anydesk.com/en/downloads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap transition-all"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>Download AnyDesk</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  </div>

                  {/* Promo Coupon Code Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-slate-700 font-bold flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Have a Discount Coupon?</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Try: OMOVE15</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBookingCoupon}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all"
                      >
                        APPLY
                      </button>
                    </div>

                    {couponMessage && (
                      <p className={`text-[11px] font-mono font-bold ${appliedDiscount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {couponMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isOnline}
                    className={`w-full py-4 rounded-2xl font-extrabold text-sm font-mono tracking-wider shadow-md flex items-center justify-center gap-2 transition-all ${
                      !isOnline
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {!isOnline ? (
                      <>
                        <WifiOff className="w-4 h-4 text-rose-400" />
                        <span>OFFLINE — CHECKOUT UNAVAILABLE</span>
                      </>
                    ) : isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>PREPARING CHECKOUT...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>PAY ₹{Math.max(0, activeBookingService.price - appliedDiscount)} & GET INSTANT REPAIR</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
