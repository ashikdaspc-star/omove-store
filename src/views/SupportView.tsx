import React, { useState } from 'react';
import { Heart, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

const PRESET_AMOUNTS = [10, 25, 50, 100];

export const SupportView: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View States: 'FORM' | 'SUCCESS' | 'FAILED'
  const [viewState, setViewState] = useState<'FORM' | 'SUCCESS' | 'FAILED'>('FORM');
  const [completedPaymentDetails, setCompletedPaymentDetails] = useState<{
    amount: number;
    paymentId: string;
    name: string;
    email: string;
  } | null>(null);

  const activeAmount = selectedPreset === 'custom'
    ? Math.max(0, parseInt(customAmount, 10) || 0)
    : selectedPreset;

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
      setErrorMessage('Please select or enter a contribution amount of at least ₹1.');
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
        throw new Error(data.message || data.error || 'Failed to create support transaction');
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
          name: 'Omove Store Support',
          description: `Voluntary Support Contribution from ${trimmedName}`,
          order_id: razorpayOrderId.startsWith('rzp_') ? razorpayOrderId : undefined,
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
                  name: trimmedName,
                  email: trimmedEmail
                });
                setViewState('SUCCESS');
              } else {
                setErrorMessage(verifyData.message || 'Payment signature verification failed.');
                setViewState('FAILED');
              }
            } catch (err: any) {
              console.error('Support payment verification error:', err);
              setErrorMessage(`Verification error: ${err.message}`);
              setViewState('FAILED');
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              setErrorMessage('Payment was not completed.');
              setViewState('FAILED');

              // Notify backend to record FAILED status and send FAILED email notifications
              fetch('/api/support/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  supportId,
                  cancelled: true,
                  name: trimmedName,
                  email: trimmedEmail,
                  amount: validatedAmount,
                  razorpay_order_id: razorpayOrderId
                })
              }).catch(() => {});
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay payment gateway SDK unavailable. Please check your network connection.');
      }
    } catch (err: any) {
      console.error('Support payment error:', err);
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
            <span className="font-mono text-xs font-bold tracking-widest text-slate-300">OFFICIAL SUPPORT</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl">
          {/* STATE 1: FORM */}
          {viewState === 'FORM' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                  <Heart className="w-8 h-8 fill-emerald-500/20" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                  Support Omove Store
                </h1>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  If you find Omove Store useful, you can support us by making a small contribution.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSupportSubmit} className="space-y-6">
                {/* Preset Amount Grid */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Select Contribution Amount
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
                        className={`py-3 rounded-2xl font-mono font-extrabold text-sm transition-all border ${
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
                    className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all border mb-3 ${
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
                    Your Name <span className="text-emerald-400">*</span>
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
                    Your Email <span className="text-emerald-400">*</span>
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

                {/* Amount Display & Action Button */}
                <div className="pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Support Amount:</span>
                    <span className="font-mono text-2xl font-black text-emerald-400">
                      ₹{activeAmount || 0}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !activeAmount || activeAmount < 1 || !name.trim()}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-mono font-extrabold text-sm tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>PROCESSING...</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 fill-slate-950" />
                        <span>SUPPORT Omove Store</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Secure payment powered by Razorpay (256-Bit SSL)</span>
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
                Your support helps Omove Store continue growing.
              </p>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 mb-8 text-left space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs text-slate-400">Contributor:</span>
                  <span className="text-sm font-bold text-white">{completedPaymentDetails.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs text-slate-400">Support Amount:</span>
                  <span className="text-base font-black text-emerald-400">₹{completedPaymentDetails.amount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Payment ID:</span>
                  <span className="text-xs font-bold text-slate-300 select-all">{completedPaymentDetails.paymentId}</span>
                </div>
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
                {errorMessage || 'The contribution transaction was cancelled or could not be verified.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setViewState('FORM');
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all"
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
        Omove Store • Direct Contribution Platform
      </footer>
    </div>
  );
};
