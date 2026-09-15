import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminLoginPageProps {
  onSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim();
    if (trimmedUser === 'Ashik8611' && password === 'Ashik@1234') {
      onSuccess();
      setUsername('');
      setPassword('');
    } else {
      setErrorMessage('Access Denied: Invalid Administrator Credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Subtle Liquid Gradient Accent Backdrops */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl relative z-10 animate-fadeIn">
        {/* Header Branding */}
        <div className="text-center space-y-3 border-b border-slate-800/80 pb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AUTHENTICATED ACCESS ONLY</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
              Omove Control Center
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Enter Administrator credentials to unlock management portal
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs font-sans">
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 font-mono text-[11px]">
              ADMINISTRATOR ID *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter Admin Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white font-mono font-bold text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 font-mono text-[11px]">
              SECURITY KEY / PASSWORD *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs font-mono tracking-wider shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] min-h-[46px] cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>UNLOCK CONTROL CENTER</span>
          </button>
        </form>

        {/* Back to public store link */}
        <div className="pt-2 text-center border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
};
