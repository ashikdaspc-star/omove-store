import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useAdminToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useAdminToast must be used within an AdminToastProvider');
  }
  return ctx;
};

export const AdminToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const item: ToastItem = { id, type, title, message, duration };
      setToasts((prev) => [...prev.slice(-4), item]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', title, message, duration: 6000 }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', title, message }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', title, message, duration: 5000 }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-3 transition-all animate-fadeIn ${
                isSuccess
                  ? 'bg-slate-900/95 text-slate-100 border-emerald-500/40 shadow-emerald-950/40'
                  : isError
                  ? 'bg-slate-900/95 text-slate-100 border-rose-500/40 shadow-rose-950/40'
                  : isWarning
                  ? 'bg-slate-900/95 text-slate-100 border-amber-500/40 shadow-amber-950/40'
                  : 'bg-slate-900/95 text-slate-100 border-slate-700/60 shadow-slate-950/40'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isError && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-blue-400" />}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && <h5 className="text-xs font-bold font-sans text-white mb-0.5">{t.title}</h5>}
                <p className="text-xs text-slate-300 font-sans leading-relaxed">{t.message}</p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
