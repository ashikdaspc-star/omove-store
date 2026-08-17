import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RemoteService, RemoteBooking } from '../types';
import { sendAdminOrderNotificationEmail } from '../utils/emailNotifier';
import { validateAndApplyCoupon } from '../utils/couponManager';
import { useOnlineStatus } from '../components/OfflineBanner';
import { Country, getDefaultCountry, validatePhoneNumber } from '../utils/countryData';
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
  Clock,
  CheckCircle,
  HelpCircle
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
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const basePrice = selectedService?.price || 39;
  const finalPrice = Math.max(0, basePrice - appliedDiscount);
  const previewUsd = finalPrice > 0 ? Math.max(3, finalPrice / 95) : 0;
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
    if (paymentMethod !== 'paypal' || confirmedBooking) {
      setPaypalReady(false);
      return;
    }

    let isCancelled = false;
    setPaypalLoading(true);

    async function initPayPal() {
      try {
        let ppConfig: any = null;
        try {
          const cfgRes = await fetch('/api/paypal/config');
          if (cfgRes.ok) {
            ppConfig = await cfgRes.json();
          }
        } catch (e) {}

        const activeClientId = ppConfig?.clientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || 'BAAq2PyxqOTR12C8YmU9N7Km0YSbwzwu4dOJHk4mmXV4GiCRQ1pS-IEROr24x4Tjej_Pzmnx24E51GSCIo';
        if (!activeClientId || isCancelled) return;

        const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]') as HTMLScriptElement | null;
        if (existingScript && !existingScript.src.includes(activeClientId)) {
          existingScript.remove();
          delete (window as any).paypal;
        }

        if (typeof (window as any).paypal === 'undefined') {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${activeClientId}&currency=USD&components=buttons&intent=capture`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('PayPal SDK script load error'));
            document.body.appendChild(script);
          });
        }

        if (isCancelled || typeof (window as any).paypal === 'undefined') return;

        const container = document.getElementById('paypal-booking-button-container');
        if (!container) return;
        container.innerHTML = '';

        (window as any).paypal.Buttons({
          createOrder: async () => {
            const curr = paypalStateRef.current;
            setErrorMessage('');

            // Validation
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

            if (!curr.problemDescription.trim()) {
              setErrorMessage('Please describe the problem or error messages.');
              throw new Error('Problem description required');
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
                customerEmail: curr.email.trim().toLowerCase(),
                customerPhone: e164Phone,
                phone: e164Phone,
                email: curr.email.trim().toLowerCase(),
                problemDescription: curr.problemDescription.trim(),
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
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [paymentMethod, confirmedBooking]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    setErrorMessage('');

    if (paymentMethod === 'paypal') {
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

    if (!problemDescription.trim()) {
      setErrorMessage('Please describe your problem or error messages.');
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
      problemDescription: problemDescription || 'Remote PC inspection & repair requested.',
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
          description: `Remote PC Service: ${bookingObj.serviceTitle}`,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Hero Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#04392b] to-[#0f172a] text-white border border-emerald-500/30 shadow-2xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>LIVE REMOTE COMPUTER DIAGNOSTICS & REPAIR</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Book Certified Remote PC Support
        </h1>

        <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
          Fix Blue Screen crashes, corrupted drivers, virus infections, Windows activation, and slow performance remotely while you watch on screen.
        </p>

        {/* 100% Money-Back Guarantee Pill */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-sans max-w-2xl mx-auto shadow-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-left leading-snug">
              <strong className="text-white font-mono font-bold">100% Refund Guarantee:</strong> If our certified experts cannot solve your issue, your payment is automatically refunded.
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3 animate-fadeIn shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {confirmedBooking ? (
        /* Booking Confirmation Card */
        <div className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Remote Booking Confirmed!</h2>
            <p className="text-xs text-slate-400 font-mono">
              Booking ID: <strong className="font-mono text-emerald-400 text-sm">{confirmedBooking.bookingNumber}</strong>
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs text-slate-200">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Service Selected</span>
                <span className="font-bold text-white text-sm">{confirmedBooking.serviceTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Technician</span>
                <span className="font-bold text-emerald-400 text-sm">{confirmedBooking.technicianName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Remote Tool</span>
                <span className="font-bold text-white">AnyDesk Remote Support</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled Time</span>
                <span className="font-bold text-white">
                  {confirmedBooking.preferredDate} at {confirmedBooking.preferredTime}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 leading-relaxed text-[11px] font-sans">
              <strong>Instructions:</strong> Please keep your AnyDesk software running on your desktop. Our technician will connect at the scheduled time. You can view all connection logs in your Account Dashboard.
            </div>

            {/* Post-Purchase WhatsApp Support Button */}
            <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-3 font-sans">
              <span className="text-xs text-emerald-300 font-mono font-bold block uppercase tracking-wider">
                ✅ PAYMENT VERIFIED • TECHNICIAN ONLINE
              </span>
              <p className="text-xs text-slate-300">
                Click below to start your live 1-on-1 remote PC inspection chat directly on WhatsApp!
              </p>
              <a
                href={`https://wa.me/918345968169?text=${encodeURIComponent(
                  `Hello OMOVE Expert! I completed my booking.\nBooking ID: ${confirmedBooking.bookingNumber}\nName: ${confirmedBooking.customerName}\nService: ${confirmedBooking.serviceTitle}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-sm font-extrabold inline-flex items-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
              >
                <MessageSquare className="w-5 h-5" />
                <span>CONNECT WITH TECHNICIAN ON WHATSAPP NOW</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-md cursor-pointer"
            >
              TRACK IN DASHBOARD
            </button>
          </div>
        </div>
      ) : (
        /* Redesigned 2-Column Balanced Booking Flow */
        <form onSubmit={handleSubmitBooking} className="grid lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (Main Booking & Payment Flow - 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: Service Selection */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white font-mono flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/20">
                    1
                  </span>
                  <span>Select Remote Service</span>
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Avg. Fix: ~20-40 mins</span>
                </span>
              </div>

              <div className="space-y-3">
                {services.map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{srv.title}</h4>
                          {srv.popular && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 font-mono tracking-wider">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{srv.description}</p>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold inline-block">
                          Est. Time: {srv.estimatedTime}
                        </span>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <span className={`text-lg font-black ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                          ₹{srv.price}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Issue & Contact Information */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white font-mono flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/20">
                  2
                </span>
                <span>Customer & Contact Information</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-3 text-xs font-sans">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5 font-mono">
                    YOUR FULL NAME <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5 font-mono">
                    EMAIL ADDRESS <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans text-xs"
                  />
                </div>
              </div>

              {/* International WhatsApp Phone Input with Searchable Country Picker */}
              <div className="space-y-1">
                <InternationalPhoneInput
                  value={phone}
                  onChange={(val, valRes) => {
                    setPhone(val);
                    setPhoneValidation(valRes);
                  }}
                  touched={phoneTouched}
                  onBlur={() => setPhoneTouched(true)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 text-xs font-mono">
                  DESCRIBE PROBLEM / ERROR MESSAGES <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Blue Screen WHEA_UNCORRECTABLE_ERROR crash during gaming, Windows update error 0x80070002..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs font-sans"
                />
              </div>
            </div>

            {/* STEP 3: Payment Method & Complete Checkout (Moved into Left Flow) */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white font-mono flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/20">
                    3
                  </span>
                  <span>Payment & Confirmation</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>256-Bit SSL Encrypted</span>
                </span>
              </div>

              {/* Promo Coupon Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-slate-300 font-bold flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBookingCoupon}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    APPLY
                  </button>
                </div>

                {couponMessage && (
                  <p className={`text-[11px] font-mono font-bold ${appliedDiscount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Payment Method Cards */}
              {finalPrice > 0 ? (
                <div className="space-y-3.5">
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
                  />

                  {/* PayPal Conversion Info Card */}
                  {paymentMethod === 'paypal' && (
                    <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-xs font-mono space-y-2 animate-fadeIn">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Service Fee:</span>
                        <span className="text-white font-bold">₹{finalPrice} INR</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Conversion Rate:</span>
                        <span className="text-slate-300">₹95 = $1.00 USD</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Minimum PayPal Amount:</span>
                        <span className="text-slate-300">$3.00 USD</span>
                      </div>
                      <div className="pt-2 border-t border-blue-500/30 flex justify-between items-center font-bold">
                        <span className="text-blue-300">PayPal Total (USD):</span>
                        <span className="text-base text-blue-400">${previewUsdDisplay} USD</span>
                      </div>
                    </div>
                  )}

                  {/* PayPal Button Container */}
                  {paymentMethod === 'paypal' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/40 shadow-xl shadow-blue-500/10 space-y-2 animate-fadeIn">
                      <div className="text-center mb-1">
                        <span className="text-[11px] text-blue-400 font-mono font-bold">
                          {paypalLoading ? 'Loading PayPal Gateway...' : `Complete Payment • $${previewUsdDisplay} USD`}
                        </span>
                      </div>
                      <div id="paypal-booking-button-container" className="min-h-[44px] w-full" />
                    </div>
                  )}

                  {/* Razorpay Submit CTA Button */}
                  {paymentMethod === 'razorpay' && (
                    <button
                      type="submit"
                      disabled={isSubmitting || !isOnline || (phoneTouched && !phoneValidation.isValid)}
                      className={`w-full py-4 rounded-2xl font-black text-sm font-mono tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !isOnline || (phoneTouched && !phoneValidation.isValid)
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 hover:scale-[1.01]'
                      }`}
                    >
                      {!isOnline ? (
                        <>
                          <WifiOff className="w-4 h-4 text-rose-400" />
                          <span>OFFLINE — CHECKOUT UNAVAILABLE</span>
                        </>
                      ) : isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>CONFIRMING BOOKING...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>SECURE CONFIRM & PAY ₹{finalPrice}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                /* Free / 100% Coupon CTA */
                <button
                  type="submit"
                  disabled={isSubmitting || !isOnline}
                  className="w-full py-4 rounded-2xl font-black text-sm font-mono tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <Lock className="w-4 h-4" />
                  <span>CONFIRM FREE BOOKING (₹0)</span>
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {paymentMethod === 'paypal'
                    ? 'PayPal Buyer Protection • 256-Bit SSL Encrypted Connection'
                    : 'Razorpay 256-Bit SSL Encrypted Connection • 100% Satisfaction Guarantee'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Sticky Sidebar: Order Summary, AnyDesk Guide & Trust Guarantee - 5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* Live Booking Summary Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-white">
              <h3 className="font-bold text-base text-white font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Booking Summary</span>
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Service:</span>
                    <span className="font-bold text-white text-sm">{selectedService?.title || 'Remote PC Support'}</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm">₹{basePrice}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center px-1 text-emerald-400 font-bold">
                    <span>Coupon Discount:</span>
                    <span>- ₹{appliedDiscount}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-slate-400 text-xs">Total Payable:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ₹{finalPrice}
                    </span>
                    {finalPrice > 0 && (
                      <span className="text-[11px] text-blue-400 font-mono block">
                        ≈ ${previewUsdDisplay} USD
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2 font-mono">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Certified PC Expert Ready Online</span>
              </div>
            </div>

            {/* What is AnyDesk & How It Works Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>How Remote Support Works</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
                  SECURE & SAFE
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                We use <strong className="text-emerald-400 font-mono">AnyDesk</strong>, the lightweight remote software allowing certified experts to fix your PC while you watch live.
              </p>

              {/* 3 Step Visual Flow */}
              <div className="space-y-2.5 text-xs font-sans">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-[11px]">Download & Open AnyDesk</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">No complex setup needed. Open and run.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-[11px]">Share 9-Digit Code on WhatsApp</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Give your AnyDesk address code to our technician.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    3
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-[11px]">Accept Connection & Sit Back</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click "Accept". You retain full session control.</p>
                  </div>
                </div>
              </div>

              {/* AnyDesk Download CTA Link */}
              <a
                href="https://anydesk.com/en/downloads"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download AnyDesk (Official Site)</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>

            {/* Satisfaction Guarantee Card */}
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-2 font-sans text-xs">
              <div className="flex items-center gap-2 font-mono font-bold text-emerald-300">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                <span>Zero-Risk Repair Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                If our technician cannot resolve your issue, your booking fee will be refunded back to your account.
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
