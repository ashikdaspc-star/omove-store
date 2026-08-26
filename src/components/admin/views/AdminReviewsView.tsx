import React, { useState, useEffect, useCallback } from 'react';
import { ProductReview, ReviewStatus } from '../../../types';
import {
  Star,
  CheckCircle2,
  XCircle,
  EyeOff,
  Trash2,
  Flag,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  Sparkles,
  Loader2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export const AdminReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0,
    hidden: 0,
    reported: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reportedOnly, setReportedOnly] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAdminReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (ratingFilter !== 'all') params.append('rating', ratingFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (reportedOnly) params.append('reported', 'true');

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
          if (data.stats) setStats(data.stats);
        }
      }
    } catch (e) {
      console.warn('[Admin Reviews Fetch Error]', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, ratingFilter, searchQuery, reportedOnly]);

  useEffect(() => {
    fetchAdminReviews();
  }, [fetchAdminReviews]);

  // Update Review Status
  const handleUpdateStatus = async (reviewId: string, newStatus: ReviewStatus) => {
    setActionLoading(prev => ({ ...prev, [reviewId]: true }));
    try {
      const res = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast(`Review marked as ${newStatus}.`);
        fetchAdminReviews();
      } else {
        showToast(data.message || data.error || 'Failed to update review status.');
      }
    } catch (e) {
      showToast('An error occurred updating review.');
    } finally {
      setActionLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) return;

    setActionLoading(prev => ({ ...prev, [reviewId]: true }));
    try {
      const res = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE'
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('Review permanently deleted.');
        if (selectedReview?.id === reviewId) setSelectedReview(null);
        fetchAdminReviews();
      } else {
        showToast(data.message || data.error || 'Failed to delete review.');
      }
    } catch (e) {
      showToast('An error occurred deleting review.');
    } finally {
      setActionLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Reviews Moderation
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Cloudflare D1
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review, approve, reject, and moderate verified customer reviews across all digital products.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAdminReviews()}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div 
          onClick={() => { setStatusFilter('all'); setReportedOnly(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all' && !reportedOnly
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusFilter === 'all' && !reportedOnly ? 'text-slate-300' : 'text-slate-400'}`}>
            Total Reviews
          </span>
          <span className="text-2xl font-black tracking-tight mt-1 block">
            {stats.total}
          </span>
        </div>

        <div 
          onClick={() => { setStatusFilter('pending'); setReportedOnly(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusFilter === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>
            Pending Approval
          </span>
          <span className="text-2xl font-black tracking-tight mt-1 block">
            {stats.pending}
          </span>
        </div>

        <div 
          onClick={() => { setStatusFilter('published'); setReportedOnly(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'published'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusFilter === 'published' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Published
          </span>
          <span className="text-2xl font-black tracking-tight mt-1 block">
            {stats.published}
          </span>
        </div>

        <div 
          onClick={() => { setStatusFilter('rejected'); setReportedOnly(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusFilter === 'rejected' ? 'text-rose-100' : 'text-rose-700'}`}>
            Rejected
          </span>
          <span className="text-2xl font-black tracking-tight mt-1 block">
            {stats.rejected}
          </span>
        </div>

        <div 
          onClick={() => { setStatusFilter('hidden'); setReportedOnly(false); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'hidden'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${statusFilter === 'hidden' ? 'text-slate-300' : 'text-slate-500'}`}>
            Hidden
          </span>
          <span className="text-2xl font-black tracking-tight mt-1 block">
            {stats.hidden}
          </span>
        </div>

        <div 
          onClick={() => setReportedOnly(!reportedOnly)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            reportedOnly
              ? 'bg-rose-700 text-white border-rose-700 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${reportedOnly ? 'text-rose-200' : 'text-rose-700'}`}>
            Reported
          </span>
          <span className="text-2xl font-black tracking-tight mt-1 block">
            {stats.reported}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, review title, body, or product ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter reviews by status"
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
            <option value="hidden">Hidden</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            aria-label="Filter reviews by rating"
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Reported Toggle */}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={reportedOnly}
              onChange={(e) => setReportedOnly(e.target.checked)}
              className="rounded accent-rose-600 cursor-pointer"
            />
            <span>Reported Only</span>
          </label>
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading reviews database...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-900">No reviews found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => {
              const isLoading = actionLoading[rev.id];

              return (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-3"
                >
                  {/* Top Bar: Customer info, Product, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Customer name */}
                      <span className="font-bold text-slate-900">
                        {rev.userName || 'Customer'}
                      </span>

                      {/* Customer email */}
                      {rev.userEmail && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({rev.userEmail})
                        </span>
                      )}

                      {/* Verified Badge */}
                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Purchase</span>
                        </span>
                      )}

                      {/* Product ID Pill */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                        {rev.productId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Reported count pill */}
                      {rev.reportCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <Flag className="w-3 h-3 text-rose-600" />
                          <span>{rev.reportCount} Report{rev.reportCount === 1 ? '' : 's'}</span>
                        </span>
                      )}

                      {/* Status Pill */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        rev.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : rev.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : rev.status === 'hidden'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars & Title & Body */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 fill-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        {rev.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {rev.body}
                    </p>
                  </div>

                  {/* Footer Meta & Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                      <span>Submitted: {new Date(rev.createdAt).toLocaleString()}</span>
                      {rev.orderId && <span>• Order: <span className="font-mono text-slate-600">{rev.orderId}</span></span>}
                      <span>• Helpful Votes: <strong className="text-slate-700">{rev.helpfulCount || 0}</strong></span>
                    </div>

                    {/* Moderation Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {rev.status !== 'published' && (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleUpdateStatus(rev.id, 'published')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Approve and Publish Review"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {rev.status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Reject Review"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      {rev.status === 'published' && (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleUpdateStatus(rev.id, 'hidden')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Hide Review from storefront"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Review Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
