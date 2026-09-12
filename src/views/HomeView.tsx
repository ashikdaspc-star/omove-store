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
  CreditCard
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
  const topSellingProducts = useMemo(() => {
    let pool = [...allDigitalProducts];

    if (selectedCategoryFilter !== 'all') {
      pool = pool.filter((p) => (p.category || '').toLowerCase() === selectedCategoryFilter);
    }

    const sorted = pool.sort((a, b) => {
      let aScore = (a.isBestSeller ? 50 : 0) + (a.isFeatured ? 30 : 0) + (a.salesCount || 0);
      let bScore = (b.isBestSeller ? 50 : 0) + (b.isFeatured ? 30 : 0) + (b.salesCount || 0);
      return bScore - aScore;
    });

    return sorted.slice(0, 8);
  }, [allDigitalProducts, selectedCategoryFilter]);

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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-16 font-sans">
      
      {/* 1. HERO SECTION: PREMIUM DIGITAL MARKETPLACE HERO */}
      <section className="relative bg-white border-b border-slate-200/90 pt-3.5 sm:pt-10 lg:pt-16 pb-3.5 sm:pb-12 lg:pb-16 overflow-hidden">
        
        {/* Subtle Ambient Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl pointer-events-none -mr-32 -mt-20" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-100/60 rounded-full blur-3xl pointer-events-none -ml-32 -mb-20" />

        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-8 lg:gap-12 items-center">

            {/* LEFT COLUMN CONTAINER (Contents on mobile, col-span-7 on lg) */}
            <div className="contents lg:flex lg:flex-col lg:col-span-7 lg:space-y-5 text-center lg:text-left">
              
              {/* 1. HERO TEXT HEADER (Order 1 on mobile) */}
              <div className="order-1 lg:order-none space-y-2.5 sm:space-y-4 text-center lg:text-left">
                {/* Category/Brand Eyebrow */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs font-semibold tracking-wide shadow-xs max-w-full">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                  <span>DIGITAL PRODUCTS • DISCOVER • DOWNLOAD • CREATE</span>
                </div>

                {/* Main Headline - Scaled proportionally for mobile */}
                <h1 className="text-[21px] min-[360px]:text-[24px] sm:text-4xl md:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.08]">
                  Digital Products <br className="hidden sm:block" />
                  <span className="text-emerald-600">Made to Get Things Done.</span>
                </h1>

                {/* Supporting Description - Max-width 320px on mobile */}
                <p className="text-[10px] min-[360px]:text-[11px] sm:text-sm lg:text-base text-slate-600 leading-relaxed max-w-[290px] min-[360px]:max-w-[320px] sm:max-w-xl mx-auto lg:mx-0">
                  Discover useful digital products, resources and tools — delivered instantly and ready to use.
                </p>
              </div>

              {/* 2. HERO ACTION CLUSTER: CTAS & TRUST FEATURES (Order 2 on mobile — placed right before Featured Product) */}
              <div className="order-2 lg:order-none space-y-2 sm:space-y-4 pt-1 sm:pt-0 w-full">
                {/* Primary & Secondary Action CTAs */}
                <div className="pt-0.5 grid grid-cols-2 gap-1.5 w-full max-w-[300px] min-[360px]:max-w-[330px] sm:max-w-none mx-auto lg:mx-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/digital-products');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-2 py-1.5 sm:px-7 sm:py-3.5 min-h-[44px] sm:min-h-[48px] rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9.5px] min-[360px]:text-[10.5px] sm:text-sm tracking-tight shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden min-[380px]:inline">EXPLORE DIGITAL PRODUCTS</span>
                    <span className="min-[380px]:hidden">EXPLORE PRODUCTS</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={scrollToTopSelling}
                    className="w-full sm:w-auto px-2 py-1.5 sm:px-6 sm:py-3.5 min-h-[44px] sm:min-h-[48px] rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-[9.5px] min-[360px]:text-[10.5px] sm:text-sm tracking-tight shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <span className="hidden min-[380px]:inline">TOP SELLING PRODUCTS</span>
                    <span className="min-[380px]:hidden">TOP SELLING</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
                  </button>
                </div>

                {/* Hero Horizontal Trust Strip */}
                <div className="pt-2 pb-2 border-y border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-x-2.5 sm:gap-x-5 gap-y-0.5 text-[8px] min-[360px]:text-[9px] sm:text-xs font-medium text-slate-700 w-full max-w-[360px] sm:max-w-none mx-auto lg:mx-0">
                  <div className="flex items-center gap-1 text-left whitespace-nowrap">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[2.5] shrink-0" />
                    <span>Instant Delivery</span>
                  </div>

                  <div className="flex items-center gap-1 text-left whitespace-nowrap">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 stroke-[2.5] shrink-0" />
                    <span>Secure Checkout</span>
                  </div>

                  <div className="flex items-center gap-1 text-left whitespace-nowrap">
                    <Download className="w-3 h-3 text-emerald-600 stroke-[2.5] shrink-0" />
                    <span>Easy Downloads</span>
                  </div>

                  <div className="flex items-center gap-1 text-left whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5] shrink-0" />
                    <span>Trusted Products</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. RIGHT COLUMN: FEATURED PRODUCT & SECONDARY CARDS (Order 3 on mobile, 5 cols on lg) */}
            <div className="order-3 lg:order-none lg:col-span-5 relative w-full pt-1.5 sm:pt-0">
              
              <div className="relative mx-auto max-w-[290px] min-[360px]:max-w-[315px] sm:max-w-[430px] lg:max-w-none space-y-1.5">
                
                {/* 1. MAIN FEATURED PRODUCT SHOWCASE CARD */}
                {featuredProduct && (
                  <div 
                    onClick={() => onSelectProduct(featuredProduct)}
                    className="featured-product-float relative bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200/90 hover:border-emerald-500/50 cursor-pointer group shadow-md shadow-slate-900/6 w-full"
                  >
                    {/* Top Header Strip */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-bold tracking-wide uppercase shadow-xs">
                        <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{featuredProduct.isBestSeller ? 'TOP SELLING' : 'FEATURED PRODUCT'}</span>
                      </div>
                      
                      {featuredProduct.rating ? (
                        <div className="flex items-center gap-0.5 text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-500 text-amber-500" />
                          <span>{featuredProduct.rating}</span>
                        </div>
                      ) : (
                        <span className="text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Instant Access
                        </span>
                      )}
                    </div>

                    {/* Main Product Image - Full width, 16:9 uncropped artwork with controlled mobile height */}
                    <div className="relative aspect-[16/9] max-h-[175px] sm:max-h-none w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                      <img 
                        src={featuredProduct.image || featuredProduct.previewImage || '/logo.png'} 
                        alt={featuredProduct.name}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/logo.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40" />
                      
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-medium text-white">
                        <span className="bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10 truncate max-w-[110px]">
                          {featuredProduct.category || 'Digital Resource'}
                        </span>
                        <span className="bg-emerald-600 px-1.5 py-0.5 rounded font-bold shadow-xs">
                          Ready to Download
                        </span>
                      </div>
                    </div>

                    {/* Product Details & Pricing */}
                    <div className="mt-2 space-y-0.5">
                      <h3 className="text-xs min-[360px]:text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {featuredProduct.name}
                      </h3>
                      <p className="text-[9px] min-[360px]:text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {featuredProduct.shortDescription || 'High-quality digital product delivered immediately with complete lifetime access.'}
                      </p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm min-[360px]:text-base sm:text-xl font-extrabold text-slate-900">₹{featuredProduct.price}</span>
                        {featuredProduct.originalPrice > featuredProduct.price && (
                          <span className="text-[9px] min-[360px]:text-[10px] sm:text-xs text-slate-400 line-through">₹{featuredProduct.originalPrice}</span>
                        )}
                        {featuredProduct.originalPrice > featuredProduct.price && (
                          <span className="text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
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
                        className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] min-[360px]:text-[10.5px] sm:text-xs font-bold transition-all flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
                      >
                        <span>View Product</span>
                        <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. SUPPORTING SECONDARY PRODUCTS ROW (2-Column on Mobile & Desktop) */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  
                  {supportingProduct1 && (
                    <div
                      onClick={() => onSelectProduct(supportingProduct1)}
                      style={{ transitionDelay: '140ms' }}
                      className="scroll-reveal p-1.5 sm:p-2.5 bg-white rounded-lg sm:rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={supportingProduct1.image || supportingProduct1.previewImage || '/logo.png'}
                            alt={supportingProduct1.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[7.5px] min-[360px]:text-[8.5px] sm:text-[9px] font-bold text-emerald-700 uppercase block truncate">
                            {supportingProduct1.isBestSeller ? 'TOP SELLER' : (supportingProduct1.category || 'POPULAR')}
                          </span>
                          <p className="text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                            {supportingProduct1.name}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-bold">
                        <span className="text-slate-900">₹{supportingProduct1.price}</span>
                        <span className="text-emerald-600 text-[8px] min-[360px]:text-[9px] sm:text-[10px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          <span>View</span>
                          <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                      </div>
                    </div>
                  )}

                  {supportingProduct2 && (
                    <div
                      onClick={() => onSelectProduct(supportingProduct2)}
                      style={{ transitionDelay: '280ms' }}
                      className="scroll-reveal p-1.5 sm:p-2.5 bg-white rounded-lg sm:rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={supportingProduct2.image || supportingProduct2.previewImage || '/logo.png'}
                            alt={supportingProduct2.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[7.5px] min-[360px]:text-[8.5px] sm:text-[9px] font-bold text-amber-700 uppercase block truncate">
                            {supportingProduct2.isNew ? 'NEW RELEASE' : (supportingProduct2.category || 'FEATURED')}
                          </span>
                          <p className="text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                            {supportingProduct2.name}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-bold">
                        <span className="text-slate-900">₹{supportingProduct2.price}</span>
                        <span className="text-emerald-600 text-[8px] min-[360px]:text-[9px] sm:text-[10px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          <span>View</span>
                          <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* 2. CATEGORY NAVIGATION STRIP */}
      {availableCategories.length > 1 && (
        <section className="border-b border-slate-200/80 bg-white py-1.5 sm:py-3.5">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 sm:gap-2.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1 pr-1.5 border-r border-slate-200">
                <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                <span>CATEGORIES:</span>
              </span>

              {availableCategories.map((cat) => {
                const isSelected = selectedCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(cat.id);
                    }}
                    className={`px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-lg text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}


      {/* 3. TOP SELLING PRODUCTS SECTION */}
      <section id="top-selling-products" className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-3.5 sm:pt-12 lg:pt-16 space-y-3.5 sm:space-y-6">
        
        {/* Section Header */}
        <div className="scroll-reveal flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>POPULAR SELECTIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Top Selling Products
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Popular digital products customers are downloading right now.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigate('/digital-products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 self-start sm:self-auto group transition-colors cursor-pointer"
          >
            <span>Explore All Digital Products</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Product Cards Grid: 2 columns on mobile, 3 on lg, 4 on xl */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {topSellingProducts.map((product, idx) => {
            const isWishlisted = wishlist.includes(product.id);
            const hasDiscount = product.discountPercent > 0 || (product.originalPrice && product.originalPrice > product.price);
            const calcDiscount = product.discountPercent || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                style={{ transitionDelay: `${(idx % 4) * 140}ms` }}
                className="scroll-reveal group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-500/60 transition-all duration-200 flex flex-col justify-between cursor-pointer w-full"
              >
                <div>
                  {/* Product Image */}
                  <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={product.image || product.previewImage || '/logo.png'}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/logo.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-30" />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10">
                      {product.isBestSeller && (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wide bg-emerald-600 text-white shadow-xs">
                          TOP SELLER
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-amber-400 text-slate-950 shadow-xs">
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
                      className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md border transition-all z-10 ${
                        isWishlisted
                          ? 'bg-rose-500 text-white border-rose-400'
                          : 'bg-white/80 text-slate-700 border-slate-200 hover:text-slate-950 hover:bg-white'
                      }`}
                      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>

                    {/* Instant Download Tag */}
                    <div className="absolute bottom-1.5 left-2 text-[9px] sm:text-[10px] font-medium text-white bg-slate-900/80 backdrop-blur-sm px-1.5 py-0.5 rounded hidden min-[400px]:block">
                      Instant Delivery
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-3 sm:p-4 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-100 truncate max-w-[130px]">
                        {product.category || 'Digital Product'}
                      </span>
                      {product.rating ? (
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{product.rating}</span>
                        </div>
                      ) : null}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 leading-snug">
                      {product.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed hidden min-[400px]:block sm:block">
                      {product.shortDescription || 'Useful digital product delivered immediately with complete lifetime access.'}
                    </p>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="p-3 sm:p-4 pt-0 mt-auto">
                  <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 sm:gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base sm:text-lg font-extrabold text-slate-900">₹{product.price}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through hidden min-[400px]:inline">₹{product.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        className="p-1.5 sm:p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(product);
                        }}
                        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>


      {/* 4. FRESH DIGITAL FINDS (NEW RELEASES) */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-12 lg:pt-18 space-y-4 sm:space-y-6">
        
        <div className="scroll-reveal flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-bold mb-2 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>NEW ADDITIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Fresh Digital Finds
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              New resources, tools and downloads worth checking out.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigate('/digital-products');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 self-start sm:self-auto group transition-colors cursor-pointer"
          >
            <span>View All New Finds</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Product Cards Grid: 2 columns on mobile, 4 on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {freshProducts.map((product, idx) => (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              style={{ transitionDelay: `${idx * 140}ms` }}
              className="scroll-reveal group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-500/60 transition-all duration-200 flex flex-col justify-between cursor-pointer w-full"
            >
              <div>
                <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={product.image || product.previewImage || '/logo.png'}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo.png';
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-slate-900 text-white uppercase shadow-xs">
                      NEW
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 space-y-1 sm:space-y-1.5">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700">
                    {product.category || 'Digital Product'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed hidden min-[400px]:block sm:block">
                    {product.shortDescription || 'Ready-to-use digital resource with instant delivery.'}
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-4 pt-0 mt-auto">
                <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900">₹{product.price}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 5. VALUE & TRUST SECTION — WHY BUY FROM OMOVO */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-12 lg:pt-18">
        <div className="bg-white rounded-2xl p-4 sm:p-8 lg:p-12 border border-slate-200 shadow-xs space-y-5 sm:space-y-8">
          
          <div className="scroll-reveal text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600">
              TRUSTED DIGITAL MARKETPLACE
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Buy From Omovo Store
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We provide dependable digital products, tools and guides built to help you get things done faster.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            
            {/* Benefit 1: Instant Access */}
            <div style={{ transitionDelay: '0ms' }} className="scroll-reveal p-3 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 sm:space-y-2.5 group hover:border-emerald-500 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900">
                Instant Access
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                Get your digital product immediately after purchase with direct high-speed download access.
              </p>
            </div>

            {/* Benefit 2: Secure Checkout */}
            <div style={{ transitionDelay: '130ms' }} className="scroll-reveal p-3 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 sm:space-y-2.5 group hover:border-emerald-500 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900">
                Secure Checkout
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                Protected and reliable payment processing powered by verified security encryption.
              </p>
            </div>

            {/* Benefit 3: Easy Downloads */}
            <div style={{ transitionDelay: '260ms' }} className="scroll-reveal p-3 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 sm:space-y-2.5 group hover:border-emerald-500 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900">
                Easy Downloads
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                Access your purchased files and download links whenever you need them from your account.
              </p>
            </div>

            {/* Benefit 4: Practical Products */}
            <div style={{ transitionDelay: '390ms' }} className="scroll-reveal p-3 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 sm:space-y-2.5 group hover:border-emerald-500 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900">
                Practical Products
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                Useful digital resources and guides designed specifically for real-world application.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* 6. FINAL CTA SECTION */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-12 lg:pt-18">
        <div className="scroll-reveal rounded-2xl bg-white border border-slate-200 p-6 sm:p-12 text-center shadow-xs space-y-4 sm:space-y-5 max-w-3xl mx-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Find Your Next Digital Product.
            </h2>
            <p className="text-xs sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              Explore useful resources, tools and downloads made to help you create, learn and get things done.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                navigate('/digital-products');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] sm:min-h-[50px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-600/20 inline-flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>EXPLORE DIGITAL PRODUCTS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 text-[10px] sm:text-xs text-slate-400">
            <span>Instant delivery • Lifetime access • Secure Checkout</span>
          </div>
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
