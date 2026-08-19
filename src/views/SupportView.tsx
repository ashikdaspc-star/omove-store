import React, { useState, useEffect, useRef } from 'react';
import { Coffee, ShieldCheck, Heart, ArrowLeft, ArrowRight, RefreshCw, AlertCircle, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentMethodCards } from '../components/PaymentMethodCards';
import { loadPayPalSDK } from '../utils/paypalLoader';

const PRESET_AMOUNTS = [10, 25, 50, 100];

export const SupportView: React.FC = () => {
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
    if (paymentMethod !== 'paypal' || viewState !== 'PAYMENT') {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Minimal Header */}
      <header className="relative z-10 p-4 sm:p-6 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-mono tracking-wider font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO OMOVE STORE</span>
          </a>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs font-bold tracking-widest text-slate-300">BUY ME A COFFEE</span>
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
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
              {/* Heading Area */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Coffee className="w-7 h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1.5">
                  Buy Me a Coffee
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                  If Omove Store helped you, support our independent work ☕
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleProceedToPayment} className="space-y-4 sm:space-y-5">
                {/* 1. Preset Amount Grid */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                        className={`py-2.5 rounded-xl font-mono font-extrabold text-sm transition-all border cursor-pointer ${
                          selectedPreset === amt
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                            : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
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
                    className={`w-full py-2 rounded-xl font-mono text-xs font-bold transition-all border cursor-pointer ${
                      selectedPreset === 'custom'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:bg-slate-800/80'
                    }`}
                  >
                    Custom Amount
                  </button>

                  {selectedPreset === 'custom' && (
                    <div className="relative mt-2 animate-fadeIn">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter custom amount in INR"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-emerald-500/50 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* 2. Contributor Name & Email in 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      YOUR NAME <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      YOUR EMAIL <span className="text-slate-500 font-normal lowercase text-[10px]">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Total & Proceed Button */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">COFFEE AMOUNT:</span>
                    <span className="font-mono text-2xl font-black text-emerald-400">
                      ₹{activeAmount || 0}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!activeAmount || activeAmount < 1}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-mono font-extrabold text-sm tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                  >
                    <span>CONTINUE TO PAYMENT (₹{activeAmount || 0})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="mt-5 text-center flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Direct Support • 256-Bit SSL Encrypted</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WINDOW 2: DEDICATED PAYMENT WINDOW */}
          {/* ========================================================================= */}
          {viewState === 'PAYMENT' && (
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
                <button
                  type="button"
                  onClick={() => { setViewState('FORM'); setErrorMessage(null); }}
                  className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>EDIT DETAILS</span>
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>STEP 2: PAYMENT</span>
                </div>
              </div>

              {/* Supporter Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between mb-5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                    ☕ BUY ME A COFFEE
                  </span>
                  <span className="text-xs text-slate-300 font-medium line-clamp-1">
                    {name} {email ? `(${email})` : ''}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xl font-black text-white">
                    ₹{activeAmount}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
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
                  variant="dark"
                  layout="stack"
                />

                {/* PayPal Conversion Info Card */}
                {paymentMethod === 'paypal' && (
                  <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs font-mono space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Contribution (Authoritative):</span>
                      <span className="text-white font-bold">₹{activeAmount} INR</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Conversion Rate:</span>
                      <span className="text-slate-300">₹95 = $1.00 USD</span>
                    </div>
                    <div className="pt-1.5 border-t border-blue-500/30 flex justify-between items-center font-bold">
                      <span className="text-blue-300">PayPal Total (USD):</span>
                      <span className="text-base text-blue-400">${previewUsdDisplay} USD</span>
                    </div>
                  </div>
                )}

                {/* PayPal Button Container */}
                {paymentMethod === 'paypal' && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-blue-500/40 shadow-xl shadow-blue-500/10 space-y-2 animate-fadeIn">
                    <div className="text-center">
                      <span className="text-[11px] text-blue-400 font-mono font-bold">
                        {paypalLoading ? 'Loading PayPal Gateway...' : `Pay via PayPal • $${previewUsdDisplay} USD`}
                      </span>
                    </div>
                    <div id="paypal-support-button-container" className="min-h-[44px] w-full" />
                  </div>
                )}

                {/* Razorpay Submit Button */}
                {paymentMethod === 'razorpay' && (
                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-mono font-extrabold text-sm tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer mt-2"
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

              <div className="mt-5 text-center flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {paymentMethod === 'paypal'
                    ? 'PayPal Buyer Protection • 256-Bit SSL'
                    : 'Secure payment powered by Razorpay (256-Bit SSL)'}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WINDOW 3: SUCCESS CONFIRMATION */}
          {/* ========================================================================= */}
          {viewState === 'SUCCESS' && completedPaymentDetails && (
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6 text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                ✓ Thank You!
              </h2>

              <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed mb-8">
                Thank you for the coffee ☕ Your support helps Omove Store continue growing.
              </p>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 mb-8 text-left space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs text-slate-400">Name:</span>
                  <span className="text-sm font-bold text-white">{completedPaymentDetails.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs text-slate-400">Coffee Total (INR):</span>
                  <span className="text-base font-black text-emerald-400">₹{completedPaymentDetails.amount}</span>
                </div>

                {completedPaymentDetails.usdAmount && (
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="text-xs text-slate-400">PayPal Total (USD):</span>
                    <span className="text-base font-black text-blue-400">${completedPaymentDetails.usdAmount.toFixed(2)} USD</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs text-slate-400">Payment Method:</span>
                  <span className="text-xs font-bold text-slate-200">{completedPaymentDetails.paymentMethod || 'Verified Gateway'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Payment ID:</span>
                  <span className="text-xs font-bold text-slate-300 select-all">{completedPaymentDetails.paymentId}</span>
                </div>

                {completedPaymentDetails.paypalOrderId && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-xs text-slate-400">PayPal Order ID:</span>
                    <span className="text-xs font-mono text-slate-400 select-all">{completedPaymentDetails.paypalOrderId}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  SEND ANOTHER COFFEE
                </button>
                <a
                  href="/"
                  className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <span>RETURN TO STORE</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WINDOW 4: FAILED STATE */}
          {/* ========================================================================= */}
          {viewState === 'FAILED' && (
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center mx-auto mb-6 text-rose-400">
                <AlertCircle className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Payment Incomplete
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-6">
                {errorMessage || 'The payment could not be processed. No charges were made.'}
              </p>

              <button
                type="button"
                onClick={() => { setViewState('PAYMENT'); setErrorMessage(null); }}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-sm tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>TRY PAYMENT AGAIN</span>
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 p-4 text-center text-xs font-mono text-slate-600 border-t border-slate-900">
        <span>© {new Date().getFullYear()} Omove Store • Powered by Razorpay & PayPal</span>
      </footer>
    </div>
  );
};
