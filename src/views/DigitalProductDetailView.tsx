import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DigitalProduct, DigitalCategory, CartItem, ReviewSummary } from '../types';
import { matchProductBySlugOrId } from '../utils/productMatcher';
import { isEbookProduct } from '../utils/categoryMatcher';
import { ProductReviewsSection } from '../components/reviews/ProductReviewsSection';
import { ProductImageGallery } from '../components/ProductImageGallery';
import {
  Sparkles,
  DownloadCloud,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  HardDrive,
  Layers,
  Cpu,
  ShoppingCart,
  Zap,
  Tag,
  Clock,
  Share2,
  Lock,
  Loader2,
  BookOpen,
  Search,
  Star,
  Check,
  X,
  FileText,
  ArrowRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface DigitalProductDetailViewProps {
  product?: DigitalProduct | null;
  products?: DigitalProduct[];
  categories?: DigitalCategory[];
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
  onOpenAuthModal?: () => void;
}

export const DigitalProductDetailView: React.FC<DigitalProductDetailViewProps> = ({
  product: initialProduct = null,
  products = [],
  categories = [],
  onAddToCart,
  onBuyNow,
  onOpenAuthModal
}) => {
  const params = useParams<{ categorySlug?: string; subcategorySlug?: string; productSlug?: string }>();
  const routeSlug = params.productSlug || params.subcategorySlug || params.categorySlug;
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<DigitalProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Try resolving product from passed prop, products list, or fetched state
  const product = initialProduct || matchProductBySlugOrId(products, routeSlug) || fetchedProduct;

  useEffect(() => {
    if (product && product.id) {
      fetch(`/api/reviews/summary?productId=${encodeURIComponent(product.id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.summary) {
            setReviewSummary(data.summary);
          }
        })
        .catch(() => {});
    }
  }, [product?.id]);

  useEffect(() => {
    if (!initialProduct && !matchProductBySlugOrId(products, routeSlug) && routeSlug) {
      setIsLoading(true);
      fetch(`/api/digital-products/${encodeURIComponent(routeSlug)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.product) {
            setFetchedProduct(data.product);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [initialProduct, products, routeSlug]);

  if (isLoading && !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4 font-sans">
        <Loader2 className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Loading Product Details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6 font-sans">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Digital Product Not Found</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          The requested digital file may have been moved or updated in our catalog.
        </p>
        <button
          onClick={() => navigate('/digital-products')}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DIGITAL MARKETPLACE</span>
        </button>
      </div>
    );
  }

  // Helper to map category IDs to names
  const category = categories.find((c) => c.id === product.categoryId || c.slug === product.categoryId);
  const subcategory = categories.find((c) => c.id === product.subcategoryId || c.slug === product.subcategoryId);

  const discountPercent = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isEbook = isEbookProduct(product, categories);

  // Compute all available preview images for gallery
  const productGalleryImages = React.useMemo(() => {
    const list: string[] = [];
    if (product.image && typeof product.image === 'string' && product.image.trim()) {
      list.push(product.image.trim());
    }
    if (product.previewImage && typeof product.previewImage === 'string' && product.previewImage.trim() && !list.includes(product.previewImage.trim())) {
      list.push(product.previewImage.trim());
    }
    if (Array.isArray(product.screenshots)) {
      product.screenshots.forEach((s) => {
        if (s && typeof s === 'string' && s.trim() && !list.includes(s.trim())) {
          list.push(s.trim());
        }
      });
    }
    if (list.length === 0) {
      list.push(
        isEbook
          ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
      );
    }
    return list;
  }, [product, isEbook]);

  // Convert DigitalProduct to standard product wrapper for cart compatibility
  const cartProductPayload = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    productType: 'DIGITAL' as const,
    category: (category?.name || 'Digital Product') as any,
    shortDescription: product.shortDescription,
    fullDescription: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercent: discountPercent,
    downloadSize: product.fileSize,
    version: product.version || 'v1.0',
    licenseType: 'Digital File Download' as any,
    rating: 4.9,
    reviewCount: 125,
    image: productGalleryImages[0],
    previewImage: product.previewImage || product.image,
    screenshots: product.screenshots && product.screenshots.length > 0 ? product.screenshots : [productGalleryImages[0]],
    features: product.features,
    requirements: product.compatibility || [],
    versionHistory: [],
    fileUrl: '/api/downloads/digital',
    googleDriveUrl: '',
    instantKeyAvailable: true,
    status: product.status,
    tags: ['Digital File', product.fileType || 'Download']
  };

  return (
    <div id="product-detail-page" className="product-detail-view bg-white min-h-screen text-slate-900 font-sans pb-[calc(76px+env(safe-area-inset-bottom,16px))] sm:pb-20 w-full max-w-full overflow-x-hidden box-border">
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-3 sm:space-y-6 w-full max-w-full min-w-0 box-border">
        
        {/* Breadcrumb Navigation */}
        <nav className="w-full flex items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-xs text-slate-500 overflow-x-auto py-1 sm:pb-1 scrollbar-none min-w-0 min-h-[32px]">
          <Link to="/" className="hover:text-emerald-700 transition-colors shrink-0">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <Link to="/digital-products" className="hover:text-emerald-700 transition-colors shrink-0">Digital Products</Link>

          {category && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <Link to={`/digital-products/${category.slug}`} className="hover:text-emerald-700 transition-colors shrink-0">
                {category.name}
              </Link>
            </>
          )}

          {subcategory && category && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <Link to={`/digital-products/${category.slug}/${subcategory.slug}`} className="hover:text-emerald-700 transition-colors shrink-0">
                {subcategory.name}
              </Link>
            </>
          )}

          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-800 font-medium truncate max-w-[120px] sm:max-w-[220px] shrink-0">{product.name}</span>
        </nav>

        {/* 3-COLUMN EDITORIAL BOOKSTORE / ECOMMERCE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start pt-0.5 sm:pt-2 w-full max-w-full min-w-0">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: PRODUCT IMAGE GALLERY & ACTIONS (lg:col-span-4)              */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-3 sm:space-y-4 w-full max-w-full min-w-0">
            {/* Interactive Image Gallery */}
            <ProductImageGallery
              images={productGalleryImages}
              productName={product.name}
              isEbook={isEbook}
            />

            {/* Below Gallery Action Links (Compact 34–36px) */}
            <div className="flex items-center justify-center gap-4 py-1 text-xs text-slate-600 w-full min-h-[34px]">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 hover:text-emerald-700 font-medium transition-colors cursor-pointer py-1 px-2.5 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isCopied ? 'Link Copied' : 'Share'}</span>
              </button>
            </div>

            {/* Dynamic Verified Customer Rating Card (Compressed 36–42px) */}
            <div className="pt-1.5 text-center border-t border-slate-100 w-full">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('product-reviews-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="group inline-flex items-center justify-center gap-1.5 hover:opacity-85 transition-all cursor-pointer w-full max-w-full px-2 py-0.5"
                title="Jump to Customer Reviews"
              >
                {reviewSummary && reviewSummary.reviewCount > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.round(reviewSummary.averageRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      {reviewSummary.averageRating.toFixed(1)}
                    </span>
                    <span className="text-[11px] text-slate-500 group-hover:text-emerald-700 transition-colors">
                      ({reviewSummary.reviewCount} verified {reviewSummary.reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-0.5 text-slate-300">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-3.5 h-3.5 text-slate-200 fill-slate-100"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      0.0
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover:text-emerald-700 transition-colors">
                      (No reviews yet • Be the first to review)
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* CENTER COLUMN: TITLE, METADATA, SYNOPSIS & SPECS (approx 42% | lg:col-span-5) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
            
            {/* Title & Author Info */}
            <div className="space-y-1 w-full min-w-0">
              <h1 className="text-[20px] min-[360px]:text-[22px] sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.18] break-words">
                {product.name}
              </h1>

              <p className="text-xs text-slate-600 pt-0.5 break-words">
                by <span className="text-emerald-700 font-semibold">{product.author || 'Omove Store'}</span>
              </p>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] sm:text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{category?.name || 'Digital Product'}</span>
                <span>•</span>
                <span>{product.fileType || 'PDF / EPUB'}</span>
                {product.ebookSpecs?.pages && (
                  <>
                    <span>•</span>
                    <span>{product.ebookSpecs.pages}</span>
                  </>
                )}
                <span>•</span>
                <span>{product.ebookSpecs?.language || product.language || 'English'}</span>
              </div>
            </div>

            {/* Mobile-Only Immediate Purchase Action Card (Main conversion area) */}
            <div className="lg:hidden rounded-2xl bg-slate-50/90 border border-slate-200 p-3.5 sm:p-4 space-y-3 shadow-xs w-full max-w-full min-w-0 box-border">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Price</span>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl min-[360px]:text-3xl font-black text-slate-900 font-mono tracking-tight">₹{product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-slate-400 line-through font-medium font-mono">₹{product.originalPrice}</span>
                    )}
                  </div>
                </div>
                {discountPercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-200 shrink-0 shadow-2xs">
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              <div className="space-y-2 pt-0.5 w-full">
                <button
                  type="button"
                  onClick={() => onBuyNow(cartProductPayload)}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm tracking-wide shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>⚡ BUY NOW</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAddToCart(cartProductPayload)}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-800 font-bold text-xs border border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-600" />
                  <span>ADD TO CART</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[10.5px] sm:text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1 text-emerald-800 font-bold truncate">
                  <DownloadCloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Instant Download</span>
                </span>
                <span className="flex items-center gap-1 justify-end truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Lifetime Access</span>
                </span>
              </div>
            </div>

            {/* Horizontal Divider */}
            <div className="border-t border-slate-200" />

            {/* Description Section with Expandable Read More on Mobile */}
            <div className="space-y-2 sm:space-y-3 w-full max-w-full min-w-0 pt-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Description</h2>
              <div className="relative w-full max-w-full min-w-0">
                <div className={`text-[13.5px] sm:text-[15px] text-slate-700 leading-[1.55] space-y-2.5 font-sans w-full max-w-full min-w-0 break-words [overflow-wrap:anywhere] ${
                  !isDescExpanded ? 'max-h-[160px] overflow-hidden lg:max-h-none' : ''
                }`}>
                  {(() => {
                    const rawDesc = product.description || product.shortDescription || '';
                    if (!rawDesc) return null;

                    const lines = rawDesc.split('\n');
                    const elements: React.ReactNode[] = [];
                    let currentParagraph: string[] = [];

                    const renderInline = (str: string) => {
                      const parts = str.split(/(\*\*.*?\*\*)/g);
                      return parts.map((part, idx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      });
                    };

                    const flushParagraph = (key: number) => {
                      if (currentParagraph.length > 0) {
                        const pText = currentParagraph.join(' ').trim();
                        if (pText) {
                          elements.push(
                            <p key={`p-${key}`} className="text-[13.5px] sm:text-[15px] text-slate-700 leading-[1.55] break-words">
                              {renderInline(pText)}
                            </p>
                          );
                        }
                        currentParagraph = [];
                      }
                    };

                    lines.forEach((rawLine, idx) => {
                      const line = rawLine.trim();

                      if (!line) {
                        flushParagraph(idx);
                        return;
                      }

                      if (line.startsWith('### ')) {
                        flushParagraph(idx);
                        elements.push(
                          <h4 key={`h3-${idx}`} className="text-sm sm:text-base font-bold text-slate-900 pt-1.5 break-words">
                            {renderInline(line.slice(4))}
                          </h4>
                        );
                      } else if (line.startsWith('## ')) {
                        flushParagraph(idx);
                        elements.push(
                          <h3 key={`h2-${idx}`} className="text-base sm:text-lg font-bold text-slate-900 pt-2 break-words">
                            {renderInline(line.slice(3))}
                          </h3>
                        );
                      } else if (line.startsWith('# ')) {
                        flushParagraph(idx);
                        elements.push(
                          <h3 key={`h1-${idx}`} className="text-base sm:text-xl font-bold text-slate-900 pt-2.5 break-words">
                            {renderInline(line.slice(2))}
                          </h3>
                        );
                      } else if (line === '---') {
                        flushParagraph(idx);
                        elements.push(<hr key={`hr-${idx}`} className="border-slate-200 my-2.5" />);
                      } else if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('✔ ') || line.startsWith('• ')) {
                        flushParagraph(idx);
                        const bulletText = line.startsWith('✔ ') || line.startsWith('• ') ? line.slice(2) : line.slice(2);
                        elements.push(
                          <div key={`li-${idx}`} className="flex items-start gap-2 text-xs sm:text-[14px] text-slate-700 py-0.5 break-words">
                            <span className="text-emerald-600 font-bold shrink-0">•</span>
                            <span className="min-w-0">{renderInline(bulletText)}</span>
                          </div>
                        );
                      } else {
                        currentParagraph.push(line);
                      }
                    });

                    flushParagraph(lines.length);
                    return elements;
                  })()}
                </div>
                {!isDescExpanded && (
                  <div className="lg:hidden absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="lg:hidden inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-1 cursor-pointer"
              >
                <span>{isDescExpanded ? 'Show less' : 'Read more'}</span>
                {isDescExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Features / Included Items (if available) */}
            {product.features && product.features.length > 0 && (
              <div className="pt-1.5 space-y-2 sm:space-y-3 w-full max-w-full min-w-0">
                <h3 className="text-sm font-bold text-slate-900">What's Included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs w-full max-w-full min-w-0">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700 py-0.5 break-words">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="min-w-0">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horizontal Divider */}
            <div className="border-t border-slate-200" />

            {/* File Specifications Section */}
            <div className="space-y-2.5 sm:space-y-3 w-full max-w-full min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">File Specifications</h2>

              {isEbook ? (
                <div className="divide-y divide-slate-100 text-xs w-full max-w-full min-w-0">
                  <div className="flex justify-between items-center py-2 gap-2">
                    <span className="text-slate-500 shrink-0">File Type</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px] sm:max-w-none">{product.ebookSpecs?.fileType || product.fileType || 'PDF / EPUB'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 gap-2">
                    <span className="text-slate-500 shrink-0">File Size</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px] sm:max-w-none">{product.ebookSpecs?.fileSize || product.fileSize || (product as any).downloadSize || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 gap-2">
                    <span className="text-slate-500 shrink-0">Pages</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px] sm:max-w-none">{product.ebookSpecs?.pages || product.pages || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 gap-2">
                    <span className="text-slate-500 shrink-0">Language</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px] sm:max-w-none">{product.ebookSpecs?.language || product.language || 'English'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 gap-2">
                    <span className="text-slate-500 shrink-0">Edition</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px] sm:max-w-none">{product.ebookSpecs?.edition || product.edition || '1st Edition'}</span>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs w-full max-w-full min-w-0">
                  <div className="flex justify-between items-center py-2 gap-2">
                    <span className="text-slate-500 shrink-0">File Format</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px] sm:max-w-none">{product.fileType || 'ZIP'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 gap-2">
                    <span className="text-slate-500 shrink-0">Download Size</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px] sm:max-w-none">{product.fileSize || 'N/A'}</span>
                  </div>
                  {product.version && (
                    <div className="flex justify-between items-center py-2 gap-2">
                      <span className="text-slate-500 shrink-0">Version</span>
                      <span className="font-semibold text-emerald-700 text-right truncate max-w-[180px] sm:max-w-none">{product.version}</span>
                    </div>
                  )}
                  {product.compatibility && product.compatibility.length > 0 && (
                    <div className="py-2 space-y-1 w-full">
                      <span className="text-slate-500 block">Compatibility</span>
                      <div className="flex flex-wrap gap-1">
                        {product.compatibility.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Verified Customer Reviews Section */}
            <div id="product-reviews-section" className="w-full max-w-full min-w-0">
              <ProductReviewsSection
                productId={product.id}
                productName={product.name}
                onOpenAuthModal={onOpenAuthModal}
                onBuyNow={() => onBuyNow(cartProductPayload)}
                onSummaryLoaded={setReviewSummary}
              />
            </div>

          </div>


          {/* ========================================================================= */}
          {/* RIGHT COLUMN: STICKY PURCHASE PANEL (approx 25% | Desktop Only)            */}
          {/* ========================================================================= */}
          <div className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-lg bg-white border border-slate-200 p-5 shadow-xs space-y-4">
              
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Buy this digital product
                </span>
                
                {/* Pricing Display */}
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-3xl font-extrabold text-slate-900">₹{product.price}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through font-medium">₹{product.originalPrice}</span>
                  )}
                </div>

                {discountPercent > 0 && (
                  <div className="pt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                      Save {discountPercent}%
                    </span>
                  </div>
                )}
              </div>

              {/* Purchase CTAs */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => onBuyNow(cartProductPayload)}
                  className="w-full py-3.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>BUY NOW</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAddToCart(cartProductPayload)}
                  className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-600" />
                  <span>ADD TO CART</span>
                </button>
              </div>

              {/* Instant Delivery Info */}
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                  <DownloadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant Digital Delivery</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Once payment is verified, your digital download will become immediately available in your account.
                </p>
              </div>

              {/* Trust & Guarantee Checks */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verified Clean & Malware-free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Lifetime Download Access</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Mobile-Only Sticky Bottom Buy Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 font-sans pb-safe w-full max-w-full box-border">
        <div className="min-w-0 shrink">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">₹{product.price}</span>
            {discountPercent > 0 && (
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                -{discountPercent}%
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 truncate max-w-[120px] min-[360px]:max-w-[140px] sm:max-w-[180px] font-medium">{product.name}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onAddToCart(cartProductPayload)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center cursor-pointer min-h-[38px] min-w-[38px]"
            title="Add to Cart"
            aria-label="Add to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onBuyNow(cartProductPayload)}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all min-h-[38px]"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>BUY NOW</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
