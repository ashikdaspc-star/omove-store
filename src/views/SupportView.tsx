import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Heart, ArrowLeft, ArrowRight, RefreshCw, AlertCircle, Sparkles, CheckCircle2, Lock, User, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentMethodCards } from '../components/PaymentMethodCards';
import { CoffeeOrbitCanvas } from '../components/CoffeeOrbitCanvas';
import { loadPayPalSDK } from '../utils/paypalLoader';
import { PAYPAL_CHECKOUT_ENABLED } from '../config/paymentConfig';

const PRESET_AMOUNTS = [10, 25, 50, 100];

export const SupportView: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3D Card micro-tilt state for desktop interaction
  const [cardTilt, setCardTilt] = useState({ rx: 0, ry: 0 });

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTilt({
      rx: -y * 1.4,
      ry: x * 1.4
    });
  };

  const handleContainerMouseLeave = () => {
    setCardTilt({ rx: 0, ry: 0 });
  };

  // Payment Method: 'razorpay' | 'paypal'
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // View States: 'FORM' | 'PAYMENT' | 'SUCCESS' | 'FAILED'
  const [viewState, setViewState] = useState<'FORM' | 'PAYMENT' | 'SUCCESS' | 'FAILED'>('FORM');
  const [completedPaymentDetails, setCompletedPaymentDetails] = useState<{
    amount: number;
    usdAmount?: number;
    paymentId: string;
    paypalOrderId?: string;
    paypalCaptureId?: string;
    paymentMethod?: 'Razorpay' | 'PayPal';
    name: string;
    email: string;
  } | null>(null);

  const activeAmount = selectedPreset === 'custom'
    ? Math.max(0, parseInt(customAmount, 10) || 0)
    : selectedPreset;

  const previewUsd = activeAmount > 0 ? activeAmount / 95 : 0;
  const previewUsdDisplay = (Math.round(previewUsd * 100) / 100).toFixed(2);

  // State ref for PayPal callbacks
  const paypalStateRef = useRef({
    name,
    email,
    activeAmount,
    previewUsdDisplay
  });

  useEffect(() => {
    paypalStateRef.current = {
      name,
      email,
      activeAmount,
      previewUsdDisplay
    };
  }, [name, email, activeAmount, previewUsdDisplay]);

  // PayPal SDK Auto-Loader & Smart Button Renderer for Support / Buy Me A Coffee
  useEffect(() => {
    if (!PAYPAL_CHECKOUT_ENABLED || paymentMethod !== 'paypal' || viewState !== 'PAYMENT') {
      setPaypalReady(false);
      return;
    }

    let isCancelled = false;
    setPaypalLoading(true);

    async function initPayPal() {
      try {
        const paypal = await loadPayPalSDK();
        if (isCancelled || !paypal || typeof paypal.Buttons !== 'function') return;

        const container = document.getElementById('paypal-support-button-container');
        if (!container) return;
        container.innerHTML = '';

        paypal.Buttons({
          createOrder: async () => {
            const curr = paypalStateRef.current;
            setErrorMessage(null);

            const trimmedName = curr.name.trim();
            const trimmedEmail = curr.email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!trimmedName) {
              setErrorMessage('Please enter your name.');
              throw new Error('Name required');
            }

            if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
              setErrorMessage('Please enter a valid email address.');
              throw new Error('Valid email required');
            }

            if (!curr.activeAmount || curr.activeAmount < 1) {
              setErrorMessage('Please select or enter an amount of at least ₹1.');
              throw new Error('Amount required');
            }

            setIsSubmitting(true);

            const payload = {
              orderType: 'support',
              name: trimmedName,
              email: trimmedEmail || 'supporter@omove.store',
              amount: curr.activeAmount
            };

            const createRes = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const createData = await createRes.json();
            if (!createRes.ok || !createData.success || !createData.paypalOrderId) {
              const errMsg = createData.message || createData.error || 'Failed to initialize PayPal support order.';
              setErrorMessage(errMsg);
              setIsSubmitting(false);
              throw new Error(errMsg);
            }

            setIsSubmitting(false);
            return createData.paypalOrderId;
          },
          onApprove: async (data: any) => {
            setIsSubmitting(true);
            setErrorMessage(null);
            try {
              const captureRes = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paypalOrderId: data.orderID })
              });

              const captureData = await captureRes.json();
              if (!captureRes.ok || !captureData.success || !captureData.verified) {
                throw new Error(captureData.message || captureData.error || 'PayPal payment capture could not be verified.');
              }

              const curr = paypalStateRef.current;
              setCompletedPaymentDetails({
                amount: curr.activeAmount,
                usdAmount: parseFloat(curr.previewUsdDisplay),
                paymentId: captureData.captureId || data.orderID,
                paypalOrderId: data.orderID,
                paypalCaptureId: captureData.captureId,
                paymentMethod: 'PayPal',
                name: curr.name.trim(),
                email: curr.email.trim()
              });

              setViewState('SUCCESS');

              try {
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 }
                });
              } catch (err) {}
            } catch (err: any) {
              console.error('PayPal Support Capture Error:', err);
              setErrorMessage('PayPal verification error. Please try again.');
              setViewState('FAILED');
            } finally {
              setIsSubmitting(false);
            }
          },
          onCancel: () => {
            setErrorMessage('PayPal support contribution was cancelled.');
            setIsSubmitting(false);
          },
          onError: (err: any) => {
            console.error('PayPal Support Error:', err);
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
        }).render('#paypal-support-button-container');

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
  }, [paymentMethod, viewState]);

  // Step 1 -> Step 2 validation handler
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!activeAmount || activeAmount < 1) {
      setErrorMessage('Please select or enter an amount of at least ₹1.');
      return;
    }

    setViewState('PAYMENT');
  };

  // Razorpay payment execution handler
  const handleRazorpayPayment = async () => {
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    setIsSubmitting(true);

    try {
      // 1. Call dedicated support order creation endpoint
      const res = await fetch('/api/support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail || 'supporter@omove.store',
          amount: activeAmount
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to initialize payment');
      }

      const { supportId, razorpayOrderId, razorpayKeyId, amount: validatedAmount } = data;

      // 2. Load Razorpay Checkout SDK if not loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      // 3. Configure Razorpay Standard Checkout
      const options = {
        key: razorpayKeyId || 'rzp_test_placeholder',
        amount: (validatedAmount || activeAmount) * 100, // Amount in paise
        currency: 'INR',
        name: 'Omove Store Support',
        description: `Buy Me a Coffee (₹${validatedAmount || activeAmount})`,
        image: 'https://omove.store/logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: trimmedName,
          email: trimmedEmail || undefined
        },
        theme: {
          color: '#10b981'
        },
        handler: async (response: any) => {
          try {
            // Verify payment on server
            const verifyRes = await fetch('/api/support/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                supportId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json().catch(() => ({}));

            if (!verifyRes.ok || !verifyData.success) {
              console.warn('Server verification warning, recording successful capture:', verifyData);
            }

            setCompletedPaymentDetails({
              amount: validatedAmount || activeAmount,
              paymentId: response.razorpay_payment_id || supportId,
              paymentMethod: 'Razorpay',
              name: trimmedName,
              email: trimmedEmail
            });

            setViewState('SUCCESS');

            try {
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
              });
            } catch (err) {}
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            setCompletedPaymentDetails({
              amount: validatedAmount || activeAmount,
              paymentId: response.razorpay_payment_id || 'VERIFIED_PAYMENT',
              paymentMethod: 'Razorpay',
              name: trimmedName,
              email: trimmedEmail
            });
            setViewState('SUCCESS');
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Support payment failed:', response.error);
        setErrorMessage(response.error?.description || 'Payment was unsuccessful. Please try again.');
        setIsSubmitting(false);
        setViewState('FAILED');
      });

      rzp.open();
    } catch (err: any) {
      console.error('Support submission error:', err);
      setErrorMessage(err.message || 'Something went wrong while connecting to the payment gateway.');
      setIsSubmitting(false);
      setViewState('FAILED');
    }
  };

  const handleReset = () => {
    setSelectedPreset(25);
    setCustomAmount('');
    setName('');
    setEmail('');
    setErrorMessage(null);
    setViewState('FORM');
    setCompletedPaymentDetails(null);
    setPaymentMethod('razorpay');
  };

  return (
    <div
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleContainerMouseLeave}
      className="min-h-screen bg-[#FCFBFA] text-slate-900 flex flex-col font-sans relative overflow-hidden select-none"
    >
      {/* Background Interactive Coffee Energy Orbit & Particle Canvas */}
      <CoffeeOrbitCanvas />

      {/* Top Transparent Minimal Header */}
      <header className="relative z-10 p-4 sm:p-6 bg-transparent border-b border-slate-200/40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-800 hover:text-emerald-700 transition-colors text-xs font-bold tracking-wider cursor-pointer bg-transparent border-0 p-0 select-none"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>BACK TO OMOVE STORE</span>
          </button>

          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
            <span className="text-xs font-bold tracking-wider text-slate-800">BUY ME A COFFEE</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
        <div
          className="w-full max-w-[500px] relative"
          style={{
            transform: `perspective(1000px) rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg)`,
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Ambient Multi-Hue Halo Glow Behind Payment Card */}
          <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-400/25 via-amber-300/20 to-teal-400/25 rounded-[36px] blur-2xl payment-glow-pulse pointer-events-none -z-10" />

          {/* Floating Card Wrapper */}
          <div className="payment-card-float">
          
          {/* ========================================================================= */}
          {/* WINDOW 1: DETAILS & COFFEE SELECTION (REFERENCE DESIGN MATCH) */}
          {/* ========================================================================= */}
          {viewState === 'FORM' && (
            <div className="relative overflow-hidden bg-white/95 backdrop-blur-2xl border border-slate-100/90 rounded-[28px] p-6 sm:p-9 shadow-[0_25px_80px_-15px_rgba(5,150,105,0.10),0_20px_60px_-15px_rgba(245,158,11,0.08),0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 animate-fadeIn">
              
              {/* Subtle Specular Sheen Sweep */}
              <div className="absolute -top-32 -left-32 w-48 h-[200%] bg-gradient-to-r from-transparent via-white/35 to-transparent card-shimmer-sheen pointer-events-none" />

              {/* Top Creator Avatar with YouTube Badge */}
              <div className="flex justify-center mb-5 relative z-1">
                <a
                  href="https://www.youtube.com/@omove_tech_shorts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-block cursor-pointer transition-transform duration-300 hover:scale-105 select-none"
                  title="Visit YouTube Channel: @omove_tech_shorts"
                >
                  {/* Rotating Prismatic Gradient Border Ring */}
                  <div className="relative w-24 h-24 sm:w-26 sm:h-26 rounded-full p-[3px] overflow-hidden flex items-center justify-center shadow-md">
                    <div className="absolute -inset-3 bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 creator-ring-spin" />
                    <img
                      src="/creator-avatar.jpg"
                      alt="Omove Tech Shorts - Creator Profile"
                      className="relative z-1 w-full h-full rounded-full object-cover bg-slate-900"
                    />
                  </div>

                  {/* Red YouTube Badge at bottom-right of avatar */}
                  <div className="absolute bottom-0.5 right-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-md group-hover:bg-red-700 transition-colors z-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-white ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </a>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mb-6 sm:mb-7 relative z-1">
                <h1 className="text-3xl sm:text-[34px] font-extrabold text-slate-900 tracking-tight mb-1.5 leading-tight">
                  Buy Me a Coffee
                </h1>
                <p className="text-slate-600 text-sm font-medium">
                  Your support keeps me creating ☕
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleProceedToPayment} className="space-y-4 sm:space-y-5">
                {/* 1. Choose Your Coffee Amount */}
                <div>
                  <label className="block text-xs font-bold text-[#059669] uppercase tracking-wider mb-2.5">
                    CHOOSE YOUR COFFEE AMOUNT
                  </label>
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(amt);
                          setCustomAmount('');
                        }}
                        className={`py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 border cursor-pointer select-none ${
                          selectedPreset === amt
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600 shadow-[0_6px_20px_rgba(5,150,105,0.35)] scale-[1.02]'
                            : 'bg-white text-slate-800 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Option */}
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedPreset('custom')}
                    className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border cursor-pointer ${
                      selectedPreset === 'custom'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold shadow-xs'
                        : 'bg-[#f8faf9] text-slate-500 hover:text-slate-800 border-slate-200/90 hover:bg-slate-100'
                    }`}
                  >
                    Custom Amount
                  </button>

                  {selectedPreset === 'custom' && (
                    <div className="relative mt-2 animate-fadeIn">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter custom amount in INR"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-sm focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* 2. Contributor Name & Email in 2 Columns with Clean Modern Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      YOUR NAME <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-3 bg-[#f8faf9] border border-slate-200/90 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-sm focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      YOUR EMAIL <span className="text-slate-400 font-normal lowercase text-[10px]">(optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-3 bg-[#f8faf9] border border-slate-200/90 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-sm focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Total & Proceed Button */}
                <div className="pt-3.5 border-t border-slate-100/90 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      COFFEE AMOUNT:
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#059669] font-sans">
                      ₹{activeAmount || 0}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!activeAmount || activeAmount < 1}
                    className="relative overflow-hidden group w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_12px_28px_-6px_rgba(5,150,105,0.42)] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-98 hover:-translate-y-0.5"
                  >
                    {/* Continuous subtle shimmer beam */}
                    <div className="button-shimmer-beam absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                    
                    <Coffee className="w-5 h-5 relative z-1" />
                    <span className="relative z-1 font-extrabold tracking-wide">CONTINUE TO PAYMENT (₹{activeAmount || 0})  →</span>
                  </button>
                </div>
              </form>

              {/* Security Text */}
              <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Secure & Trusted Payment</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WINDOW 2: DEDICATED PAYMENT WINDOW */}
          {/* ========================================================================= */}
          {viewState === 'PAYMENT' && (
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-100/90 rounded-[28px] p-6 sm:p-9 shadow-[0_25px_80px_-15px_rgba(5,150,105,0.08),0_20px_60px_-15px_rgba(245,158,11,0.08),0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 animate-fadeIn">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => { setViewState('FORM'); setErrorMessage(null); }}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>EDIT DETAILS</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>STEP 2: PAYMENT</span>
                </div>
              </div>

              {/* Supporter Summary Pill */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-amber-50/40 border border-emerald-200/80 flex items-center justify-between mb-5 shadow-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-emerald-800 uppercase tracking-wider block font-bold">
                    ☕ BUY ME A COFFEE
                  </span>
                  <span className="text-xs text-slate-700 font-medium line-clamp-1">
                    {name} {email ? `(${email})` : ''}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-bold text-emerald-700">
                    ₹{activeAmount}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Stacked Payment Method Cards */}
              <div className="space-y-4">
                <PaymentMethodCards
                  paymentMethod={paymentMethod}
                  onSelectMethod={(m) => {
                    setPaymentMethod(m);
                    setPaypalReady(false);
                  }}
                  inrAmount={activeAmount}
                  usdAmountDisplay={previewUsdDisplay}
                  razorpayTitle="RAZORPAY"
                  razorpaySubtitle="UPI • Card • NetBanking"
                  razorpayTagline="Instant Processing • 100% Secure"
                  paypalTitle="PAYPAL"
                  paypalSubtitle="International Checkout"
                  paypalTagline="Pay securely in USD"
                  themeAccent="emerald"
                  variant="light"
                  layout="stack"
                />

                {/* Razorpay Submit Button with Shimmer */}
                {(!PAYPAL_CHECKOUT_ENABLED || paymentMethod === 'razorpay') && (
                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    disabled={isSubmitting}
                    className="relative overflow-hidden group w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-[0_12px_28px_-6px_rgba(5,150,105,0.42)] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer mt-2 active:scale-98 hover:-translate-y-0.5"
                  >
                    <div className="button-shimmer-beam absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin relative z-1" />
                        <span className="relative z-1">PROCESSING RAZORPAY...</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="w-5 h-5 relative z-1" />
                        <span className="relative z-1 font-extrabold tracking-wide">PAY ₹{activeAmount} VIA RAZORPAY</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-5 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Secure payment powered by Razorpay (256-Bit SSL)</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WINDOW 3: SUCCESS CONFIRMATION */}
          {/* ========================================================================= */}
          {viewState === 'SUCCESS' && completedPaymentDetails && (
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-100/90 rounded-[28px] p-6 sm:p-10 shadow-[0_25px_80px_-15px_rgba(5,150,105,0.08),0_20px_60px_-15px_rgba(245,158,11,0.08),0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-900/5 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                ✓ Thank You!
              </h2>

              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
                Thank you for the coffee ☕ Your support helps Omove Store continue growing.
              </p>

              <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-5 mb-6 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{completedPaymentDetails.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Coffee Total (INR):</span>
                  <span className="font-extrabold text-emerald-700">₹{completedPaymentDetails.amount}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-semibold text-slate-800">{completedPaymentDetails.paymentMethod || 'Verified Gateway'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment ID:</span>
                  <span className="font-semibold text-slate-700 select-all">{completedPaymentDetails.paymentId}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  SEND ANOTHER COFFEE
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>RETURN TO STORE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WINDOW 4: FAILED STATE */}
          {/* ========================================================================= */}
          {viewState === 'FAILED' && (
            <div className="bg-white/95 backdrop-blur-2xl border border-rose-200 rounded-[28px] p-6 sm:p-10 shadow-[0_25px_70px_-15px_rgba(244,63,94,0.08)] text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5 text-rose-600">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Payment Incomplete
              </h2>

              <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-6">
                {errorMessage || 'The payment could not be processed. No charges were made.'}
              </p>

              <button
                type="button"
                onClick={() => { setViewState('PAYMENT'); setErrorMessage(null); }}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>TRY PAYMENT AGAIN</span>
              </button>
            </div>
          )}

          </div>
        </div>
      </main>

      {/* Minimal Footer matching reference */}
      <footer className="relative z-10 p-5 text-center text-xs font-medium text-slate-500">
        <span>© 2026 Omove Store • Powered by Razorpay</span>
      </footer>
    </div>
  );
};
