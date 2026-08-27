import React, { useState, useEffect } from 'react';
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
import { ProductImageGallery } from './ProductImageGallery';
import { trackViewContent } from '../utils/metaPixel';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'history' | 'reviews'>('overview');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  useEffect(() => {
    if (product) {
      trackViewContent({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        currency: 'INR'
      });
      setActiveTab('overview');
      setReviews([
        {
          id: 'rev-1',
          productId: product.id,
          userId: 'usr-1',
          userName: 'Mark S.',
          title: 'Essential utility for system tuning',
          body: 'Absolutely essential software for IT repair. The debloat feature saved me 3 hours on 5 client laptops today!',
          rating: 5,
          status: 'published',
          verifiedPurchase: true,
          helpfulCount: 14,
          reportCount: 0,
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          id: 'rev-2',
          productId: product.id,
          userId: 'usr-2',
          userName: 'Karan P.',
          title: 'Super fast delivery and easy setup',
          body: 'Google Drive download link was delivered instantly after Razorpay payment. Downloaded in under 1 minute.',
          rating: 5,
          status: 'published',
          verifiedPurchase: true,
          helpfulCount: 8,
          reportCount: 0,
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 86400000).toISOString()
        }
      ]);
    }
  }, [product]);

  if (!product) return null;

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    const review: ProductReview = {
      id: 'rev-' + Date.now(),
      productId: product.id,
      userId: 'usr-self',
      userName: newReviewAuthor,
      title: 'Customer Review',
      body: newReviewComment,
      rating: newReviewRating,
      status: 'published',
      verifiedPurchase: true,
      helpfulCount: 0,
      reportCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-white/95 border-b border-slate-100 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              {product.category}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">ID: {product.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-8 max-h-[82vh] overflow-y-auto">
          {/* Gallery & Main Overview Grid */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {/* Gallery Column */}
            <div className="space-y-4">
              <ProductImageGallery
                images={images.filter(Boolean) as string[]}
                productName={product.name}
              />

              {/* Specs Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                {product.productType === 'STORE' ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        Category:
                      </span>
                      <span className="font-bold text-slate-900">{product.category}</span>
                    </div>
                    {product.licenseType && (
                      <div className="flex justify-between text-slate-600">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Note / Warranty:
                        </span>
                        <span className="font-bold text-slate-900">{product.licenseType}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Service Support:
                      </span>
                      <span className="text-emerald-700 font-semibold">WhatsApp Assistance Included</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        File Size:
                      </span>
                      <span className="font-bold text-slate-900">{product.downloadSize || 'Instant Access'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        Version:
                      </span>
                      <span className="font-bold text-slate-900">{product.version || 'v1.0'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1 text-slate-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Security Check:
                      </span>
                      <span className="text-emerald-700 font-semibold">100% Virus-Free Verified</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info Column */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-xs text-slate-500">({product.reviewCount} customer reviews)</span>
                  <span className="text-xs text-emerald-700 font-medium ml-auto flex items-center gap-1">
                    {product.productType === 'STORE' ? (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp Inquiries
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Instant Access
                      </>
                    )}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{product.name}</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{product.fullDescription || product.shortDescription}</p>
              </div>

              {/* Price & Buy / WhatsApp Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Product Price</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {product.price === 0 ? 'FREE' : `₹${product.price}`}
                      </span>
                      {product.originalPrice > product.price && product.price > 0 && (
                        <span className="text-sm text-slate-400 line-through font-medium">₹{product.originalPrice}</span>
                      )}
                      {product.discountPercent > 0 && product.price > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Save {product.discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                    title="Share product"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {copiedLink && (
                  <p className="text-xs text-emerald-700 font-medium">Link copied to clipboard!</p>
                )}

                {/* Purchase Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold tracking-wider flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer active:scale-98"
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
                    className={`py-3.5 px-4 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98 ${
                      !isOnline
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <Zap className={`w-4 h-4 ${!isOnline ? 'text-slate-400' : ''}`} />
                    <span>{isOnline ? 'BUY NOW' : 'OFFLINE'}</span>
                  </button>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-800 block text-xs">100% Genuine & Verified</span>
                    <span className="text-[11px] text-slate-600 leading-snug block">Connect directly on WhatsApp for full guidance and quick assistance.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
              {[
                { id: 'overview', label: 'Features Overview' },
                { id: 'requirements', label: 'System Requirements' },
                { id: 'history', label: 'Version History' },
                { id: 'reviews', label: `Reviews (${reviews.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
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
                  {(product.features || ['Instant Product Access Key', 'Official Setup Package']).map((feat, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                      <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-700 leading-relaxed font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Minimum System Requirements</h4>
                  <ul className="space-y-2">
                    {(product.requirements || ['Windows 10/11 (64-bit)', '2 GB RAM', '1 GB Storage']).map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-600">
                        <Cpu className="w-4 h-4 text-emerald-600" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {(product.versionHistory || []).length > 0 ? (
                    (product.versionHistory || []).map((vh, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-700">{vh.version}</span>
                          <span className="text-slate-400">{vh.date}</span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                          {(vh.changes || []).map((ch, i) => (
                            <li key={i}>{ch}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      Current Version: {product.version || 'v1.0.0'} (Initial Release)
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews List */}
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                            {rev.verifiedPurchase && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.body}</p>
                        <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleAddReview} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Leave a Review</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Your Name..."
                        required
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                      <select
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
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
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
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
