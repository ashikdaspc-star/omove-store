import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

// Authentic Official Razorpay SVG Logo / Brand Icon
export const RazorpayIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M394.5 45.5L165.8 214.2L101.4 329.8L211.2 258L379.8 147.9L307.5 466.5H437.8L512 45.5H394.5Z"
      fill="#0C2340"
    />
    <path
      d="M226.7 282.6L204 413.5L313.5 341.7L336.2 210.8L226.7 282.6Z"
      fill="#00B9FF"
    />
    <path
      d="M0 466.5H130.3L202.6 147.9L34 258L0 466.5Z"
      fill="#0284C7"
    />
    <path
      d="M130.3 466.5H260.6L332.9 147.9L164.3 258L130.3 466.5Z"
      fill="#3395FF"
    />
  </svg>
);

// Authentic Official PayPal SVG Logo / Brand Icon
export const PaypalIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.802.802 0 0 1 .792-.67h6.634c2.81 0 4.885.666 5.845 1.877.944 1.192.983 2.872.115 5.002-1.077 2.645-3.084 4.095-5.965 4.31l-.226.012-.665 4.22-.054.34a.641.641 0 0 1-.633.526H7.076z"
      fill="#0079C1"
    />
    <path
      d="M8.765 17.575l1.04-6.597.185-.013c2.518-.187 4.272-1.455 5.216-3.768.761-1.867.728-3.339-.098-4.382-.843-1.062-2.658-1.646-5.118-1.646H5.736a.802.802 0 0 0-.792.67L2.47 20.597a.641.641 0 0 0 .633.74h4.606l1.056-3.762z"
      fill="#00457C"
      opacity="0.95"
    />
    <path
      d="M17.485 8.929c-.87 2.13-2.876 3.58-5.757 3.795l-.226.012-.86 5.464a.641.641 0 0 1-.633.526h-3.47l-.248 1.57a.641.641 0 0 0 .633.741h3.94a.802.802 0 0 0 .792-.67l.033-.175.748-4.743.048-.262a.802.802 0 0 1 .792-.67h.499c2.81 0 5.01-.987 5.953-3.303.785-1.928.618-3.568-.49-4.285z"
      fill="#0079C1"
    />
    <path
      d="M16.33 8.243c-.234 1.597-1.326 2.766-3.084 3.013l-.24.034-.666 4.22-.054.34a.641.641 0 0 1-.633.526H9.155l1.45-9.208.106-.015c2.195-.164 3.728-1.27 4.553-3.29.67-1.644.64-2.94-.086-3.856a3.54 3.54 0 0 0-1.57-.96 5.688 5.688 0 0 1 2.722 9.206z"
      fill="#002C6C"
      opacity="0.35"
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
  variant?: 'light' | 'dark';
  layout?: 'grid' | 'stack';
}

export const PaymentMethodCards: React.FC<PaymentMethodCardsProps> = ({
  paymentMethod,
  onSelectMethod,
  inrAmount,
  usdAmountDisplay,
  razorpayTitle = 'RAZORPAY',
  razorpaySubtitle = 'UPI • Card • NetBanking',
  razorpayTagline = 'Instant Processing • 100% Secure',
  paypalTitle = 'PAYPAL',
  paypalSubtitle = 'International Checkout',
  paypalTagline = 'Pay securely in USD',
  themeAccent = 'emerald',
  variant = 'light',
  layout = 'grid'
}) => {
  const isEmerald = themeAccent === 'emerald';
  const isDark = variant === 'dark';
  const isStack = layout === 'stack';

  // --- DARK VARIANT STYLES ---
  const darkRzpSelected = isEmerald
    ? 'border-emerald-400 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/70 text-white scale-[1.01]'
    : 'border-cyan-400 bg-gradient-to-br from-cyan-950/70 via-slate-900 to-slate-950 shadow-xl shadow-cyan-500/25 ring-2 ring-cyan-400/70 text-white scale-[1.01]';

  const darkRzpUnselected = 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900/80 text-slate-300 hover:scale-[1.005]';
  const darkPaypalSelected = 'border-blue-400 bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-950 shadow-xl shadow-blue-500/25 ring-2 ring-blue-400/70 text-white scale-[1.01]';
  const darkPaypalUnselected = 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900/80 text-slate-300 hover:scale-[1.005]';

  // --- LIGHT VARIANT STYLES ---
  const lightRzpSelected = isEmerald
    ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 shadow-xl shadow-emerald-600/15 ring-2 ring-emerald-500/50 text-slate-900 scale-[1.01]'
    : 'border-cyan-600 bg-gradient-to-br from-cyan-50 via-white to-cyan-50/50 shadow-xl shadow-cyan-600/15 ring-2 ring-cyan-500/50 text-slate-900 scale-[1.01]';

  const lightRzpUnselected = 'border-slate-200/90 bg-white/90 hover:border-emerald-400 hover:bg-emerald-50/30 text-slate-800 hover:scale-[1.005] shadow-sm hover:shadow-md';
  const lightPaypalSelected = 'border-blue-600 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 shadow-xl shadow-blue-600/15 ring-2 ring-blue-500/50 text-slate-900 scale-[1.01]';
  const lightPaypalUnselected = 'border-slate-200/90 bg-white/90 hover:border-blue-400 hover:bg-blue-50/30 text-slate-800 hover:scale-[1.005] shadow-sm hover:shadow-md';

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className={`text-xs uppercase tracking-wider font-mono font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          SELECT PAYMENT METHOD
        </span>
        <span className={`text-[11px] font-mono flex items-center gap-1.5 font-bold ${isEmerald ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-cyan-400' : 'text-cyan-700')}`}>
          <ShieldCheck className="w-4 h-4" />
          <span>Encrypted & Verified</span>
        </span>
      </div>

      <div className={isStack ? 'flex flex-col gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-3.5'}>
        {/* RAZORPAY CARD */}
        <button
          type="button"
          onClick={() => onSelectMethod('razorpay')}
          className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group ${
            isDark
              ? (paymentMethod === 'razorpay' ? darkRzpSelected : darkRzpUnselected)
              : (paymentMethod === 'razorpay' ? lightRzpSelected : lightRzpUnselected)
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105 ${
                paymentMethod === 'razorpay'
                  ? (isDark ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-500/20' : 'bg-emerald-100/90 border-emerald-300 text-emerald-700 shadow-md shadow-emerald-500/10')
                  : (isDark ? 'bg-slate-900 border-slate-700/80 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600')
              }`}>
                <RazorpayIcon className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm sm:text-base tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {razorpayTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 font-mono tracking-wider">
                    POPULAR
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold block ${
                  isDark ? (isEmerald ? 'text-emerald-400' : 'text-cyan-400') : (isEmerald ? 'text-emerald-700' : 'text-cyan-700')
                }`}>
                  {razorpaySubtitle}
                </span>
              </div>
            </div>

            {/* Radio Indicator */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              paymentMethod === 'razorpay'
                ? (isDark ? 'border-emerald-400 bg-emerald-950' : 'border-emerald-600 bg-emerald-50')
                : (isDark ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white')
            }`}>
              {paymentMethod === 'razorpay' && (
                <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-emerald-600'}`} />
              )}
            </div>
          </div>

          <div className={`mt-3.5 pt-3 border-t flex items-end justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className={`text-[11px] font-mono leading-tight pr-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>{razorpayTagline}</span>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-mono text-base font-black ${
                isDark ? (isEmerald ? 'text-emerald-400' : 'text-cyan-400') : (isEmerald ? 'text-emerald-700' : 'text-cyan-700')
              }`}>
                ₹{inrAmount.toFixed ? inrAmount.toFixed(2) : inrAmount}
              </span>
            </div>
          </div>
        </button>

        {/* PAYPAL CARD */}
        <button
          type="button"
          onClick={() => onSelectMethod('paypal')}
          className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group ${
            isDark
              ? (paymentMethod === 'paypal' ? darkPaypalSelected : darkPaypalUnselected)
              : (paymentMethod === 'paypal' ? lightPaypalSelected : lightPaypalUnselected)
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105 ${
                paymentMethod === 'paypal'
                  ? (isDark ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-md shadow-blue-500/20' : 'bg-blue-100/90 border-blue-300 text-blue-700 shadow-md shadow-blue-500/10')
                  : (isDark ? 'bg-slate-900 border-slate-700/80 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600')
              }`}>
                <PaypalIcon className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm sm:text-base tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {paypalTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/15 text-rose-600 border border-rose-500/30 font-mono tracking-wider">
                    NOT REFUNDABLE
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold block ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  {paypalSubtitle}
                </span>
              </div>
            </div>

            {/* Radio Indicator */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              paymentMethod === 'paypal'
                ? (isDark ? 'border-blue-400 bg-blue-950' : 'border-blue-600 bg-blue-50')
                : (isDark ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white')
            }`}>
              {paymentMethod === 'paypal' && (
                <div className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-blue-400 shadow-sm shadow-blue-400' : 'bg-blue-600'}`} />
              )}
            </div>
          </div>

          <div className={`mt-3.5 pt-3 border-t flex items-end justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className={`text-[11px] font-mono leading-tight pr-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>{paypalTagline}</span>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-mono text-base font-black ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                ${usdAmountDisplay} USD
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
