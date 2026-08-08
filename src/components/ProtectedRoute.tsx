import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isLoggedIn = false,
  onOpenAuthModal = () => {}
}) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isLoggedIn);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' }
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data && data.authenticated) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
          setIsVerifying(false);
        }
      })
      .catch((err) => {
        console.warn('Auth verification note:', err);
        if (isMounted) {
          setIsAuthenticated(false);
          setIsVerifying(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, isLoggedIn]);

  if (isVerifying) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 animate-pulse">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-200/80 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200/80 rounded-xl mx-auto"></div>
          <div className="h-4 w-64 bg-slate-200/60 rounded-xl mx-auto"></div>
        </div>
      </div>
    );
  }

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
              Access your orders, digital products, software license keys, downloads, and customer support.
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
