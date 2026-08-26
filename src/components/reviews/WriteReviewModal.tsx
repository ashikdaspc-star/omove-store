import React, { useState, useEffect } from 'react';
import { ProductReview } from '../../types';
import { Star, X, AlertCircle, Loader2, Sparkles, User, Mail, ShieldCheck } from 'lucide-react';

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  existingReview?: ProductReview | null;
  currentUser?: { name?: string; email?: string; id?: string; authenticated?: boolean } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (review: ProductReview, message: string) => void;
}

const RATING_LABELS: Record<number, { label: string; desc: string }> = {
  1: { label: 'Poor', desc: 'Did not meet expectations' },
  2: { label: 'Fair', desc: 'Below average experience' },
  3: { label: 'Good', desc: 'Average / acceptable' },
  4: { label: 'Very Good', desc: 'High quality & useful' },
  5: { label: 'Excellent', desc: 'Outstanding! Highly recommended' }
};

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  productId,
  productName,
  existingReview,
  currentUser,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState<string>(existingReview?.userName || currentUser?.name || '');
  const [email, setEmail] = useState<string>(existingReview?.userEmail || currentUser?.email || '');
  const [title, setTitle] = useState<string>(existingReview?.title || '');
  const [body, setBody] = useState<string>(existingReview?.body || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(currentUser?.authenticated || (currentUser?.email && currentUser.email.includes('@')));

  useEffect(() => {
    if (currentUser?.name && !name) setName(currentUser.name);
    if (currentUser?.email && !email) setEmail(currentUser.email);
  }, [currentUser]);

  if (!isOpen) return null;

  const activeRating = hoverRating || rating;
  const isEditing = Boolean(existingReview && existingReview.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!isAuthenticated) {
      if (!cleanName || cleanName.length < 2) {
        setError('Please provide your name (at least 2 characters).');
        return;
      }
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError('Please provide a valid email address.');
        return;
      }
    }

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }
    if (cleanTitle.length > 120) {
      setError('Review headline cannot exceed 120 characters.');
      return;
    }
    if (!cleanBody || cleanBody.length < 10) {
      setError('Please write at least 10 characters describing your experience.');
      return;
    }
    if (cleanBody.length > 3000) {
      setError('Review body cannot exceed 3,000 characters.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isEditing ? `/api/reviews/${existingReview!.id}` : '/api/reviews';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          rating,
          name: cleanName || (currentUser?.name ?? 'Customer'),
          email: cleanEmail || (currentUser?.email ?? ''),
          title: cleanTitle || `${rating} Star Review`,
          body: cleanBody
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to submit review. Please try again.');
      }

      onSuccess(
        data.review || {
          id: existingReview?.id || `rev_${Date.now()}`,
          productId,
          productName,
          userId: currentUser?.id || '',
          userName: cleanName || 'You',
          rating,
          title: cleanTitle || `${rating} Star Review`,
          body: cleanBody,
          status: 'published',
          verifiedPurchase: Boolean(data.review?.verifiedPurchase),
          helpfulCount: existingReview?.helpfulCount || 0,
          reportCount: existingReview?.reportCount || 0,
          isUserReview: true,
          createdAt: existingReview?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        data.message || 'Thanks for your review! ⭐ Your review has been submitted successfully.'
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEditing ? 'Edit Your Review' : 'Write a Product Review'}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 mt-0.5">
              {productName}
            </h3>
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-4.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* User Status / Account Indicator */}
          {isAuthenticated ? (
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {(currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{currentUser?.name || 'Customer'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0 border border-emerald-200">
                Verified Account
              </span>
            </div>
          ) : (
            /* Guest Reviewer Input Fields */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="reviewer-name" className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="reviewer-name"
                      type="text"
                      required
                      maxLength={60}
                      placeholder="e.g. Rahul Varma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="reviewer-email" className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Your Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="reviewer-email"
                      type="email"
                      required
                      maxLength={100}
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Your email is strictly private and will never be shown publicly.</span>
              </p>
            </div>
          )}

          {/* Star Rating Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Overall Rating <span className="text-rose-500">*</span>
            </label>
            
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 -m-1 focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label={`${star} Stars - ${RATING_LABELS[star]?.label}`}
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 fill-slate-100 hover:text-slate-300'
                    }`}
                  />
                </button>
              ))}

              <div className="ml-3 pl-3 border-l border-slate-200">
                <span className="text-sm font-bold text-slate-900">
                  {RATING_LABELS[activeRating]?.label}
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  {RATING_LABELS[activeRating]?.desc}
                </span>
              </div>
            </div>
          </div>

          {/* Review Headline (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="review-title" className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Review Headline <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {title.length}/120
              </span>
            </div>
            <input
              id="review-title"
              type="text"
              maxLength={120}
              placeholder="e.g. Transformed my daily workflow completely"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Detailed Review Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="review-body" className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Review Message <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {body.length}/3000
              </span>
            </div>
            <textarea
              id="review-body"
              required
              rows={4}
              maxLength={3000}
              placeholder="What did you like or find helpful? How did this product perform for you? What should other buyers know?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors leading-relaxed"
            />
            <p className="text-[10px] text-slate-400">
              Minimum 10 characters. Please avoid sharing personal private keys or phone numbers.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || (!isAuthenticated && (!name.trim() || !email.trim())) || body.trim().length < 10}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
