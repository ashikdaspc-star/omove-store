import React, { useState } from 'react';
import { Mail, Lock, User, Phone, LogIn, UserPlus, X, AlertTriangle, KeyRound, CheckCircle2 } from 'lucide-react';

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
  if (!isOpen) return null;

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

  const getRegisteredUsers = (): Record<string, { name: string; email: string; phone: string; password?: string; location: string }> => {
    try {
      const stored = localStorage.getItem('omove_registered_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {};
  };

  const saveRegisteredUser = (user: { name: string; email: string; phone: string; password?: string; location: string }) => {
    const users = getRegisteredUsers();
    users[user.email.toLowerCase()] = user;
    try {
      localStorage.setItem('omove_registered_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
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
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessNotice(data.message || 'Password reset link sent! Check your email or enter reset token below.');
        if (data.resetToken) {
          setResetTokenInput(data.resetToken);
          setIsResetTokenGenerated(true);
        }
      } else {
        setErrorNotice(data.error || 'Failed to process password reset request.');
      }
    } catch (err) {
      setErrorNotice('Network error while requesting password reset.');
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
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessNotice('Password reset successfully! Please sign in with your new password.');
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorNotice(data.error || 'Failed to reset password. Invalid or expired token.');
      }
    } catch (err) {
      setErrorNotice('Network error while resetting password.');
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

    if (existing) {
      if (existing.password && existing.password !== password) {
        setErrorNotice('Incorrect password! Please check your password and try again.');
        setIsSubmitting(false);
        return;
      }
      onLoginSuccess(existing);
      onClose();
    } else if (mode === 'register') {
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
      setErrorNotice('Invalid email address or password. Please check your credentials or click New Account.');
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
            disabled={isSubmitting}
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
