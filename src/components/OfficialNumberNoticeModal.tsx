import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Sparkles 
} from 'lucide-react';
import { CONTACT_CONFIG } from '../config/contactConfig';

// Authentic Official WhatsApp SVG Icon
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TOTAL_DURATION_MS = 5000;
const TICK_INTERVAL_MS = 50;

export const OfficialNumberNoticeModal: React.FC = () => {
  // Always open on page visit/reload for 5 seconds
  const [isOpen, setIsOpen] = useState(true);
  const [remainingMs, setRemainingMs] = useState(TOTAL_DURATION_MS);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  const oldNumber = '+91 8345968169';
  const newNumber = CONTACT_CONFIG.whatsapp.display; // '+91 9242899827'

  // 5-second countdown timer
  useEffect(() => {
    if (!isOpen || isPaused) return;

    timerRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= TICK_INTERVAL_MS) {
          clearInterval(timerRef.current);
          setIsOpen(false);
          return 0;
        }
        return prev - TICK_INTERVAL_MS;
      });
    }, TICK_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / TOTAL_DURATION_MS) * 100));

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Official Number Update"
    >
      {/* Click outside backdrop handler */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* 16:9 Widescreen Proportion Clean Card */}
      <div 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full max-w-[560px] bg-white border border-emerald-300/90 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-900 z-10 flex flex-col justify-between"
      >
        {/* Subtle Brand Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-100/70 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Content */}
        <div className="p-6 sm:p-7 space-y-4 relative">
          
          {/* Top Bar: Badge & Close Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official Omove Store Update</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Heading & Concise Subtitle */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Official Number Updated
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Please save our new contact for WhatsApp &amp; customer support.
            </p>
          </div>

          {/* Number Switch Strip: Old -> New */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            
            {/* Old Number (Low-opacity Red) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-600/75 border border-rose-500/20">
                Old
              </span>
              <span className="font-mono font-bold text-sm sm:text-base line-through whitespace-nowrap text-rose-500/60 decoration-rose-500/50">
                {oldNumber}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 hidden sm:block" />

            {/* New Official Number */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-emerald-400 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-200" />
                <span>New</span>
              </span>
              <span className="font-mono font-black text-base sm:text-lg text-emerald-950 whitespace-nowrap">
                {newNumber}
              </span>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={CONTACT_CONFIG.whatsapp.getLink('Hello Omove Store, I am contacting you on your new official number.')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-98 cursor-pointer whitespace-nowrap"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
              <span>Chat on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Got It ({secondsLeft}s)</span>
            </button>
          </div>

        </div>

        {/* 5-Second Animated Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-75 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

      </div>
    </div>
  );
};
