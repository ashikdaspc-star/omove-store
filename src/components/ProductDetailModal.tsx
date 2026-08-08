import React, { useState } from 'react';
import { Product, ProductReview } from '../types';
import {
  X,
  Star,
  Download,
  ShieldCheck,
  Check,
  Zap,
  ShoppingBag,
  Clock,
  HardDrive,
  Cpu,
  Layers,
  MessageSquare,
  ThumbsUp,
  Share2,
  FileText
} from 'lucide-react';

import { useOnlineStatus } from './OfflineBanner';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow
}) => {
  const isOnline = useOnlineStatus();
  if (!product) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'history' | 'reviews'>('overview');
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [reviews, setReviews] = useState<ProductReview[]>([
    {
      id: 'rev-1',
      productId: product.id,
      author: 'Mark S. (IT System Admin)',
      rating: 5,
      date: '2 days ago',
      comment: 'Absolutely essential software for IT repair. The debloat feature saved me 3 hours on 5 client laptops today!',
      verifiedPurchase: true
    },
    {
      id: 'rev-2',
      productId: product.id,
      author: 'Karan Patel',
      rating: 5,
      date: '1 week ago',
      comment: 'License key was delivered instantly after Razorpay payment. Downloaded in under 1 minute.',
      verifiedPurchase: true
    }
  ]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const review: ProductReview = {
      id: 'rev-' + Date.now(),
      productId: product.id,
      author: newReviewAuthor,
      rating: newReviewRating,
      date: 'Just now',
      comment: newReviewComment,
      verifiedPurchase: true
    };

    setReviews([review, ...reviews]);
    setNewReviewAuthor('');
    setNewReviewComment('');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const images = [product.image, ...(product.screenshots || [])];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              {product.category}
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {product.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Gallery & Main Overview Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Gallery Column */}
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-xs font-mono text-cyan-400 border border-slate-800">
                  {product.licenseType}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImage === img ? 'border-indigo-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specs Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    File Size:
                  </span>
                  <span className="font-mono text-white">{product.downloadSize}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Version:
                  </span>
                  <span className="font-mono text-white">{product.version}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Security Check:
                  </span>
                  <span className="text-emerald-400 font-semibold">100% Virus-Free Verified</span>
                </div>
              </div>
            </div>

            {/* Info Column */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-xs text-slate-500">({product.reviewCount} customer reviews)</span>
                  <span className="text-xs text-emerald-400 font-medium ml-auto flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Instant Key
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white tracking-tight">{product.name}</h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{product.fullDescription}</p>
              </div>

              {/* Price & Buy Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-900/30 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Special Digital Discount Price</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-mono text-white">₹{product.price}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-slate-500 line-through font-mono">₹{product.originalPrice}</span>
                      )}
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Save {product.discountPercent}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    title="Share product"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {copiedLink && (
                  <p className="text-xs text-emerald-400 font-medium">Link copied to clipboard!</p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO CART</span>
                  </button>
                  <button
                    disabled={!isOnline}
                    onClick={() => {
                      if (!isOnline) {
                        alert("You’re offline. Please reconnect to the internet to purchase this product.");
                        return;
                      }
                      onBuyNow(product);
                      onClose();
                    }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-all ${
                      !isOnline
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105'
                    }`}
                  >
                    <Zap className={`w-4 h-4 ${!isOnline ? 'text-slate-500' : ''}`} />
                    <span>{isOnline ? 'BUY NOW' : 'OFFLINE — BUY UNAVAILABLE'}</span>
                  </button>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-400 block text-xs">100% Refund Guarantee</span>
                    <span className="text-[11px] text-slate-300 leading-snug block">If we're unable to resolve your issue, your payment will be automatically refunded within 2–3 business days.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
              {[
                { id: 'overview', label: 'Features Overview' },
                { id: 'requirements', label: 'System Requirements' },
                { id: 'history', label: 'Version History' },
                { id: 'reviews', label: `Reviews (${reviews.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="pt-6">
              {activeTab === 'overview' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                      <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-200 leading-relaxed font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">Minimum System Requirements</h4>
                  <ul className="space-y-2">
                    {product.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-300">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {product.versionHistory.map((vh, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-indigo-400">{vh.version}</span>
                        <span className="text-slate-500">{vh.date}</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {vh.changes.map((ch, i) => (
                          <li key={i}>{ch}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews List */}
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{rev.author}</span>
                            {rev.verifiedPurchase && (
                              <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{rev.date}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleAddReview} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">Leave a Review</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Your Name..."
                        required
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <select
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value={5}>5 Stars - Outstanding</option>
                        <option value={4}>4 Stars - Great</option>
                        <option value={3}>3 Stars - Average</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Write your review experience..."
                      required
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all"
                    >
                      Submit Verified Review
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
