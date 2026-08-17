import React, { useState, useEffect, useRef } from 'react';
import { Coffee, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { PaymentMethodCards } from '../components/PaymentMethodCards';

const PRESET_AMOUNTS = [10, 25, 50, 100];

export const SupportView: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Method: 'razorpay' | 'paypal'
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // View States: 'FORM' | 'SUCCESS' | 'FAILED'
  const [viewState, setViewState] = useState<'FORM' | 'SUCCESS' | 'FAILED'>('FORM');
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

  const previewUsd = activeAmount > 0 ? Math.max(3, activeAmount / 95) : 0;
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
    if (paymentMethod !== 'paypal' || viewState !== 'FORM') {
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

        const container = document.getElementById('paypal-support-button-container');
        if (!container) return;
        container.innerHTML = '';

        (window as any).paypal.Buttons({
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

            if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
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
              email: trimmedEmail,
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

              if (captureRes.ok && captureData.success && captureData.verified) {
                setCompletedPaymentDetails({
                  amount: paypalStateRef.current.activeAmount,
                  usdAmount: captureData.support?.paymentAmountUsd || parseFloat(paypalStateRef.current.previewUsdDisplay),
                  paymentId: captureData.support?.paypalCaptureId || data.orderID,
                  paypalOrderId: data.orderID,
                  paypalCaptureId: captureData.support?.paypalCaptureId,
                  paymentMethod: 'PayPal',
                  name: paypalStateRef.current.name.trim(),
                  email: paypalStateRef.current.email.trim().toLowerCase()
                });
                setViewState('SUCCESS');
              } else {
                setErrorMessage(captureData.message || captureData.error || 'PayPal support verification failed.');
                setViewState('FAILED');
              }
            } catch (err: any) {
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
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [paymentMethod, viewState]);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (paymentMethod === 'paypal') {
      // Handled via PayPal smart buttons
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!activeAmount || activeAmount < 1) {
      setErrorMessage('Please select or enter an amount of at least ₹1.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Call dedicated support order creation endpoint
      const res = await fetch('/api/support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
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
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }

      const keyToUse = razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G';

      // 3. Open Razorpay Checkout Modal
      if (typeof (window as any).Razorpay !== 'undefined') {
        const options = {
          key: keyToUse,
          amount: Math.round(validatedAmount * 100),
          currency: 'INR',
          name: 'Omove Store',
          description: `Buy Me a Coffee from ${trimmedName}`,
          order_id: (razorpayOrderId && razorpayOrderId.startsWith('order_')) ? razorpayOrderId : undefined,
          prefill: {
            name: trimmedName,
            email: trimmedEmail
          },
          theme: { color: '#059669' },
          handler: async function (response: any) {
            setIsSubmitting(true);
            try {
              // 4. Verify payment on server
              const verifyRes = await fetch('/api/support/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  supportId,
                  name: trimmedName,
                  email: trimmedEmail,
                  amount: validatedAmount,
                  razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
                  razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpay_signature: response.razorpay_signature || ''
                })
              });

              const verifyData = await verifyRes.json().catch(() => ({}));
              if (verifyRes.ok && verifyData.success) {
                setCompletedPaymentDetails({
                  amount: validatedAmount,
                  paymentId: verifyData.razorpayPaymentId || response.razorpay_payment_id || 'PAYMENT_VERIFIED',
                  paymentMethod: 'Razorpay',
                  name: trimmedName,
                  email: trimmedEmail
                });
                setViewState('SUCCESS');
              } else {
                setErrorMessage(verifyData.message || 'Payment signature verification failed.');
                setViewState('FAILED');
              }
            } catch (err: any) {
              console.error('Payment verification error:', err);
              setErrorMessage(`Verification error: ${err.message}`);
              setViewState('FAILED');
            } finally {
              setIsSubmitting(false);
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
        throw new Error('Razorpay payment gateway SDK unavailable. Please check your network connection.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'Payment failed to initialize.');
      setIsSubmitting(false);
      setViewState('FAILED');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Decorative Element */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 font-mono text-xs font-bold transition-colors"
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
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl">
          {/* STATE 1: FORM */}
          {viewState === 'FORM' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
              {/* Heading Area */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                  <Coffee className="w-8 h-8" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                  Buy Me a Coffee
                </h1>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  If Omove Store helped you, you can buy me a coffee ☕
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSupportSubmit} className="space-y-6">
                {/* Preset Amount Grid */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                    CHOOSE YOUR COFFEE
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(amt);
                          setCustomAmount('');
                        }}
                        className={`py-3 rounded-2xl font-mono font-extrabold text-sm transition-all border cursor-pointer ${
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
                    className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all border mb-3 cursor-pointer ${
                      selectedPreset === 'custom'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:bg-slate-800/80'
                    }`}
                  >
                    Custom Amount
                  </button>

                  {selectedPreset === 'custom' && (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-emerald-500/50 rounded-2xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* Contributor Name */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    YOUR NAME <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Contributor Email */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    YOUR EMAIL <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Payment Method Cards */}
                {activeAmount > 0 && (
                  <div className="space-y-3 pt-2">
                    <PaymentMethodCards
                      paymentMethod={paymentMethod}
                      onSelectMethod={(m) => {
                        setPaymentMethod(m);
                        setPaypalReady(false);
                      }}
                      inrAmount={activeAmount}
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
                      <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs font-mono space-y-2 animate-fadeIn">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Contribution (Authoritative):</span>
                          <span className="text-white font-bold">₹{activeAmount} INR</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Conversion Rate:</span>
                          <span className="text-slate-300">₹95 = $1.00 USD</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Minimum PayPal Price:</span>
                          <span className="text-slate-300">$3.00 USD</span>
                        </div>
                        <div className="pt-2 border-t border-blue-500/20 flex justify-between items-center font-bold">
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
                  </div>
                )}

                {/* Razorpay Submit Button */}
                {paymentMethod === 'razorpay' && (
                  <div className="pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">COFFEE TOTAL:</span>
                      <span className="font-mono text-2xl font-black text-emerald-400">
                        ₹{activeAmount || 0}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !activeAmount || activeAmount < 1 || !name.trim()}
                      className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-mono font-extrabold text-sm tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>PROCESSING...</span>
                        </>
                      ) : (
                        <>
                          <Coffee className="w-5 h-5" />
                          <span>☕ Buy Me a Coffee (₹{activeAmount || 0})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>

              <div className="mt-6 text-center flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>
                  {paymentMethod === 'paypal'
                    ? 'PayPal Buyer Protection • 256-Bit SSL Encrypted'
                    : 'Secure payment powered by Razorpay (256-Bit SSL)'}
                </span>
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESS */}
          {viewState === 'SUCCESS' && completedPaymentDetails && (
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
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

              <a
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-sm tracking-wider shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.01]"
              >
                <span>BACK TO OMOVE STORE</span>
              </a>
            </div>
          )}

          {/* STATE 3: FAILED */}
          {viewState === 'FAILED' && (
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center mx-auto mb-6 text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                Payment was not completed.
              </h2>

              <p className="text-slate-400 text-xs mb-8">
                {errorMessage || 'The payment was cancelled or could not be completed.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setViewState('FORM');
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all cursor-pointer"
                >
                  TRY AGAIN
                </button>

                <a
                  href="/"
                  className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs tracking-wider border border-slate-700 transition-all flex items-center justify-center"
                >
                  BACK TO OMOVE STORE
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950 py-4 px-4 text-center font-mono text-[11px] text-slate-600">
        Omove Store • Buy Me a Coffee
      </footer>
    </div>
  );
};
