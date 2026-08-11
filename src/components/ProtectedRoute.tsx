import React from 'react';
import { Lock, LogIn, UserPlus } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
}

/**
 * ProtectedRoute — Single Source of Truth Guard
 *
 * This component trusts the parent App.tsx `isLoggedIn` prop as the
 * SINGLE authoritative authentication state. It does NOT run its own
 * independent `/api/auth/me` fetch, which previously caused a race
 * condition where the Header showed logged-in but ProtectedRoute
 * showed "Authentication Required".
 *
 * Auth verification flow:
 *   1. App.tsx initializes `isLoggedIn` from localStorage('omove_active_session')
 *   2. App.tsx runs `/api/auth/me` on mount to verify/refresh
 *   3. App.tsx passes `isLoggedIn` prop to both Header and ProtectedRoute
 *   4. ProtectedRoute simply renders children or auth-required screen
 *
 * This eliminates the dual-state desync that caused the bug.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isLoggedIn = false,
  onOpenAuthModal = () => {}
}) => {
  // Single source of truth: the isLoggedIn prop from App.tsx
  // Also check localStorage as a synchronous fallback for direct URL navigation
  // where App.tsx state may not have propagated yet
  const hasLocalSession = (() => {
    try {
      return Boolean(localStorage.getItem('omove_active_session'));
    } catch {
      return false;
    }
  })();

  const isAuthenticated = isLoggedIn || hasLocalSession;

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8 font-sans">
        {/* Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-md">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
              AUTHENTICATION REQUIRED
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in to your Omove Store account
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Access your orders, digital products, Google Drive downloads, and customer support.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuthModal()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <LogIn className="w-4 h-4" />
              <span>SIGN IN TO ACCOUNT</span>
            </button>

            <button
              onClick={() => onOpenAuthModal()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4 text-slate-500" />
              <span>CREATE NEW ACCOUNT</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};






