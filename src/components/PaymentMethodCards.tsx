import React from 'react';
import { ShieldCheck } from 'lucide-react';

// Custom Razorpay SVG Logo / Icon
export const RazorpayIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.28 2.05L7.05 13.52h5.12L8.72 21.95l10.4-12.02h-5.46l3.62-7.88h-3z"
      fill="url(#rzp-shared-grad)"
    />
    <defs>
      <linearGradient id="rzp-shared-grad" x1="7" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
    </defs>
  </svg>
);

// Custom PayPal SVG Logo / Icon
export const PaypalIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.802.802 0 0 1 .792-.67h6.634c2.81 0 4.885.666 5.845 1.877.944 1.192.983 2.872.115 5.002-1.077 2.645-3.084 4.095-5.965 4.31l-.226.012-.665 4.22-.054.34a.641.641 0 0 1-.633.526H7.076z"
      fill="#0079C1"
    />
    <path
      d="M8.765 17.575l1.04-6.597.185-.013c2.518-.187 4.272-1.455 5.216-3.768.761-1.867.728-3.339-.098-4.382-.843-1.062-2.658-1.646-5.118-1.646H5.736a.802.802 0 0 0-.792.67L2.47 20.597a.641.641 0 0 0 .633.74h4.606l1.056-3.762z"
      fill="#00457C"
      opacity="0.9"
    />
    <path
      d="M17.485 8.929c-.87 2.13-2.876 3.58-5.757 3.795l-.226.012-.86 5.464a.641.641 0 0 1-.633.526h-3.47l-.248 1.57a.641.641 0 0 0 .633.741h3.94a.802.802 0 0 0 .792-.67l.033-.175.748-4.743.048-.262a.802.802 0 0 1 .792-.67h.499c2.81 0 5.01-.987 5.953-3.303.785-1.928.618-3.568-.49-4.285z"
      fill="#0079C1"
    />
    <path
      d="M16.33 8.243c-.234 1.597-1.326 2.766-3.084 3.013l-.24.034-.666 4.22-.054.34a.641.641 0 0 1-.633.526H9.155l1.45-9.208.106-.015c2.195-.164 3.728-1.27 4.553-3.29.67-1.644.64-2.94-.086-3.856a3.54 3.54 0 0 0-1.57-.96 5.688 5.688 0 0 1 2.722 9.206z"
      fill="#002C6C"
      opacity="0.3"
    />
  </svg>
);

interface PaymentMethodCardsProps {
  paymentMethod: 'razorpay' | 'paypal';
  onSelectMethod: (method: 'razorpay' | 'paypal') => void;
  inrAmount: number;
  usdAmountDisplay: string;
  razorpayTitle?: string;
  razorpaySubtitle?: string;
  razorpayTagline?: string;
  paypalTitle?: string;
  paypalSubtitle?: string;
  paypalTagline?: string;
  themeAccent?: 'cyan' | 'emerald';
}

export const PaymentMethodCards: React.FC<PaymentMethodCardsProps> = ({
  paymentMethod,
  onSelectMethod,
  inrAmount,
  usdAmountDisplay,
  razorpayTitle = 'RAZORPAY',
  razorpaySubtitle = 'UPI / Card / NetBanking',
  razorpayTagline = 'Secure Payment • Instant Processing • Trusted',
  paypalTitle = 'PAYPAL',
  paypalSubtitle = 'International Checkout',
  paypalTagline = 'Secure Checkout • USD Payment',
  themeAccent = 'cyan'
}) => {
  const isEmerald = themeAccent === 'emerald';

  const rzpSelectedStyles = isEmerald
    ? 'border-emerald-400/90 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/60'
    : 'border-cyan-400/90 bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-950 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/60';

  const rzpBadgeStyles = isEmerald
    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/30'
    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/30';

  const rzpSubtextStyles = isEmerald ? 'text-emerald-400' : 'text-cyan-400';
  const rzpRadioStyles = isEmerald ? 'border-emerald-400 bg-emerald-950' : 'border-cyan-400 bg-cyan-950';
  const rzpRadioDotStyles = isEmerald ? 'bg-emerald-400 shadow-emerald-400' : 'bg-cyan-400 shadow-cyan-400';
  const rzpPriceStyles = isEmerald ? 'text-emerald-400' : 'text-cyan-400';

  return (
    <div className="space-y-2.5 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-bold block">
          PAYMENT METHOD
        </span>
        <span className={`text-[10px] font-mono flex items-center gap-1 ${isEmerald ? 'text-emerald-400' : 'text-cyan-400'}`}>
          <ShieldCheck className="w-3 h-3" />
          <span>Encrypted & Verified</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* RAZORPAY CARD */}
        <button
          type="button"
          onClick={() => onSelectMethod('razorpay')}
          className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group ${
            paymentMethod === 'razorpay'
              ? rzpSelectedStyles
              : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                paymentMethod === 'razorpay'
                  ? rzpBadgeStyles
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
              }`}>
                <RazorpayIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white tracking-wide">{razorpayTitle}</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold block ${rzpSubtextStyles}`}>
                  {razorpaySubtitle}
                </span>
              </div>
            </div>

            {/* Radio Indicator */}
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              paymentMethod === 'razorpay' ? rzpRadioStyles : 'border-slate-600 bg-slate-900'
            }`}>
              {paymentMethod === 'razorpay' && (
                <div className={`w-2 h-2 rounded-full shadow-sm ${rzpRadioDotStyles}`} />
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-end justify-between">
            <div className="text-[10px] text-slate-400 font-mono leading-tight pr-2">
              <span>{razorpayTagline}</span>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-mono text-sm font-black ${rzpPriceStyles}`}>
                ₹{inrAmount.toFixed ? inrAmount.toFixed(2) : inrAmount}
              </span>
            </div>
          </div>
        </button>

        {/* PAYPAL CARD */}
        <button
          type="button"
          onClick={() => onSelectMethod('paypal')}
          className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group ${
            paymentMethod === 'paypal'
              ? 'border-blue-400/90 bg-gradient-to-br from-blue-950/50 via-slate-900 to-slate-950 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/60'
              : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                paymentMethod === 'paypal'
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-sm shadow-blue-500/30'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
              }`}>
                <PaypalIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white tracking-wide">{paypalTitle}</span>
                </div>
                <span className="text-[10px] text-blue-400 font-mono font-semibold block">
                  {paypalSubtitle}
                </span>
              </div>
            </div>

            {/* Radio Indicator */}
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              paymentMethod === 'paypal' ? 'border-blue-400 bg-blue-950' : 'border-slate-600 bg-slate-900'
            }`}>
              {paymentMethod === 'paypal' && (
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400" />
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-end justify-between">
            <div className="text-[10px] text-slate-400 font-mono leading-tight pr-2">
              <span>{paypalTagline}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-blue-400 text-sm font-black">
                ${usdAmountDisplay} USD
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
