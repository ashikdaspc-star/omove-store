import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Product, RemoteService, RemoteBooking, BlogPost } from '../types';
import { sendAdminOrderNotificationEmail } from '../utils/emailNotifier';
import { validateAndApplyCoupon } from '../utils/couponManager';
import { useOnlineStatus } from '../components/OfflineBanner';
import { MOCK_PRODUCTS } from '../data/mockData';
import { isDigitalProduct } from '../utils/productClassifier';
import { Country, getDefaultCountry, validatePhoneNumber } from '../utils/countryData';
import { PAYPAL_CHECKOUT_ENABLED } from '../config/paymentConfig';
import { CONTACT_CONFIG } from '../config/contactConfig';
import { loadPayPalSDK } from '../utils/paypalLoader';
import { InternationalPhoneInput } from '../components/InternationalPhoneInput';
import { PaymentMethodCards } from '../components/PaymentMethodCards';
import {
  Sparkles,
  ArrowRight,
  Star,
  Download,
  CheckCircle2,
  ShieldCheck,
  Heart,
  ShoppingBag,
  Zap,
  Lock,
  Tag,
  AlertTriangle,
  WifiOff,
  ExternalLink,
  MessageSquare,
  X,
  Package,
  Layers,
  ChevronRight,
  Check,
  TrendingUp,
  FileCheck,
  CreditCard,
  Monitor,
  Clock,
  Search
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
  products = [],
  services = [],
  blogs = [],
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  wishlist = [],
  onToggleWishlist,
  onBookingSuccess,
  setCurrentView,
  setSelectedCategory
}) => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  // Active Category Filter for Products
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Booking Modal State directly on Home Page (Preserved for compatibility)
  const [activeBookingService, setActiveBookingService] = useState<RemoteService | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    cleanNumber: string;
    e164: string;
    country: Country;
  }>(() => {
    const def = getDefaultCountry();
    return { ...validatePhoneNumber('', def), country: def };
  });

  const [remoteId, setRemoteId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestGateway, setShowTestGateway] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<RemoteBooking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<RemoteBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment Method: Razorpay default (PayPal disabled globally)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Coupon state for booking
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const finalPrice = activeBookingService ? Math.max(0, activeBookingService.price - appliedDiscount) : 0;
  const previewUsd = finalPrice > 0 ? finalPrice / 95 : 0;
  const previewUsdDisplay = (Math.round(previewUsd * 100) / 100).toFixed(2);

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

  // State ref for PayPal callbacks
  const paypalHomeRef = useRef({
    activeBookingService,
    customerName,
    email,
    phoneValidation,
    problemDescription,
    finalPrice,
    couponInput
  });

  useEffect(() => {
    paypalHomeRef.current = {
      activeBookingService,
      customerName,
      email,
      phoneValidation,
      problemDescription,
      finalPrice,
      couponInput
    };
  }, [activeBookingService, customerName, email, phoneValidation, problemDescription, finalPrice, couponInput]);

  // PayPal SDK Auto-Loader for Home Booking Modal (Respects PAYPAL_CHECKOUT_ENABLED)
  useEffect(() => {
    if (!PAYPAL_CHECKOUT_ENABLED || !activeBookingService || paymentMethod !== 'paypal' || confirmedBooking) {
      setPaypalReady(false);
      return;
    }

    let isCancelled = false;
    setPaypalLoading(true);

    async function initPayPalHome() {
      try {
        const paypal = await loadPayPalSDK();
        if (isCancelled || !paypal || typeof paypal.Buttons !== 'function') return;

        const container = document.getElementById('paypal-home-booking-button-container');
        if (!container) return;
        container.innerHTML = '';

        paypal.Buttons({
          createOrder: async () => {
            const curr = paypalHomeRef.current;
            setErrorMessage('');

            if (!curr.customerName.trim()) {
              setErrorMessage('Please enter your full name.');
              throw new Error('Name required');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!curr.email.trim() || !emailRegex.test(curr.email.trim())) {
              setErrorMessage('Please enter a valid email address.');
              throw new Error('Valid email required');
            }

            if (!curr.phoneValidation.isValid || !curr.phoneValidation.e164) {
              setPhoneTouched(true);
              setErrorMessage('Please enter a valid WhatsApp number for the selected country.');
              throw new Error('Valid WhatsApp number required');
            }

            setIsSubmitting(true);
            const e164Phone = curr.phoneValidation.e164;

            const payload = {
              orderType: 'booking',
              booking: {
                serviceId: curr.activeBookingService?.id || 'srv-001',
                serviceTitle: curr.activeBookingService?.title || 'Remote PC Support',
                issueCategory: curr.activeBookingService?.category || 'Windows Fix',
                customerName: curr.customerName.trim(),
                customerEmail: curr.email.trim().toLowerCase(),
                customerPhone: e164Phone,
                phone: e164Phone,
                email: curr.email.trim().toLowerCase(),
                problemDescription: curr.problemDescription || 'Quick PC Inspection booking from Home page.',
                preferredDate: new Date().toISOString().split('T')[0],
                preferredTime: '10:00 AM',
                remoteTool: 'AnyDesk',
                remoteId: '000 000 000',
                remotePassword: '',
                couponCode: curr.couponInput || ''
              }
            };

            const createRes = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const createData = await createRes.json();
            if (!createRes.ok || !createData.success || !createData.paypalOrderId) {
              const errMsg = createData.message || createData.error || 'Failed to initialize PayPal booking order.';
              setErrorMessage(errMsg);
              setIsSubmitting(false);
              throw new Error(errMsg);
            }

            setIsSubmitting(false);
            return createData.paypalOrderId;
          },
          onApprove: async (data: any) => {
            setIsSubmitting(true);
            setErrorMessage('');
            try {
              const captureRes = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paypalOrderId: data.orderID })
              });
              const captureData = await captureRes.json();

              if (captureRes.ok && captureData.success && captureData.verified) {
                const verifiedBooking = captureData.booking || {
                  id: 'bk-' + Date.now(),
                  bookingNumber: 'OMV-BOOK-' + Math.floor(1000 + Math.random() * 9000),
                  customerName: paypalHomeRef.current.customerName,
                  email: paypalHomeRef.current.email,
                  phone: paypalHomeRef.current.phoneValidation.e164,
                  serviceTitle: paypalHomeRef.current.activeBookingService?.title || 'Remote PC Support',
                  technicianName: 'Certified Tech (Live Online)',
                  preferredDate: new Date().toISOString().split('T')[0],
                  preferredTime: '10:00 AM',
                  remoteTool: 'AnyDesk',
                  remoteId: '000 000 000',
                  amount: paypalHomeRef.current.finalPrice,
                  paymentStatus: 'Paid',
                  status: 'Technician Assigned'
                };

                setConfirmedBooking(verifiedBooking);
                if (onBookingSuccess) onBookingSuccess(verifiedBooking);

                sendAdminOrderNotificationEmail({
                  type: 'REMOTE_BOOKING',
                  customerName: verifiedBooking.customerName,
                  email: verifiedBooking.email,
                  phone: verifiedBooking.phone,
                  title: verifiedBooking.serviceTitle,
                  amount: verifiedBooking.amount,
                  paymentId: `PayPal: ${data.orderID}`,
                  orderOrBookingId: verifiedBooking.bookingNumber,
                  remoteId: '000 000 000',
                  problemDescription: verifiedBooking.problemDescription
                });

                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
              } else {
                setErrorMessage(captureData.message || captureData.error || 'PayPal verification failed.');
              }
            } catch (err: any) {
              setErrorMessage('PayPal network error. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
          onCancel: () => {
            setErrorMessage('PayPal checkout was cancelled.');
            setIsSubmitting(false);
          },
          onError: (err: any) => {
            console.error('PayPal Home Booking Error:', err);
            setErrorMessage('PayPal checkout encountered an issue. Please try again.');
            setIsSubmitting(false);
          },
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 44
          }
        }).render('#paypal-home-booking-button-container');

        if (!isCancelled) {
          setPaypalReady(true);
          setPaypalLoading(false);
        }
      } catch (e: any) {
        console.error('PayPal home setup failed:', e);
        if (!isCancelled) setPaypalLoading(false);
      }
    }

    const timer = setTimeout(() => {
      initPayPalHome();
    }, 40);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeBookingService, paymentMethod, confirmedBooking]);

  const handleStartBooking = (srv: RemoteService) => {
    setActiveBookingService(srv);
    setConfirmedBooking(null);
    setShowTestGateway(false);
    setCouponInput('');
    setAppliedDiscount(0);
    setCouponMessage('');
    setErrorMessage('');
    setPaymentMethod('razorpay');
    setPhoneTouched(false);
    setPaypalReady(false);
  };

  const handleCloseModal = () => {
    setActiveBookingService(null);
    setShowTestGateway(false);
    setConfirmedBooking(null);
    setErrorMessage('');
    setPaypalReady(false);
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingService) return;
    setPhoneTouched(true);
    setErrorMessage('');

    if (paymentMethod === 'paypal') {
      return;
    }

    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      alert("You're offline. Please reconnect to the internet to purchase this product.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!phoneValidation.isValid || !phoneValidation.e164) {
      setErrorMessage('Please enter a valid WhatsApp number for the selected country.');
      return;
    }

    setIsSubmitting(true);
    const e164Phone = phoneValidation.e164;

    const generatedBookingNum = 'OMV-BOOK-' + Math.floor(1000 + Math.random() * 9000);
    const generatedId = 'bk-' + Date.now();

    const fullClientBooking: RemoteBooking = {
      id: generatedId,
      bookingNumber: generatedBookingNum,
      customerName: customerName || 'Client',
      email: email || 'customer@example.com',
      phone: e164Phone,
      serviceId: activeBookingService.id,
      serviceTitle: activeBookingService.title,
      issueCategory: activeBookingService.category,
      problemDescription: problemDescription || 'Remote PC inspection & repair requested.',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '10:00 AM',
      remoteTool: 'AnyDesk',
      remoteId: remoteId || '000 000 000',
      remotePassword: '',
      amount: finalPrice,
      paymentStatus: 'Paid',
      status: 'Technician Assigned',
      technicianName: 'Certified Technician',
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
          name: 'Omovo Store',
          description: `Service: ${activeBookingService.title}`,
          image: '/logo.png',
          prefill: {
            name: customerName,
            email: email,
            contact: e164Phone
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
              setIsSubmitting(false);
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

  // Authoritative Digital Products Catalog from Database / API
  const allDigitalProducts = useMemo(() => {
    const rawList = products && products.length > 0 ? products : MOCK_PRODUCTS;
    return rawList.filter(
      (p) => isDigitalProduct(p) && (p.status || 'PUBLISHED') === 'PUBLISHED'
    );
  }, [products]);

  // Real Available Categories derived dynamically from catalog products
  const availableCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    allDigitalProducts.forEach((p) => {
      if (p.category && p.category.trim()) {
        categoriesSet.add(p.category.trim());
      }
    });

    const categoryList = Array.from(categoriesSet).map((cat) => ({
      id: cat.toLowerCase(),
      name: cat
    }));

    return [{ id: 'all', name: 'All Digital Products' }, ...categoryList];
  }, [allDigitalProducts]);

  // 1. Featured / Top Selling Product for Hero Showcase
  const featuredProduct = useMemo(() => {
    const explicitFeatured = allDigitalProducts.find((p) => p.isFeatured || p.isBestSeller);
    if (explicitFeatured) return explicitFeatured;

    const sortedBySales = [...allDigitalProducts].sort((a, b) => {
      const aSales = a.salesCount || 0;
      const bSales = b.salesCount || 0;
      if (bSales !== aSales) return bSales - aSales;
      return (b.rating || 0) - (a.rating || 0);
    });

    return sortedBySales[0] || MOCK_PRODUCTS[0];
  }, [allDigitalProducts]);

  // 2. Supporting Product 1
  const supportingProduct1 = useMemo(() => {
    const candidate = allDigitalProducts.find((p) => p.id !== featuredProduct.id && (p.rating >= 4.8 || p.isNew));
    return candidate || allDigitalProducts[1] || MOCK_PRODUCTS[1] || featuredProduct;
  }, [allDigitalProducts, featuredProduct]);

  // 3. Supporting Product 2
  const supportingProduct2 = useMemo(() => {
    const candidate = allDigitalProducts.find(
      (p) => p.id !== featuredProduct.id && p.id !== supportingProduct1.id
    );
    return candidate || allDigitalProducts[2] || MOCK_PRODUCTS[2] || featuredProduct;
  }, [allDigitalProducts, featuredProduct, supportingProduct1]);

  // Top Selling Products List for Section
  // Top Selling Products List with Search & Category Filter
  const topSellingProducts = useMemo(() => {
    let pool = [...allDigitalProducts];

    if (selectedCategoryFilter !== 'all') {
      pool = pool.filter((p) => (p.category || '').toLowerCase() === selectedCategoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      pool = pool.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    const sorted = pool.sort((a, b) => {
      let aScore = (a.isBestSeller ? 50 : 0) + (a.isFeatured ? 30 : 0) + (a.salesCount || 0);
      let bScore = (b.isBestSeller ? 50 : 0) + (b.isFeatured ? 30 : 0) + (b.salesCount || 0);
      return bScore - aScore;
    });

    return sorted.slice(0, 8);
  }, [allDigitalProducts, selectedCategoryFilter, searchQuery]);

  // Fresh / New Products List
  const freshProducts = useMemo(() => {
    const pool = [...allDigitalProducts];
    return pool.reverse().slice(0, 4);
  }, [allDigitalProducts]);

  const scrollToTopSelling = () => {
    const el = document.getElementById('top-selling-products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/digital-products');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-20 font-sans">
      
      {/* 1. MODERN HERO SECTION */}
      <section className="relative bg-white border-b border-slate-200/80 pt-6 sm:pt-14 lg:pt-20 pb-8 sm:pb-16 lg:pb-20 overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-50/70 rounded-full blur-3xl pointer-events-none -mt-24" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-teal-50/50 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>CURATED DIGITAL ASSETS & LIVE PC SUPPORT</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Digital Products <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Made for Real Results.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                Discover curated ebooks, creator packs, verified software resources, and certified live 1-on-1 remote PC repair.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/digital-products');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Browse Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/remote-support');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all hover:border-emerald-500 hover:text-emerald-700 active:scale-95 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Remote PC Repair (₹39)</span>
                </button>
              </div>

              {/* Trust Metric Strip */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>Instant Download</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>100% Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>4.9/5 Rating</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Featured Product Card */}
            <div className="lg:col-span-5 w-full">
              {featuredProduct && (
                <div className="space-y-3 max-w-md mx-auto lg:max-w-none">
                  <div
                    onClick={() => onSelectProduct(featuredProduct)}
                    className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-lg shadow-slate-900/5 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    {/* Header Strip */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs inline-flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>TOP FEATURED</span>
                      </span>
                      {featuredProduct.rating ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{featuredProduct.rating}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">Instant Access</span>
                      )}
                    </div>

                    {/* Image Preview */}
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                      <img
                        src={featuredProduct.image || featuredProduct.previewImage || '/logo.png'}
                        alt={featuredProduct.name}
                        loading="eager"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/logo.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
                        <span className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10 truncate max-w-[130px] font-medium text-[11px]">
                          {featuredProduct.category || 'Digital Resource'}
                        </span>
                        <span className="bg-emerald-600 px-2 py-0.5 rounded-md font-bold text-[11px] shadow-xs">
                          Instant Access
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mt-3 space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {featuredProduct.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {featuredProduct.shortDescription || 'High-quality digital product delivered immediately with complete lifetime access.'}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-slate-900">₹{featuredProduct.price}</span>
                        {featuredProduct.originalPrice > featuredProduct.price && (
                          <span className="text-xs text-slate-400 line-through">₹{featuredProduct.originalPrice}</span>
                        )}
                        {featuredProduct.originalPrice > featuredProduct.price && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {Math.round(((featuredProduct.originalPrice - featuredProduct.price) / featuredProduct.originalPrice) * 100)}% OFF
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(featuredProduct);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>View Product</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Supporting Mini Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    {supportingProduct1 && (
                      <div
                        onClick={() => onSelectProduct(supportingProduct1)}
                        className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex items-center gap-2.5"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={supportingProduct1.image || supportingProduct1.previewImage || '/logo.png'}
                            alt={supportingProduct1.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                            {supportingProduct1.name}
                          </p>
                          <span className="text-xs font-black text-emerald-700">₹{supportingProduct1.price}</span>
                        </div>
                      </div>
                    )}

                    {supportingProduct2 && (
                      <div
                        onClick={() => onSelectProduct(supportingProduct2)}
                        className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex items-center gap-2.5"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={supportingProduct2.image || supportingProduct2.previewImage || '/logo.png'}
                            alt={supportingProduct2.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                            {supportingProduct2.name}
                          </p>
                          <span className="text-xs font-black text-emerald-700">₹{supportingProduct2.price}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>


      {/* 2. CATEGORY PILLS & INSTANT SEARCH STRIP */}
      <section className="bg-white/80 border-b border-slate-200/80 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {availableCategories.map((cat) => {
                const isSelected = selectedCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

          </div>
        </div>
      </section>


      {/* 3. PRODUCT CATALOG GRID */}
      <section id="top-selling-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>POPULAR SELECTIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Top Selling Digital Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Practical guides, tools, and creator assets ready for instant download.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigate('/digital-products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 self-start sm:self-auto group transition-colors cursor-pointer"
          >
            <span>Explore Entire Catalog</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Empty State */}
        {topSellingProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500">Try changing your search query or category filter.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Product Cards Grid: 2 cols on mobile, 3 on lg, 4 on xl */
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {topSellingProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              const hasDiscount = product.discountPercent > 0 || (product.originalPrice && product.originalPrice > product.price);
              const calcDiscount = product.discountPercent || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer w-full"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <img
                        src={product.image || product.previewImage || '/logo.png'}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/logo.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-20" />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10">
                        {product.isBestSeller && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                            BESTSELLER
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shadow-xs">
                            {calcDiscount}% OFF
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product.id);
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition-all z-10 ${
                          isWishlisted
                            ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                            : 'bg-white/80 text-slate-700 border-slate-200 hover:text-slate-950 hover:bg-white'
                        }`}
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>

                      {/* Instant Delivery Tag */}
                      <div className="absolute bottom-2 left-2 text-[10px] font-semibold text-white bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-md hidden min-[400px]:block">
                        Instant Delivery
                      </div>
                    </div>

                    {/* Meta & Title */}
                    <div className="p-3.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 truncate max-w-[130px]">
                          {product.category || 'Digital Product'}
                        </span>
                        {product.rating ? (
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{product.rating}</span>
                          </div>
                        ) : null}
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 leading-snug">
                        {product.name}
                      </h3>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed hidden min-[400px]:block">
                        {product.shortDescription || 'High-quality digital product with immediate access.'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="p-3.5 sm:p-4 pt-0 mt-auto">
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-black text-slate-900">₹{product.price}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProduct(product);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      {/* 4. REMOTE PC SUPPORT SPOTLIGHT SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-18">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#042f24] to-slate-900 border border-emerald-500/30 p-6 sm:p-10 lg:p-12 text-white shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE REMOTE COMPUTER DIAGNOSTICS & REPAIR • ₹39</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Fix Your PC Live on Screen. <br className="hidden sm:inline" />
                <span className="text-emerald-400">Certified Tech, Just ₹39.</span>
              </h2>

              <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Facing Blue Screen crashes, malware infections, Windows activation issues, or a sluggish computer? Our certified technicians connect securely via AnyDesk to resolve your problem live while you watch.
              </p>

              {/* 3 Quick Benefit Bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-left max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block text-[11px]">15-30 Min Fix</span>
                    <span className="text-[10px] text-slate-400">Quick turnaround</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block text-[11px]">100% Refund</span>
                    <span className="text-[10px] text-slate-400">If not resolved</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block text-[11px]">WhatsApp Connect</span>
                    <span className="text-[10px] text-slate-400">Direct 1-on-1 chat</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/remote-support');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Book Remote Support (₹39)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={CONTACT_CONFIG.whatsapp.getLink("Hello Omove! I need Remote PC Support for my computer.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              </div>
            </div>

            {/* Right Interactive/Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Live Remote Session</h4>
                      <p className="text-[11px] text-slate-400">Powered by AnyDesk</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 line-through block">₹499</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">₹39</span>
                  </div>
                </div>

                {/* Fix Checklist */}
                <div className="space-y-2 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Common Fixes Included:</span>
                  {[
                    'Blue Screen (BSOD) & Crash Troubleshooting',
                    'Virus, Spyware & Malware Full Cleanup',
                    'High CPU / RAM & Slow PC Optimization',
                    'Corrupted Windows Update & Driver Repair',
                    'Software Installation & Activation Help'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Trust Seal */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>100% Money-Back Guarantee</span>
                  </span>
                  <span className="text-slate-400">Encrypted & Safe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 5. VERIFIED SOCIAL PROOF & CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-18 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>REAL CUSTOMER REVIEWS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trusted by Creators, Professionals & PC Owners
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            See what customers say about our digital downloads and live remote PC fixes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Review 1 */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              "My laptop was crashing with BSOD every 10 mins during work. Technician connected via AnyDesk and fixed the corrupted driver in 20 minutes! Total lifesaver for just ₹39."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Rahul S.</span>
                <span className="text-[10px] text-slate-400">Remote PC Support</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                Verified Customer
              </span>
            </div>
          </div>

          {/* Review 2 */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              "The AI Productivity Playbook is packed with real, practical prompts I use daily for work. Instant download link worked immediately without any hassle."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Ananya M.</span>
                <span className="text-[10px] text-slate-400">AI Productivity Playbook</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                Verified Buyer
              </span>
            </div>
          </div>

          {/* Review 3 */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              "High quality SFX pack, perfect audio fidelity for YouTube video edits. Exactly what I needed at a super affordable price with zero hassle."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Vikram K.</span>
                <span className="text-[10px] text-slate-400">SFX Pack</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                Verified Buyer
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* 6. VALUE & TRUST PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-18">
        <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/90 shadow-xs space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              WHY CHOOSE OMOVE STORE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Built for Speed, Reliability & Security
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              We provide dependable digital resources and certified remote support designed to help you get things done faster.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Instant Access</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Direct high-speed download access delivered immediately upon payment.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Secure Checkout</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Protected and reliable payment processing powered by 256-bit encryption.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Easy Redownloads</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Access your purchased files and download links whenever you need them.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Practical Quality</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tested resources and guides designed specifically for real-world application.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* 7. FINAL HIGH-CONVERTING CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-18">
        <div className="rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-14 text-center shadow-xs space-y-5 max-w-3xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <Package className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Start Exploring Omove Store Today
            </h2>
            <p className="text-xs sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
              Find practical digital resources or connect with a certified technician for live remote PC assistance.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                navigate('/digital-products');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-md shadow-emerald-600/20 inline-flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/remote-support');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Book PC Support (₹39)</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Instant digital delivery • 100% money-back guarantee • Verified SSL encryption
          </p>
        </div>
      </section>


      {/* 8. REMOTE SUPPORT BOOKING MODAL (PRESERVED FOR COMPATIBILITY) */}
      {activeBookingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white border-b border-emerald-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {confirmedBooking ? 'BOOKING VERIFIED' : 'REMOTE SUPPORT BOOKING'}
                  </h3>
                  <p className="text-[11px] text-emerald-300">{activeBookingService.title} (₹{activeBookingService.price})</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-lg bg-emerald-900 text-emerald-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View 1: Confirmed & Post-Purchase WhatsApp Button */}
            {confirmedBooking ? (
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2.5">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">Payment Successful & Booking Confirmed!</h3>
                  <p className="text-xs text-slate-600">
                    Booking ID: <strong className="font-mono text-emerald-700">{confirmedBooking.bookingNumber}</strong>
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <span className="text-xs text-emerald-800 font-bold block uppercase tracking-wider">
                    ✅ TECHNICIAN ONLINE & ASSIGNED
                  </span>
                  <p className="text-xs text-slate-600">
                    Click below to start live 1-on-1 remote PC inspection chat directly on WhatsApp!
                  </p>
                  <a
                    href={CONTACT_CONFIG.whatsapp.getLink(
                      `Hello OMOVE Expert! I paid ₹${activeBookingService.price} for PC Inspection.\nBooking ID: ${confirmedBooking.bookingNumber}\nName: ${confirmedBooking.customerName}\nPhone: ${confirmedBooking.phone}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>CONNECT WITH TECHNICIAN ON WHATSAPP NOW</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  CLOSE WINDOW
                </button>
              </div>
            ) : showTestGateway ? (
              /* View 2: Razorpay Test Gateway */
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase">
                      RAZORPAY TEST GATEWAY
                    </span>
                    <span className="text-lg font-bold text-slate-900">₹{activeBookingService.price}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Simulating secure payment gateway transaction. Click below to verify payment and connect with your technician.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Customer</span>
                    <span className="text-slate-900 font-bold">{customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Service</span>
                    <span className="text-slate-900 font-bold">{activeBookingService.title}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmTestPayment}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
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
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1 text-xs">
                      YOUR FULL NAME <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1 text-xs">
                      EMAIL ADDRESS <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
                    />
                  </div>

                  {/* International WhatsApp Phone Input */}
                  <InternationalPhoneInput
                    value={phone}
                    onChange={(val, valRes) => {
                      setPhone(val);
                      setPhoneValidation(valRes);
                    }}
                    touched={phoneTouched}
                    onBlur={() => setPhoneTouched(true)}
                    disabled={isSubmitting}
                    variant="light"
                  />

                  {/* Promo Coupon Code Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-slate-700 font-bold flex items-center justify-between text-xs">
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
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBookingCoupon}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        APPLY
                      </button>
                    </div>

                    {couponMessage && (
                      <p className={`text-[11px] font-bold ${appliedDiscount > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {couponMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Method Selector & CTA Buttons */}
                {finalPrice > 0 ? (
                  <div className="pt-2 space-y-3">
                    <PaymentMethodCards
                      paymentMethod={paymentMethod}
                      onSelectMethod={(m) => {
                        setPaymentMethod(m);
                        setPaypalReady(false);
                      }}
                      inrAmount={finalPrice}
                      usdAmountDisplay={previewUsdDisplay}
                      razorpayTitle="RAZORPAY"
                      razorpaySubtitle="UPI / Card / NetBanking"
                      razorpayTagline="Pay securely in INR"
                      paypalTitle="PAYPAL"
                      paypalSubtitle="International Checkout"
                      paypalTagline="Pay securely in USD"
                      themeAccent="emerald"
                      variant="light"
                    />

                    {/* Razorpay Submit CTA Button */}
                    {(!PAYPAL_CHECKOUT_ENABLED || paymentMethod === 'razorpay') && (
                      <button
                        type="submit"
                        disabled={isSubmitting || !isOnline || (phoneTouched && !phoneValidation.isValid)}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          !isOnline || (phoneTouched && !phoneValidation.isValid)
                            ? 'bg-slate-300 text-slate-500 border border-slate-300 cursor-not-allowed shadow-none'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {!isOnline ? (
                          <>
                            <WifiOff className="w-4 h-4 text-rose-500" />
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
                            <span>CONFIRM & PAY ₹{finalPrice}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  /* Zero / 100% Coupon CTA */
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isOnline}
                      className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>CONFIRM FREE BOOKING (₹0)</span>
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
