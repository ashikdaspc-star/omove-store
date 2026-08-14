import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertTriangle } from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim();
    if (trimmedUser === 'Ashik8611' && password === 'Ashik@1234') {
      onSuccess();
      setUsername('');
      setPassword('');
    } else {
      setErrorMessage('Access Denied: Invalid Admin Username or Password.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-900/5 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-slate-900">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-100 pb-5">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight pt-2">
            ADMIN PORTAL LOGIN
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Enter Administrator ID & Password to access Admin Command Center
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs font-sans">
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5 font-mono">Admin Username *</label>
            <div className="relative">
              <User className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter Admin Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-emerald-600 focus:bg-white transition-all min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1.5 font-mono">Admin Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 focus:bg-white transition-all min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs font-mono tracking-wider shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[48px]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>UNLOCK ADMIN COMMAND CENTER</span>
          </button>
        </form>
      </div>
    </div>
  );
};
