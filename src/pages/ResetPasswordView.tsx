import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';

interface ResetPasswordViewProps {
  onOpenAuthModal: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onOpenAuthModal }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!token.trim()) {
      setErrorNotice('Password reset token is missing. Please click the link from your email.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorNotice('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorNotice('Passwords do not match. Please re-enter your new password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessNotice(data.message || 'Your password has been updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorNotice(data.error || 'Failed to reset password. Invalid or expired token.');
      }
    } catch (err) {
      setErrorNotice('Network error while connecting to authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl relative">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-mono tracking-tight">Set New Password</h1>
            <p className="text-xs text-slate-400 font-mono">Omove Store Account Security</p>
          </div>
        </div>

        {errorNotice && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono mb-2">Password Updated!</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">{successNotice}</p>
            </div>
            <button
              onClick={() => {
                onOpenAuthModal();
                navigate('/');
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs font-mono tracking-wider shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01]"
            >
              SIGN IN WITH NEW PASSWORD
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 font-mono">Reset Token *</label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Paste your reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all font-mono text-xs min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 font-mono">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all font-sans text-xs min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 font-mono">Confirm New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-slate-950 transition-all font-sans text-xs min-h-[44px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs font-mono tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD'}</span>
            </button>

            <div className="text-center pt-2">
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Omove Store</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
