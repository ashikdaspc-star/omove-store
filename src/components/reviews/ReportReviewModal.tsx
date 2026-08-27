import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface ReportReviewModalProps {
  reviewId: string;
  reviewTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or Promotional', desc: 'Contains advertising, links, or repetitive text' },
  { id: 'offensive', label: 'Offensive or Inappropriate', desc: 'Contains hate speech, profanity, or harassment' },
  { id: 'fake', label: 'Fake or Misleading', desc: 'Contains demonstrably untrue or deceptive information' },
  { id: 'irrelevant', label: 'Irrelevant to Product', desc: 'Not related to this digital product or software' },
  { id: 'other', label: 'Other Concern', desc: 'Any other violation of review guidelines' }
];

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  reviewId,
  reviewTitle,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('spam');
  const [details, setDetails] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason,
          details: details.trim()
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to submit report.');
      }

      onSuccess(data.message || 'Thank you for reporting this review. Our team will review it.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting the report.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs font-sans box-border"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 99999
      }}
      onClick={onClose}
    >
      <div 
        className="relative w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col box-border"
        style={{
          width: '100%',
          maxWidth: 'min(480px, calc(100vw - 24px))',
          maxHeight: 'min(800px, calc(100dvh - 28px))',
          margin: 'auto',
          transform: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Report Review
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                "{reviewTitle}"
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-words leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Reason for Reporting <span className="text-rose-500">*</span>
            </label>

            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={isSelected}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5 accent-emerald-600 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block">
                        {r.label}
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        {r.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="report-details" className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Additional Details (Optional)
            </label>
            <textarea
              id="report-details"
              rows={2}
              maxLength={500}
              placeholder="Provide any additional context for our moderation team..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

