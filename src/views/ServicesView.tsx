import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RemoteService, RemoteBooking } from '../types';
import { sendAdminOrderNotificationEmail } from '../utils/emailNotifier';
import { validateAndApplyCoupon } from '../utils/couponManager';
import { useOnlineStatus } from '../components/OfflineBanner';
import { Country, getDefaultCountry, validatePhoneNumber } from '../utils/countryData';
import { loadPayPalSDK } from '../utils/paypalLoader';
import { InternationalPhoneInput } from '../components/InternationalPhoneInput';
import { PaymentMethodCards } from '../components/PaymentMethodCards';
import {
  Zap,
  Check,
  Clock,
  ShieldCheck,
  Monitor,
  ArrowRight,
  Headphones,
  MessageSquare,
  ExternalLink,
  Lock,
  X,
  CheckCircle2,
  DownloadCloud,
  Tag,
  WifiOff,
  AlertTriangle
} from 'lucide-react';

interface ServicesViewProps {
  services: RemoteService[];
  onBookingSuccess?: (booking: RemoteBooking) => void;
  setCurrentView: (view: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ services, onBookingSuccess, setCurrentView }) => {
  const isOnline = useOnlineStatus();
  const [activeService, setActiveService] = useState<RemoteService | null>(null);
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

  // Payment Method State: 'razorpay' | 'paypal'
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Coupon state for Services catalog booking
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const finalPrice = activeService ? Math.max(0, activeService.price - appliedDiscount) : 0;
  const previewUsd = finalPrice > 0 ? finalPrice / 95 : 0;
  const previewUsdDisplay = (Math.round(previewUsd * 100) / 100).toFixed(2);

  const handleApplyBookingCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeService) return;
    const res = validateAndApplyCoupon(couponInput, activeService.price);
    if (res.valid) {
      setAppliedDiscount(res.discountAmount);
      setCouponMessage(res.message);
    } else {
      setAppliedDiscount(0);
      setCouponMessage(res.message);
    }
  };

  // State ref for PayPal callbacks
  const paypalServicesRef = useRef({
    activeService,
    customerName,
    email,
    phoneValidation,
    problemDescription,
    finalPrice,
    couponInput
  });

  useEffect(() => {
    paypalServicesRef.current = {
      activeService,
      customerName,
      email,
      phoneValidation,
      problemDescription,
      finalPrice,
      couponInput
    };
  }, [activeService, customerName, email, phoneValidation, problemDescription, finalPrice, couponInput]);

  // PayPal SDK Auto-Loader for Services Booking Modal
  useEffect(() => {
    if (!activeService || paymentMethod !== 'paypal' || confirmedBooking) {
      setPaypalReady(false);
      return;
    }

    let isCancelled = false;
    setPaypalLoading(true);

    async function initPayPalServices() {
      try {
        const paypal = await loadPayPalSDK();
        if (isCancelled || !paypal || typeof paypal.Buttons !== 'function') return;

        const container = document.getElementById('paypal-services-booking-button-container');
        if (!container) return;
        container.innerHTML = '';

        paypal.Buttons({
          createOrder: async () => {
            const curr = paypalServicesRef.current;
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
                serviceId: curr.activeService?.id || 'srv-001',
                serviceTitle: curr.activeService?.title || 'Remote PC Support',
                issueCategory: curr.activeService?.category || 'Windows Fix',
                customerName: curr.customerName.trim(),
                customerEmail: curr.email.trim().toLowerCase(),
                customerPhone: e164Phone,
                phone: e164Phone,
                email: curr.email.trim().toLowerCase(),
                problemDescription: curr.problemDescription || 'PC Support booking from Services view.',
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
                  customerName: paypalServicesRef.current.customerName,
                  email: paypalServicesRef.current.email,
                  phone: paypalServicesRef.current.phoneValidation.e164,
                  serviceTitle: paypalServicesRef.current.activeService?.title || 'Remote PC Support',
                  technicianName: 'Certified Tech (Live Online)',
                  preferredDate: new Date().toISOString().split('T')[0],
                  preferredTime: '10:00 AM',
                  remoteTool: 'AnyDesk',
                  remoteId: '000 000 000',
                  amount: paypalServicesRef.current.finalPrice,
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
            console.error('PayPal Services Booking Error:', err);
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
        }).render('#paypal-services-booking-button-container');

        if (!isCancelled) {
          setPaypalReady(true);
          setPaypalLoading(false);
        }
      } catch (e: any) {
        console.error('PayPal services setup failed:', e);
        if (!isCancelled) setPaypalLoading(false);
      }
    }

    const timer = setTimeout(() => {
      initPayPalServices();
    }, 40);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeService, paymentMethod, confirmedBooking]);

  const handleStartBooking = (srv: RemoteService) => {
    setActiveService(srv);
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
    setActiveService(null);
    setShowTestGateway(false);
    setConfirmedBooking(null);
    setErrorMessage('');
    setPaypalReady(false);
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeService) return;
    setPhoneTouched(true);
    setErrorMessage('');

    if (paymentMethod === 'paypal') {
      return; // Handled by PayPal Smart Buttons
    }

    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      alert("You’re offline. Please reconnect to the internet to purchase this product.");
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
      serviceId: activeService.id,
      serviceTitle: activeService.title,
      issueCategory: activeService.category,
      problemDescription: problemDescription || 'Remote PC inspection & repair requested.',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '10:00 AM',
      remoteTool: 'AnyDesk',
      remoteId: remoteId || '000 000 000',
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
        bookingObj.amount = 0;
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
          description: `PC Service: ${activeService.title}`,
          image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&auto=format&fit=crop&q=80',
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

  return (
    <div className="space-y-12 pb-16">
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5" />
            <span>CERTIFIED REMOTE REPAIR SERVICE</span>
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Fix Any PC Problem Live On Screen
          </h1>
          <p className="text-sm md:text-base text-slate-300">
            Watch our certified Microsoft & hardware engineers diagnose and resolve your crashes, software corruptions, and optimization requests via secure AnyDesk connection.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              100% Satisfaction Guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              Fast Turnaround (~20-40 mins)
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Encrypted Session
            </span>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Available Support Packages</h2>
            <p className="text-xs text-slate-500 mt-0.5">Select a diagnostics package to initiate a remote connection.</p>
          </div>
          <button
            onClick={() => setCurrentView('booking')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Monitor className="w-4 h-4" />
            <span>OPEN DEDICATED BOOKING PAGE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all border-2 ${
                srv.popular
                  ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10'
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase">
                    {srv.category}
                  </span>
                  {srv.popular && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 font-mono tracking-wider">
                      MOST POPULAR
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{srv.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{srv.description}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">{srv.estimatedTime}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3 mt-4">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-400 uppercase">One-Time Fee</span>
                  <span className="text-2xl font-black text-slate-900">₹{srv.price}</span>
                </div>

                <button
                  onClick={() => handleStartBooking(srv)}
                  className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    srv.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>BOOK REPAIR NOW</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Support Instructions */}
      <section className="p-6 md:p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 text-xs text-slate-700">
        <h3 className="font-bold text-sm text-slate-900 font-mono flex items-center gap-2">
          <Headphones className="w-4 h-4 text-emerald-600" />
          <span>How It Works</span>
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 font-sans">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-mono text-xs">1. Choose Service & Pay</strong>
            <p className="text-slate-500">Pick the problem category and complete secure payment with Razorpay or PayPal.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-mono text-xs">2. Open AnyDesk</strong>
            <p className="text-slate-500">Download AnyDesk and share your 9-digit address on WhatsApp with our technician.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
            <strong className="text-slate-900 block font-mono text-xs">3. Live Repair</strong>
            <p className="text-slate-500">Watch the technician fix everything directly on your screen. You retain full session control.</p>
          </div>
        </div>
      </section>

      {/* SELF-CONTAINED BOOKING & PAYMENT MODAL */}
      {activeService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-900">
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
                  <p className="text-[11px] text-emerald-300 font-mono">{activeService.title} (₹{activeService.price})</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-xl bg-emerald-900 text-emerald-300 hover:text-white cursor-pointer">
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
                      `Hello OMOVE Expert! I paid for PC Inspection.\nBooking ID: ${confirmedBooking.bookingNumber}\nName: ${confirmedBooking.customerName}\nPhone: ${confirmedBooking.phone}\nService: ${confirmedBooking.serviceTitle}`
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
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold cursor-pointer"
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
                    <span className="text-xl font-mono font-extrabold text-slate-900">₹{activeService.price}</span>
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
                    <span className="text-slate-900">{activeService.title}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmTestPayment}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm font-mono tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>VERIFYING PAYMENT...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>COMPLETE SIMULATED PAYMENT (₹{activeService.price})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* View 3: Customer Form */
              <form onSubmit={handleProceedToPayment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1 font-mono text-xs">
                      YOUR FULL NAME <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 transition-all font-sans text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1 font-mono text-xs">
                      EMAIL ADDRESS <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 transition-all font-sans text-xs"
                    />
                  </div>

                  {/* International WhatsApp Phone Input with Searchable Country Picker */}
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
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBookingCoupon}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                      >
                        APPLY
                      </button>
                    </div>

                    {couponMessage && (
                      <p className={`text-[11px] font-mono font-bold ${appliedDiscount > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {couponMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Method Selector & CTA Buttons */}
                {finalPrice > 0 ? (
                  <div className="pt-2 space-y-3.5">
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

                    {/* PayPal Conversion Breakdown */}
                    {paymentMethod === 'paypal' && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs font-mono space-y-1.5 animate-fadeIn text-slate-800">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600">Service Fee:</span>
                          <span className="text-slate-900 font-bold">₹{finalPrice} INR</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600">Rate:</span>
                          <span className="text-slate-700">₹95 = $1.00 USD</span>
                        </div>
                        <div className="pt-1.5 border-t border-blue-200 flex justify-between items-center font-bold">
                          <span className="text-blue-900">PayPal Total:</span>
                          <span className="text-sm text-blue-700 font-black">${previewUsdDisplay} USD</span>
                        </div>
                      </div>
                    )}

                    {/* PayPal Button Container */}
                    {paymentMethod === 'paypal' && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-blue-200 shadow-sm space-y-2 animate-fadeIn">
                        <div className="text-center mb-1">
                          <span className="text-[11px] text-blue-800 font-mono font-bold">
                            {paypalLoading ? 'Loading PayPal Gateway...' : `Complete Payment • $${previewUsdDisplay} USD`}
                          </span>
                        </div>
                        <div id="paypal-services-booking-button-container" className="min-h-[44px] w-full" />
                      </div>
                    )}

                    {/* Razorpay Submit CTA Button */}
                    {paymentMethod === 'razorpay' && (
                      <button
                        type="submit"
                        disabled={isSubmitting || !isOnline || (phoneTouched && !phoneValidation.isValid)}
                        className={`w-full py-4 rounded-2xl font-extrabold text-sm font-mono tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
                            <span>PAY ₹{finalPrice} & GET INSTANT REPAIR</span>
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
                      className="w-full py-4 rounded-2xl font-extrabold text-sm font-mono tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>CONFIRM FREE INSPECTION (₹0)</span>
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
