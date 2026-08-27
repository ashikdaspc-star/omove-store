import React, { useState, useEffect, useCallback } from 'react';
import { ProductReview, ReviewSummary, ReviewEligibility } from '../../types';
import { WriteReviewModal } from './WriteReviewModal';
import { ReportReviewModal } from './ReportReviewModal';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  Flag,
  Edit3,
  Trash2,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  MessageSquarePlus,
  Loader2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  onOpenAuthModal?: () => void;
  onBuyNow?: () => void;
  onSummaryLoaded?: (summary: ReviewSummary) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  onOpenAuthModal,
  onBuyNow,
  onSummaryLoaded
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [userReview, setUserReview] = useState<ProductReview | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sort, setSort] = useState<'helpful' | 'newest' | 'highest' | 'lowest'>('helpful');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [reportModalReview, setReportModalReview] = useState<ProductReview | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Show Toast Feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Fetch Eligibility Check
  const fetchEligibility = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/eligibility?productId=${encodeURIComponent(productId)}&productName=${encodeURIComponent(productName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEligibility(data);
          if (data.review) {
            setUserReview(data.review);
          }
        }
      }
    } catch (e) {
      console.warn('[Review Eligibility Fetch Error]', e);
    }
  }, [productId, productName]);

  // Fetch Reviews List
  const fetchReviews = useCallback(async (pageNum = 1, currentSort = sort, currentRating = ratingFilter) => {
    setLoading(true);
    try {
      const ratingParam = currentRating !== 'all' ? `&rating=${currentRating}` : '';
      const res = await fetch(
        `/api/reviews?productId=${encodeURIComponent(productId)}&page=${pageNum}&limit=10&sort=${currentSort}${ratingParam}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
          if (data.userReview) {
            setUserReview(data.userReview);
          }
          if (data.summary) {
            setSummary(data.summary);
            if (onSummaryLoaded) onSummaryLoaded(data.summary);
          }
          setTotalPages(data.pagination?.totalPages || 1);
        }
      }
    } catch (e) {
      console.warn('[Reviews Fetch Error]', e);
    } finally {
      setLoading(false);
    }
  }, [productId, sort, ratingFilter]);

  // Initial Load
  useEffect(() => {
    fetchReviews(page, sort, ratingFilter);
    fetchEligibility();
  }, [fetchReviews, fetchEligibility, page, sort, ratingFilter]);

  // Helpful Vote Toggle
  const handleHelpfulVote = async (reviewId: string) => {
    if (actionLoading[reviewId]) return;
    setActionLoading(prev => ({ ...prev, [reviewId]: true }));

    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/helpful`, {
        method: 'POST'
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        showToast('Please sign in to mark reviews as helpful.');
        if (onOpenAuthModal) onOpenAuthModal();
        return;
      }

      if (res.ok && data.success) {
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId
              ? { ...r, helpfulCount: data.helpfulCount, userHasVoted: data.userHasVoted }
              : r
          )
        );
        if (userReview && userReview.id === reviewId) {
          setUserReview(prev => prev ? { ...prev, helpfulCount: data.helpfulCount, userHasVoted: data.userHasVoted } : null);
        }
      }
    } catch (e) {
      console.warn('[Helpful Vote Error]', e);
    } finally {
      setActionLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  // Delete User's Own Review
  const handleDeleteUserReview = async () => {
    if (!userReview || !window.confirm('Are you sure you want to delete your review?')) return;

    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(userReview.id)}`, {
        method: 'DELETE'
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setUserReview(null);
        showToast('Your review has been deleted.');
        fetchEligibility();
        fetchReviews(1, sort, ratingFilter);
      } else {
        showToast(data.message || data.error || 'Failed to delete review.');
      }
    } catch (e) {
      showToast('An error occurred while deleting your review.');
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Callback after submitting / updating review
  const handleReviewSubmitted = (savedReview: ProductReview, message: string) => {
    setUserReview(savedReview);
    showToast(message);
    fetchEligibility();
    fetchReviews(1, sort, ratingFilter);
  };

  // Summary counts & percentages
  const totalCount = summary?.reviewCount || 0;
  const avgRating = summary?.averageRating || 0;
  const dist = summary?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <section className="scroll-reveal bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 border border-slate-200 shadow-xs space-y-5 sm:space-y-8 font-sans w-full max-w-full min-w-0 overflow-hidden box-border">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between gap-2 shadow-lg animate-fadeIn w-full max-w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition-colors shrink-0 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header & Rating Overview */}
      <div className="border-b border-slate-100 pb-5 sm:pb-6 space-y-5 sm:space-y-6 w-full max-w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Customer Feedback</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 break-words">
              Verified Customer Reviews
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 break-words">
              Genuine reviews submitted by customers who purchased this verified digital resource.
            </p>
          </div>

          {/* Write / Edit Review Button Action */}
          <div className="w-full sm:w-auto shrink-0">
            {userReview ? (
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Edit Your Review</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <MessageSquarePlus className="w-4 h-4 fill-white text-emerald-600 shrink-0" />
                <span>Write a Review</span>
              </button>
            )}
          </div>
        </div>

        {/* Rating Breakdown & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center pt-1 sm:pt-2 w-full max-w-full min-w-0">
          
          {/* Left Column: Overall Score Card (md:col-span-4) */}
          <div className="md:col-span-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1.5 sm:space-y-2 w-full max-w-full min-w-0 box-border">
            <div className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {totalCount > 0 ? avgRating.toFixed(1) : '0.0'}
            </div>

            <div className="flex items-center justify-center gap-0.5 sm:gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${
                    star <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 fill-slate-200'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-slate-600 font-medium break-words">
              {totalCount > 0
                ? `Based on ${totalCount} customer review${totalCount === 1 ? '' : 's'}`
                : 'No published reviews yet'}
            </p>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Verified Customer Feedback</span>
            </div>
          </div>

          {/* Right Column: Rating Distribution Bars (md:col-span-8) */}
          <div className="md:col-span-8 space-y-1.5 sm:space-y-2 w-full max-w-full min-w-0">
            {[5, 4, 3, 2, 1].map((starRating) => {
              const count = dist[starRating as keyof typeof dist] || 0;
              const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              const isSelected = ratingFilter === String(starRating);

              return (
                <button
                  key={starRating}
                  type="button"
                  onClick={() => setRatingFilter(isSelected ? 'all' : String(starRating))}
                  className={`w-full flex items-center gap-2 sm:gap-3 py-1 px-1.5 sm:px-2 rounded-lg text-xs transition-colors cursor-pointer group min-w-0 ${
                    isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1 w-10 sm:w-12 text-slate-700 font-bold shrink-0 text-xs">
                    <span>{starRating}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-2 sm:h-2.5 rounded-full bg-slate-100 overflow-hidden relative min-w-[50px]">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500 group-hover:bg-amber-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="w-14 sm:w-16 text-right text-[10px] sm:text-[11px] text-slate-500 font-medium shrink-0">
                    <span>{percentage}%</span>
                    <span className="text-[10px] text-slate-400 ml-0.5">({count})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Community Review Notice Banner */}
        {!userReview && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs text-slate-600 w-full min-w-0 box-border">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="break-words text-[11px] sm:text-xs">
                Have you tried this product? Share your honest review to help other buyers.
              </span>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
              >
                Write a Review
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. User's Own Review (Shown prominently at top) */}
      {userReview && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                Your Review
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                userReview.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800'
                  : userReview.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {userReview.status === 'published' ? '✓ Published' : userReview.status === 'rejected' ? 'Rejected' : '⏳ Awaiting Moderation'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-emerald-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Edit review"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteUserReview}
                disabled={actionLoading.delete}
                className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Delete review"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= userReview.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 fill-slate-100'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-800 ml-1">{userReview.title}</span>
            </div>

            {userReview.body && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                {userReview.body}
              </p>
            )}
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <span>Submitted on {new Date(userReview.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {userReview.status === 'pending' && (
              <span>• Review will be visible publicly once verified by our moderation team.</span>
            )}
          </div>
        </div>
      )}

      {/* 3. Review Filter Bar & Sorting */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-1 min-w-0">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs w-full sm:w-auto min-w-0">
          <button
            type="button"
            onClick={() => setRatingFilter('all')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              ratingFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All ({totalCount})
          </button>

          {[5, 4, 3, 2, 1].map((star) => {
            const count = dist[star as keyof typeof dist] || 0;
            const isSelected = ratingFilter === String(star);
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRatingFilter(isSelected ? 'all' : String(star))}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{star}</span>
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sort Select Dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto text-xs">
          <span className="text-xs text-slate-400 font-medium shrink-0">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            aria-label="Sort product reviews"
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer max-w-[160px] sm:max-w-none"
          >
            <option value="helpful">Most Helpful</option>
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* 4. Reviews List */}
      <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0">
        {loading ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading verified customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-6 sm:p-12 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3 w-full box-border">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                {ratingFilter !== 'all' ? `No ${ratingFilter}-star reviews found` : 'No reviews published yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {ratingFilter !== 'all'
                  ? 'Try selecting another rating filter to view reviews.'
                  : 'Be the first to share your experience with this product.'}
              </p>
            </div>

            {ratingFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => setRatingFilter('all')}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Show All Reviews
              </button>
            ) : !userReview && (
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Be the first to review</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-3.5 w-full max-w-full min-w-0">
            {reviews.map((rev) => {
              const isSelf = userReview && userReview.id === rev.id;
              if (isSelf) return null; // Skip self if already shown at top

              const initials = (rev.userName || 'C')
                .split(' ')
                .map(n => n.charAt(0))
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={rev.id}
                  className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs space-y-2.5 sm:space-y-3 w-full max-w-full min-w-0 box-border"
                >
                  {/* Top: Customer & Rating Header */}
                  <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Avatar initials */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] sm:text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {rev.userName}
                          </span>
                          {rev.verifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Verified Purchase</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-1 w-full min-w-0">
                    {/* Stars + Title Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                              star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                        {rev.title}
                      </h4>
                    </div>

                    {/* Review Body */}
                    {rev.body && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans pt-0.5 break-words [overflow-wrap:anywhere]">
                        {rev.body}
                      </p>
                    )}
                  </div>

                  {/* Bottom Actions: Helpful & Report */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 w-full">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => handleHelpfulVote(rev.id)}
                        disabled={actionLoading[rev.id]}
                        className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                          rev.userHasVoted
                            ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium'
                        }`}
                        title="Mark as helpful"
                      >
                        <ThumbsUp className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${rev.userHasVoted ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400'}`} />
                        <span>Helpful</span>
                        {rev.helpfulCount > 0 && <span>({rev.helpfulCount})</span>}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReportModalReview(rev)}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                      title="Report this review"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-colors cursor-pointer"
            >
              ← Previous
            </button>

            <span className="font-medium">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <WriteReviewModal
          productId={productId}
          productName={productName}
          existingReview={userReview}
          currentUser={{
            name: eligibility?.userName,
            email: eligibility?.userEmail,
            id: eligibility?.userId,
            authenticated: eligibility?.authenticated
          }}
          isOpen={isWriteModalOpen}
          onClose={() => setIsWriteModalOpen(false)}
          onSuccess={handleReviewSubmitted}
        />
      )}

      {/* Report Review Modal */}
      {reportModalReview && (
        <ReportReviewModal
          reviewId={reportModalReview.id}
          reviewTitle={reportModalReview.title}
          isOpen={Boolean(reportModalReview)}
          onClose={() => setReportModalReview(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
    </section>
  );
};
