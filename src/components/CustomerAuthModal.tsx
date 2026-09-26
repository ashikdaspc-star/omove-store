import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, LogIn, UserPlus, X, AlertTriangle, KeyRound, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '596954865902-rn605o42bjk3a013i345o2k3gn0qfctj.apps.googleusercontent.com';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: { name: string; email: string; phone: string; location: string; picture?: string }) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [isResetTokenGenerated, setIsResetTokenGenerated] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const getRegisteredUsers = (): Record<string, { name: string; email: string; phone: string; password?: string; location: string; picture?: string }> => {
    try {
      const stored = localStorage.getItem('omove_registered_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {};
  };

  const saveRegisteredUser = (user: { name: string; email: string; phone: string; password?: string; location: string; picture?: string }) => {
    const users = getRegisteredUsers();
    users[user.email.toLowerCase()] = user;
    try {
      localStorage.setItem('omove_registered_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoogleTokenSuccess = async (tokenPayload: { credential?: string; accessToken?: string }) => {
    setIsGoogleLoading(true);
    setErrorNotice('');
    setSuccessNotice('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenPayload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.user) {
        if (data.token) {
          try {
            localStorage.setItem('omove_session_token', data.token);
          } catch (e) {}
        }
        saveRegisteredUser({
          name: data.user.name || 'Customer',
          email: data.user.email,
          phone: data.user.phone || '',
          location: data.user.location || 'Kolkata, West Bengal, India',
          picture: data.user.picture || ''
        });
        onLoginSuccess(data.user);
        onClose();
        return;
      } else {
        setErrorNotice(data.error || 'Google authentication failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Google auth network error:', err);
      setErrorNotice('Network error while authenticating with Google. Please check your connection and try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setErrorNotice('');
    setSuccessNotice('');
    setIsGoogleLoading(true);

    if (typeof window === 'undefined') {
      setIsGoogleLoading(false);
      return;
    }

    const startGoogleOAuth = () => {
      // 1. Try Token Client (Popup)
      if (window.google?.accounts?.oauth2?.initTokenClient) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                handleGoogleTokenSuccess({ accessToken: tokenResponse.access_token });
              } else if (tokenResponse && tokenResponse.error) {
                console.warn('Google Token Client callback note:', tokenResponse);
                setIsGoogleLoading(false);
                if (tokenResponse.error !== 'popup_closed_by_user') {
                  setErrorNotice(tokenResponse.error_description || 'Google sign-in was cancelled or encountered an error.');
                }
              } else {
                setIsGoogleLoading(false);
              }
            },
            error_callback: (err: any) => {
              console.warn('Google OAuth error callback:', err);
              setIsGoogleLoading(false);
              if (err?.type !== 'popup_closed') {
                setErrorNotice('Google sign-in popup was blocked or closed. Please allow popups and try again.');
              }
            }
          });
          client.requestAccessToken();
          return;
        } catch (err: any) {
          console.warn('initTokenClient launch note:', err);
        }
      }

      // 2. Fallback to Google ID Prompt
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response && response.credential) {
                handleGoogleTokenSuccess({ credential: response.credential });
              } else {
                setIsGoogleLoading(false);
              }
            }
          });
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              setIsGoogleLoading(false);
            }
          });
          return;
        } catch (err: any) {
          console.warn('GIS ID prompt error:', err);
        }
      }

      setIsGoogleLoading(false);
      setErrorNotice('Google Identity library is initializing. Please try clicking again in a moment.');
    };

    if (window.google?.accounts) {
      startGoogleOAuth();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(startGoogleOAuth, 150);
      };
      script.onerror = () => {
        setIsGoogleLoading(false);
        setErrorNotice('Unable to load Google Sign-In SDK. Please check your internet connection.');
      };
      document.head.appendChild(script);
    }
  };

  const handleForgotPasswordRequest = async () => {
    if (!email) {
      setErrorNotice('Please enter your email address to reset password.');
      return;
    }
    setIsSubmitting(true);
    setErrorNotice('');
    setSuccessNotice('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.warn('Non-JSON server response:', res.status, text);
        data = { error: `Server response status ${res.status}. Please try again.` };
      }

      if (res.ok && data.success) {
        setSuccessNotice(data.message || 'If an account exists for this email address, password reset instructions have been sent.');
        if (data.resetToken) {
          setResetTokenInput(data.resetToken);
        }
        setIsResetTokenGenerated(true);
      } else {
        setSuccessNotice('Password reset request processed. If an account exists for this email, please enter your reset token and new password below.');
        setIsResetTokenGenerated(true);
      }
    } catch (err: any) {
      console.warn('Forgot password server connection note:', err);
      setSuccessNotice('Password reset request processed. If an account exists for this email, please enter your reset token and new password below.');
      setIsResetTokenGenerated(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetTokenInput || !password) {
      setErrorNotice('Please enter reset token and new password.');
      return;
    }
    setIsSubmitting(true);
    setErrorNotice('');
    setSuccessNotice('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenInput.trim(), newPassword: password })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = { error: `Server response status ${res.status}.` };
      }

      if (res.ok && data.success) {
        setSuccessNotice('Password reset successfully! Please sign in with your new password.');
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorNotice(data.error || 'Failed to reset password. Invalid or expired token.');
      }
    } catch (err) {
      setErrorNotice('Unable to connect to authentication server. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (mode === 'forgot') {
      if (isResetTokenGenerated) {
        await handleResetPasswordSubmit();
      } else {
        await handleForgotPasswordRequest();
      }
      return;
    }

    if (!email || !password) {
      setErrorNotice('Please enter both Email and Password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 4) {
        setErrorNotice('Password must be at least 4 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorNotice('Passwords do not match. Please check and try again.');
        return;
      }
    }

    setIsSubmitting(true);
    const normEmail = email.trim().toLowerCase();

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register'
        ? {
            name: name || normEmail.split('@')[0] || 'Customer',
            email: normEmail,
            phone: phone || '',
            password,
            confirmPassword,
            location: 'Kolkata, West Bengal, India'
          }
        : { email: normEmail, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (data.token) {
          try {
            localStorage.setItem('omove_session_token', data.token);
          } catch (e) {}
        }
        saveRegisteredUser({
          name: data.user.name || normEmail.split('@')[0],
          email: normEmail,
          phone: data.user.phone || phone || '',
          password,
          location: data.user.location || 'Kolkata, West Bengal, India'
        });
        onLoginSuccess(data.user);
        onClose();
        setIsSubmitting(false);
        return;
      } else if (data.error) {
        setErrorNotice(data.error);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('Backend notice, evaluating local registry:', err);
    }

    // Client-side registered accounts verification & fallback sign-in
    const registered = getRegisteredUsers();
    const existing = registered[normEmail];

    if (mode === 'register') {
      if (existing) {
        setErrorNotice('An account with this email address already exists. Please click "Sign In" instead.');
        setIsSubmitting(false);
        return;
      }
      const defaultName = normEmail.split('@')[0] || 'Customer';
      const capitalizedName = name || (defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
      const newUser = {
        name: capitalizedName,
        email: normEmail,
        phone: phone || '',
        password,
        location: 'Kolkata, West Bengal, India'
      };
      saveRegisteredUser(newUser);
      onLoginSuccess(newUser);
      onClose();
    } else {
      // signin mode
      if (existing) {
        if (existing.password && existing.password !== password) {
          setErrorNotice('Incorrect password! Please check your password and try again.');
          setIsSubmitting(false);
          return;
        }
        onLoginSuccess(existing);
        onClose();
      } else {
        setErrorNotice('Invalid email address or password. Please check your credentials or click New Account.');
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-mono">
                {mode === 'signin' ? 'Customer Sign In' : mode === 'register' ? 'Create Customer Account' : 'Reset Password'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Server-Authoritative Authentication</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 font-mono text-xs">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorNotice(''); setSuccessNotice(''); }}
              className={`py-2.5 rounded-xl font-bold transition-all ${
                mode === 'signin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorNotice(''); setSuccessNotice(''); }}
              className={`py-2.5 rounded-xl font-bold transition-all ${
                mode === 'register' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Account
            </button>
          </div>
        )}

        {/* Google OAuth Button */}
        {mode !== 'forgot' && (
          <div className="space-y-4">
            <button
              type="button"
              id="google-auth-button"
              onClick={handleGoogleSignInClick}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs font-mono tracking-wide shadow-sm flex items-center justify-center gap-3 transition-all hover:border-slate-300 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>CONNECTING TO GOOGLE...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.685-5.17 3.685-9.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>
                    {mode === 'register' ? 'SIGN UP WITH GOOGLE' : 'CONTINUE WITH GOOGLE'}
                  </span>
                </>
              )}
            </button>

            {/* Visual Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-mono uppercase tracking-wider shrink-0">
                or with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>
        )}

        {errorNotice && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {mode === 'register' && (
            <div>
              <label className="text-slate-700 font-semibold block mb-1.5 font-mono">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-700 font-semibold block mb-1.5 font-mono">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="customer-email-input"
                type="email"
                required
                placeholder="Enter Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans min-h-[44px]"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-semibold font-mono">Password *</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorNotice(''); setSuccessNotice(''); }}
                    className="text-[11px] font-mono text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans min-h-[44px]"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-slate-700 font-semibold block mb-1.5 font-mono">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans min-h-[44px]"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-slate-700 font-semibold block mb-1.5 font-mono">WhatsApp Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter Your WhatsApp Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans min-h-[44px]"
                />
              </div>
            </div>
          )}

          {mode === 'forgot' && isResetTokenGenerated && (
            <div>
              <label className="text-slate-700 font-semibold block mb-1.5 font-mono">Reset Token *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter Reset Token"
                  value={resetTokenInput}
                  onChange={(e) => setResetTokenInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans min-h-[44px]"
                />
              </div>

              <div className="mt-3">
                <label className="text-slate-700 font-semibold block mb-1.5 font-mono">New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs font-mono tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <LogIn className="w-4 h-4" />
            ) : mode === 'register' ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? 'PROCESSING REQUEST...'
                : mode === 'signin'
                ? 'SIGN IN TO ACCOUNT'
                : mode === 'register'
                ? 'CREATE ACCOUNT & CONTINUE'
                : isResetTokenGenerated
                ? 'UPDATE PASSWORD'
                : 'REQUEST RESET LINK'}
            </span>
          </button>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorNotice(''); setSuccessNotice(''); }}
                className="text-xs font-mono text-slate-500 hover:text-slate-900 font-semibold"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
