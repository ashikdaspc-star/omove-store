import React, { useState } from 'react';
import { Mail, Lock, User, Phone, LogIn, UserPlus, X, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: { name: string; email: string; phone: string; location: string }) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRegisteredUsers = (): Record<string, { name: string; email: string; phone: string; password: string; location: string }> => {
    try {
      const stored = localStorage.getItem('omove_registered_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      'omovetech@gmail.com': {
        name: 'Ashik Das',
        email: 'omovetech@gmail.com',
        phone: '+91 8345968169',
        password: 'omove2026',
        location: 'Kolkata, West Bengal, India'
      }
    };
  };

  const saveRegisteredUser = (user: { name: string; email: string; phone: string; password: string; location: string }) => {
    const users = getRegisteredUsers();
    users[user.email.toLowerCase()] = user;
    try {
      localStorage.setItem('omove_registered_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');

    if (!email || !password) {
      setErrorNotice('Please enter both Email and Password.');
      return;
    }

    if (password.length < 4) {
      setErrorNotice('Password must be at least 4 characters long.');
      return;
    }

    setIsSubmitting(true);
    const normEmail = email.trim().toLowerCase();

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register'
        ? { name: name || 'Customer', email: normEmail, phone: phone || '+91 8345968169', password, location: 'Kolkata, West Bengal, India' }
        : { email: normEmail, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (mode === 'register') {
          saveRegisteredUser({ name: name || 'Customer', email: normEmail, phone: phone || '+91 8345968169', password, location: 'Kolkata, West Bengal, India' });
        }
        onLoginSuccess(data.user);
        onClose();
        setIsSubmitting(false);
        return;
      } else if (data && data.error) {
        setErrorNotice(data.error);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('Backend notice, evaluating local registry:', err);
    }

    // Client-side registered accounts verification fallback
    const registered = getRegisteredUsers();
    const existing = registered[normEmail];

    if (mode === 'register') {
      if (existing) {
        setErrorNotice('An account with this email already exists! Please click "Sign In" instead.');
      } else {
        const newUser = {
          name: name || 'Customer',
          email: normEmail,
          phone: phone || '+91 8345968169',
          password,
          location: 'Kolkata, West Bengal, India'
        };
        saveRegisteredUser(newUser);
        onLoginSuccess(newUser);
        onClose();
      }
    } else {
      // Sign In mode
      if (!existing) {
        setErrorNotice('Account not found! You must click "New Account" to register first.');
      } else if (existing.password !== password) {
        setErrorNotice('Incorrect password! Please check your password and try again.');
      } else {
        onLoginSuccess(existing);
        onClose();
      }
    }

    setIsSubmitting(false);
  };

  const handleQuickDemoLogin = async () => {
    const defaultUser = {
      name: 'Ashik Das',
      email: 'omovetech@gmail.com',
      phone: '+91 8345968169',
      location: 'Kolkata, West Bengal, India'
    };
    saveRegisteredUser({ ...defaultUser, password: 'omove2026' });
    onLoginSuccess(defaultUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-mono">
                {mode === 'signin' ? 'Customer Sign In' : 'Create Customer Account'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Email & Password Auth (Instant Access)</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorNotice(''); }}
            className={`py-2 rounded-xl font-bold transition-all ${
              mode === 'signin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorNotice(''); }}
            className={`py-2 rounded-xl font-bold transition-all ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            New Account
          </button>
        </div>

        {errorNotice && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            {errorNotice}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {mode === 'register' && (
            <div>
              <label className="text-slate-300 block mb-1 font-bold">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ashik Das"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-300 block mb-1 font-bold">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="customer@omove.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-bold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-slate-300 block mb-1 font-bold">WhatsApp Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="+91 8345968169"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? 'VERIFYING CREDENTIALS...'
                : mode === 'signin'
                ? 'SIGN IN TO ACCOUNT'
                : 'CREATE ACCOUNT & CONTINUE'}
            </span>
          </button>
        </form>

        {/* 1-Click Quick Demo Sign-In */}
        <div className="pt-3 border-t border-slate-800 space-y-2 text-center">
          <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Or 1-Click Quick Login</span>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>INSTANT SIGN IN AS ASHIK DAS (omovetech@gmail.com)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
