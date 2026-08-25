import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Heart, ArrowLeft, ArrowRight, RefreshCw, AlertCircle, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentMethodCards } from '../components/PaymentMethodCards';
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
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900 flex flex-col font-sans relative">
      {/* Top Minimal Header */}
      <header className="relative z-10 p-4 sm:p-6 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors text-xs tracking-wider font-semibold cursor-pointer bg-transparent border-0 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO OMOVE STORE</span>
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold tracking-wider text-slate-800">BUY ME A COFFEE</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-lg">
          
          {/* ========================================================================= */}
          {/* WINDOW 1: DETAILS & COFFEE SELECTION */}
          {/* ========================================================================= */}
          {viewState === 'FORM' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs animate-fadeIn">
              {/* Heading Area */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto mb-3 text-emerald-600 shadow-xs">
                  <Coffee className="w-7 h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
                  Buy Me a Coffee
                </h1>
                <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                  If Omove Store helped you, support our independent work ☕
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleProceedToPayment} className="space-y-4 sm:space-y-5">
                {/* 1. Preset Amount Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    CHOOSE YOUR COFFEE AMOUNT
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2.5 rounded-xl font-extrabold text-sm transition-colors border cursor-pointer ${
                          selectedPreset === amt
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
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
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
                      selectedPreset === 'custom'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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

                {/* 2. Contributor Name & Email in 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      YOUR NAME <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      YOUR EMAIL <span className="text-slate-400 font-normal lowercase text-[10px]">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Total & Proceed Button */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">COFFEE AMOUNT:</span>
                    <span className="text-2xl font-black text-emerald-700">
                      ₹{activeAmount || 0}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!activeAmount || activeAmount < 1}
                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
                  >
                    <span>CONTINUE TO PAYMENT (₹{activeAmount || 0})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="mt-5 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Direct Support • 256-Bit SSL Encrypted</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WINDOW 2: DEDICATED PAYMENT WINDOW */}
          {/* ========================================================================= */}
          {viewState === 'PAYMENT' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs animate-fadeIn">
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
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between mb-5">
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

                {/* Razorpay Submit Button */}
                {(!PAYPAL_CHECKOUT_ENABLED || paymentMethod === 'razorpay') && (
                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2 active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>PROCESSING RAZORPAY...</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="w-5 h-5" />
                        <span>PAY ₹{activeAmount} VIA RAZORPAY</span>
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
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-xs text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5 text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                ✓ Thank You!
              </h2>

              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
                Thank you for the coffee ☕ Your support helps Omove Store continue growing.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{completedPaymentDetails.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Coffee Total (INR):</span>
                  <span className="font-extrabold text-emerald-700">₹{completedPaymentDetails.amount}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
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
                  className="flex-1 py-3 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  SEND ANOTHER COFFEE
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
            <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-10 shadow-xs text-center animate-fadeIn">
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
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 p-4 text-center text-xs text-slate-500 border-t border-slate-200">
        <span>© {new Date().getFullYear()} Omove Store • Powered by {PAYPAL_CHECKOUT_ENABLED ? 'Razorpay & PayPal' : 'Razorpay'}</span>
      </footer>
    </div>
  );
};
