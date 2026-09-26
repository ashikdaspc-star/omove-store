import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RemoteService, RemoteBooking } from '../types';
import { sendAdminOrderNotificationEmail } from '../utils/emailNotifier';
import { validateAndApplyCoupon } from '../utils/couponManager';
import { useOnlineStatus } from '../components/OfflineBanner';
import { Country, getDefaultCountry, validatePhoneNumber } from '../utils/countryData';
import { loadPayPalSDK } from '../utils/paypalLoader';
import { PAYPAL_CHECKOUT_ENABLED } from '../config/paymentConfig';
import { CONTACT_CONFIG } from '../config/contactConfig';
import { InternationalPhoneInput } from '../components/InternationalPhoneInput';
import { PaymentMethodCards } from '../components/PaymentMethodCards';
import {
  CheckCircle2,
  ShieldCheck,
  Lock,
  DownloadCloud,
  ExternalLink,
  MessageSquare,
  Tag,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';

interface RemoteSupportBookingViewProps {
  services: RemoteService[];
  onBookingSuccess: (booking: RemoteBooking) => void;
  setCurrentView: (view: string) => void;
}

export const RemoteSupportBookingView: React.FC<RemoteSupportBookingViewProps> = ({
  services,
  onBookingSuccess,
  setCurrentView
}) => {
  const isOnline = useOnlineStatus();
  const [selectedService, setSelectedService] = useState<RemoteService | null>(services[0] || null);
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

  const [problemDescription, setProblemDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [remoteTool, setRemoteTool] = useState<'AnyDesk' | 'RustDesk' | 'TeamViewer'>('AnyDesk');
  const [remoteId, setRemoteId] = useState('');
  const [remotePassword, setRemotePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<RemoteBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment Method State: 'razorpay' | 'paypal'
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Coupon state
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const basePrice = selectedService?.price || 39;
  const originalPrice = selectedService?.originalPrice || 499;
  const finalPrice = Math.max(0, basePrice - appliedDiscount);
  const previewUsd = finalPrice > 0 ? finalPrice / 95 : 0;
  const previewUsdDisplay = (Math.round(previewUsd * 100) / 100).toFixed(2);

  const handleApplyBookingCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = validateAndApplyCoupon(couponInput, basePrice);
    if (res.valid) {
      setAppliedDiscount(res.discountAmount);
      setCouponMessage(res.message);
    } else {
      setAppliedDiscount(0);
      setCouponMessage(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(0);
    setCouponInput('');
    setCouponMessage('');
    setShowCouponInput(false);
  };

  // State ref for PayPal callbacks
  const paypalStateRef = useRef({
    selectedService,
    customerName,
    email,
    phoneValidation,
    problemDescription,
    preferredDate,
    preferredTime,
    remoteTool,
    remoteId,
    remotePassword,
    finalPrice,
    couponInput
  });

  useEffect(() => {
    paypalStateRef.current = {
      selectedService,
      customerName,
      email,
      phoneValidation,
      problemDescription,
      preferredDate,
      preferredTime,
      remoteTool,
      remoteId,
      remotePassword,
      finalPrice,
      couponInput
    };
  }, [selectedService, customerName, email, phoneValidation, problemDescription, preferredDate, preferredTime, remoteTool, remoteId, remotePassword, finalPrice, couponInput]);

  // PayPal SDK Auto-Loader & Smart Button Renderer
  useEffect(() => {
    if (!PAYPAL_CHECKOUT_ENABLED || paymentMethod !== 'paypal' || confirmedBooking) {
      setPaypalReady(false);
      return;
    }

    let isCancelled = false;
    setPaypalLoading(true);

    async function initPayPal() {
      try {
        const paypal = await loadPayPalSDK();
        if (isCancelled || !paypal || typeof paypal.Buttons !== 'function') return;

        const container = document.getElementById('paypal-booking-button-container');
        if (!container) return;
        container.innerHTML = '';

        paypal.Buttons({
          createOrder: async () => {
            const curr = paypalStateRef.current;
            setErrorMessage('');

            if (!curr.customerName.trim()) {
              setErrorMessage('Please enter your full name.');
              throw new Error('Name required');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (curr.email.trim() && !emailRegex.test(curr.email.trim())) {
              setErrorMessage('Please enter a valid email address or leave it blank.');
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
                serviceId: curr.selectedService?.id || 'srv-001',
                serviceTitle: curr.selectedService?.title || 'Remote PC Support',
                issueCategory: curr.selectedService?.category || 'Windows Fix',
                customerName: curr.customerName.trim(),
                customerEmail: curr.email.trim() ? curr.email.trim().toLowerCase() : 'customer@example.com',
                customerPhone: e164Phone,
                phone: e164Phone,
                email: curr.email.trim() ? curr.email.trim().toLowerCase() : 'customer@example.com',
                problemDescription: curr.problemDescription.trim() || 'General remote PC inspection & support',
                preferredDate: curr.preferredDate || new Date().toISOString().split('T')[0],
                preferredTime: curr.preferredTime || '10:00 AM',
                remoteTool: curr.remoteTool || 'AnyDesk',
                remoteId: curr.remoteId || '000 000 000',
                remotePassword: curr.remotePassword || '',
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
                  customerName: paypalStateRef.current.customerName,
                  email: paypalStateRef.current.email,
                  phone: paypalStateRef.current.phoneValidation.e164,
                  serviceTitle: paypalStateRef.current.selectedService?.title || 'Remote PC Support',
                  technicianName: 'Certified Tech (Live Online)',
                  preferredDate: paypalStateRef.current.preferredDate || new Date().toISOString().split('T')[0],
                  preferredTime: paypalStateRef.current.preferredTime || '10:00 AM',
                  remoteTool: paypalStateRef.current.remoteTool || 'AnyDesk',
                  remoteId: paypalStateRef.current.remoteId || '000 000 000',
                  amount: paypalStateRef.current.finalPrice,
                  paymentStatus: 'Paid',
                  status: 'Technician Assigned'
                };

                setConfirmedBooking(verifiedBooking);
                onBookingSuccess(verifiedBooking);

                sendAdminOrderNotificationEmail({
                  type: 'REMOTE_BOOKING',
                  customerName: verifiedBooking.customerName,
                  email: verifiedBooking.email,
                  phone: verifiedBooking.phone,
                  title: verifiedBooking.serviceTitle,
                  amount: verifiedBooking.amount,
                  paymentId: `PayPal: ${data.orderID}`,
                  orderOrBookingId: verifiedBooking.bookingNumber,
                  remoteId: verifiedBooking.remoteId,
                  problemDescription: verifiedBooking.problemDescription
                });

                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              } else {
                setErrorMessage(captureData.message || captureData.error || 'PayPal payment verification failed.');
              }
            } catch (err: any) {
              setErrorMessage('PayPal capture network error. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
          onCancel: () => {
            setErrorMessage('PayPal booking checkout was cancelled.');
            setIsSubmitting(false);
          },
          onError: (err: any) => {
            console.error('PayPal Booking Error:', err);
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
        }).render('#paypal-booking-button-container');

        if (!isCancelled) {
          setPaypalReady(true);
          setPaypalLoading(false);
        }
      } catch (e: any) {
        console.error('PayPal setup failed:', e);
        if (!isCancelled) {
          setPaypalLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      initPayPal();
    }, 40);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [paymentMethod, confirmedBooking]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    setErrorMessage('');

    if (PAYPAL_CHECKOUT_ENABLED && paymentMethod === 'paypal') {
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address or leave it blank.');
      return;
    }

    if (!phoneValidation.isValid || !phoneValidation.e164) {
      setErrorMessage('Please enter a valid WhatsApp number for the selected country.');
      return;
    }

    setIsSubmitting(true);

    const generatedBookingNum = 'OMV-BOOK-' + Math.floor(1000 + Math.random() * 9000);
    const generatedId = 'bk-' + Date.now();
    const e164Phone = phoneValidation.e164;

    const fullClientBooking: RemoteBooking = {
      id: generatedId,
      bookingNumber: generatedBookingNum,
      customerName: customerName || 'Client',
      email: email || 'customer@example.com',
      phone: e164Phone,
      serviceId: selectedService?.id || 'srv-001',
      serviceTitle: selectedService?.title || 'Remote PC Support',
      issueCategory: selectedService?.category || 'Windows Fix',
      problemDescription: problemDescription.trim() || 'General remote PC inspection & support',
      preferredDate: preferredDate || new Date().toISOString().split('T')[0],
      preferredTime: preferredTime || '10:00 AM',
      remoteTool: remoteTool || 'AnyDesk',
      remoteId: remoteId || '000 000 000',
      remotePassword: remotePassword || '',
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
      console.warn('Backend API note:', err);
    }

    // Zero-total 100% Coupon Transition
    if (finalPrice <= 0) {
      bookingObj.razorpayPaymentId = 'FREE_COUPON_' + Date.now();
      setConfirmedBooking(bookingObj);
      onBookingSuccess(bookingObj);
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
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setIsSubmitting(false);
      return;
    }

    // Razorpay Flow
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
          name: 'OMOVE TECH',
          description: `Remote Support: ${bookingObj.serviceTitle}`,
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
              onBookingSuccess(bookingObj);
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
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
        setConfirmedBooking(bookingObj);
        onBookingSuccess(bookingObj);
        sendAdminOrderNotificationEmail({
          type: 'REMOTE_BOOKING',
          customerName: bookingObj.customerName,
          email: bookingObj.email,
          phone: bookingObj.phone,
          title: bookingObj.serviceTitle,
          amount: bookingObj.amount,
          paymentId: bookingObj.razorpayPaymentId || 'PAID_DIRECT',
          orderOrBookingId: bookingObj.bookingNumber,
          remoteId: bookingObj.remoteId,
          problemDescription: bookingObj.problemDescription
        });
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Razorpay popup error:', err);
      setErrorMessage('Payment initialization error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Sleek Minimal Header */}
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Certified Experts Online • 15 Min Fix</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Remote PC Support
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Fix Windows crashes, viruses, and slow performance live via AnyDesk.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {confirmedBooking ? (
        /* Minimal Clean Confirmation Card */
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-emerald-200 shadow-xl space-y-6 text-slate-900 text-center max-w-lg mx-auto animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Booking Confirmed!</h2>
            <p className="text-xs text-slate-500">
              Booking ID: <strong className="font-mono text-emerald-700">{confirmedBooking.bookingNumber}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5 font-sans">
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-semibold text-slate-900">{confirmedBooking.serviceTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-emerald-700">₹{confirmedBooking.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Connection Tool:</span>
              <span className="font-semibold text-slate-900">AnyDesk</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={CONTACT_CONFIG.whatsapp.getLink(
                `Hello OMOVE! I completed booking.\nBooking ID: ${confirmedBooking.bookingNumber}\nName: ${confirmedBooking.customerName}\nService: ${confirmedBooking.serviceTitle}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Connect on WhatsApp Now</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              View Order in Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Sleek 2-Column Minimalist Booking Grid */
        <form onSubmit={handleSubmitBooking} className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Main Booking Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
            {/* Multiple Services Selector (if > 1) or Clean Service Bar */}
            {services.length > 1 ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 block">Select Service</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((srv) => {
                    const isSelected = selectedService?.id === srv.id;
                    return (
                      <button
                        type="button"
                        key={srv.id}
                        onClick={() => setSelectedService(srv)}
                        className={`p-3 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-600 text-slate-900 ring-1 ring-emerald-600'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-semibold text-xs">{srv.title}</span>
                        <span className="font-bold text-xs text-emerald-700 font-mono">₹{srv.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs sm:text-sm text-slate-900">{selectedService?.title || 'Remote PC Support'}</h2>
                    <p className="text-[11px] text-slate-500">Live 1-on-1 inspection & instant fix</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through font-mono mr-1.5">₹{originalPrice}</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">₹{basePrice}</span>
                </div>
              </div>
            )}

            {/* Customer Inputs: Name & Email */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  Full Name <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-xs"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">
                  Email Address <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-xs"
                />
              </div>
            </div>

            {/* WhatsApp Phone Input */}
            <div>
              <InternationalPhoneInput
                value={phone}
                onChange={(val, valRes) => {
                  setPhone(val);
                  setPhoneValidation(valRes);
                }}
                touched={phoneTouched}
                onBlur={() => setPhoneTouched(true)}
                disabled={isSubmitting}
                hideHelperText={true}
              />
            </div>

            {/* Issue Description */}
            <div>
              <label className="text-slate-600 font-semibold block mb-1 text-xs">
                Describe Problem <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Blue Screen crash, slow PC, virus infection... (optional)"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all text-xs"
              />
            </div>

            {/* Collapsible Coupon Code */}
            <div className="pt-1">
              {!showCouponInput && appliedDiscount === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowCouponInput(true)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Have a discount coupon?</span>
                </button>
              ) : appliedDiscount > 0 ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <span className="font-medium">Coupon applied: -₹{appliedDiscount}</span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] text-rose-600 hover:underline cursor-pointer font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. OMOVE15)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBookingCoupon}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponMessage && appliedDiscount === 0 && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{couponMessage}</p>
              )}
            </div>

            {/* Payment Method Cards (Only if enabled or needed) */}
            {finalPrice > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <PaymentMethodCards
                  paymentMethod={paymentMethod}
                  onSelectMethod={(m) => {
                    setPaymentMethod(m);
                    setPaypalReady(false);
                  }}
                  inrAmount={finalPrice}
                  usdAmountDisplay={previewUsdDisplay}
                  razorpayTitle="RAZORPAY"
                  razorpaySubtitle="UPI • Google Pay • Cards • NetBanking"
                  razorpayTagline="Instant Secure Payment"
                  themeAccent="emerald"
                  variant="light"
                  layout="stack"
                />

                {/* PayPal Container if Enabled & Selected */}
                {PAYPAL_CHECKOUT_ENABLED && paymentMethod === 'paypal' && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-blue-200 space-y-2 animate-fadeIn">
                    <div className="text-center">
                      <span className="text-xs text-blue-800 font-mono font-bold">
                        {paypalLoading ? 'Loading PayPal Gateway...' : `Complete with PayPal • $${previewUsdDisplay} USD`}
                      </span>
                    </div>
                    <div id="paypal-booking-button-container" className="min-h-[44px] w-full" />
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            {(!PAYPAL_CHECKOUT_ENABLED || paymentMethod === 'razorpay') && (
              <button
                type="submit"
                disabled={isSubmitting || !isOnline || (phoneTouched && !phoneValidation.isValid)}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isOnline || (phoneTouched && !phoneValidation.isValid)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 hover:scale-[1.01]'
                }`}
              >
                {!isOnline ? (
                  <>
                    <WifiOff className="w-4 h-4 text-rose-500" />
                    <span>Offline — Checkout Unavailable</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Securing Booking...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{finalPrice > 0 ? `Pay ₹${finalPrice} & Start WhatsApp Fix` : 'Confirm Free Booking (₹0)'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {/* Trust line under button */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Money-Back Guarantee</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>256-Bit SSL</span>
              </span>
            </div>
          </div>

          {/* Clean Unified Sidebar: Summary & 3-Step Process (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
              {/* Order Summary Line */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Order Summary</span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-medium">{selectedService?.title || 'Remote PC Support'}</span>
                  <span className="font-bold text-slate-900 font-mono">₹{basePrice}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span>- ₹{appliedDiscount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total:</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">₹{finalPrice}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">How it works</span>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Complete Booking</span>
                      <span className="text-slate-500 text-[11px]">Pay securely via UPI or Card.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">WhatsApp Connect</span>
                      <span className="text-slate-500 text-[11px]">Share your 9-digit AnyDesk code on chat.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Issue Resolved Live</span>
                      <span className="text-slate-500 text-[11px]">Technician fixes your PC while you watch.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimal AnyDesk Link */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Need AnyDesk software?</span>
                <a
                  href="https://anydesk.com/en/downloads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Free Download</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>

              {/* Refund guarantee pill */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Risk Guarantee:</strong> If we are unable to resolve your problem, your payment is 100% refunded.
                </span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
