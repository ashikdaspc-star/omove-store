import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DigitalProduct, DigitalCategory, CartItem } from '../types';
import { matchProductBySlugOrId } from '../utils/productMatcher';
import { isEbookProduct } from '../utils/categoryMatcher';
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
  FileText
} from 'lucide-react';

interface DigitalProductDetailViewProps {
  product?: DigitalProduct | null;
  products?: DigitalProduct[];
  categories?: DigitalCategory[];
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
}

export const DigitalProductDetailView: React.FC<DigitalProductDetailViewProps> = ({
  product: initialProduct = null,
  products = [],
  categories = [],
  onAddToCart,
  onBuyNow
}) => {
  const params = useParams<{ categorySlug?: string; subcategorySlug?: string; productSlug?: string }>();
  const routeSlug = params.productSlug || params.subcategorySlug || params.categorySlug;
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<DigitalProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Try resolving product from passed prop, products list, or fetched state
  const product = initialProduct || matchProductBySlugOrId(products, routeSlug) || fetchedProduct;

  useEffect(() => {
    if (!initialProduct && !matchProductBySlugOrId(products, routeSlug) && routeSlug) {
      setIsLoading(true);
      fetch(`/api/digital-products?v=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const match = matchProductBySlugOrId(data, routeSlug);
            if (match) {
              setFetchedProduct(match);
            }
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
  const mainProductImage = product.previewImage || product.image || (isEbook
    ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');

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
    image: mainProductImage,
    previewImage: product.previewImage || product.image,
    screenshots: product.screenshots && product.screenshots.length > 0 ? product.screenshots : [mainProductImage],
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
    <div className="bg-white min-h-screen text-slate-900 font-sans pb-20">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto pb-1">
          <Link to="/" className="hover:text-emerald-700 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <Link to="/digital-products" className="hover:text-emerald-700 transition-colors">Digital Products</Link>

          {category && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <Link to={`/digital-products/${category.slug}`} className="hover:text-emerald-700 transition-colors">
                {category.name}
              </Link>
            </>
          )}

          {subcategory && category && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <Link to={`/digital-products/${category.slug}/${subcategory.slug}`} className="hover:text-emerald-700 transition-colors">
                {subcategory.name}
              </Link>
            </>
          )}

          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-slate-800 font-medium truncate max-w-[220px]">{product.name}</span>
        </nav>

        {/* 3-COLUMN EDITORIAL BOOKSTORE LAYOUT */}
        <div className="grid lg:grid-cols-12 gap-8 xl:gap-12 items-start pt-2">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: EBOOK COVER & PREVIEW CONTROLS (approx 25% | lg:col-span-3) */}
          {/* ========================================================================= */}
          <div className="scroll-reveal lg:col-span-3 space-y-4">
            {/* Book Cover Container */}
            <div 
              onClick={() => setShowPreviewModal(true)}
              className="relative mx-auto w-full max-w-[280px] lg:max-w-none rounded-md overflow-hidden bg-slate-100 shadow-sm border border-slate-200/80 group cursor-pointer"
            >
              <img
                src={mainProductImage}
                alt={product.name}
                className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = isEbook
                    ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Below Cover Action Links */}
            <div className="flex items-center justify-center gap-4 pt-1 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1.5 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Preview</span>
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isCopied ? 'Link Copied' : 'Share'}</span>
              </button>
            </div>

            {/* Clean Understated Rating */}
            <div className="pt-2 text-center border-t border-slate-100">
              <div className="inline-flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs font-bold text-slate-900 ml-1">4.9</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">(125 verified reader reviews)</p>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* CENTER COLUMN: TITLE, METADATA, SYNOPSIS & SPECS (approx 50% | lg:col-span-6) */}
          {/* ========================================================================= */}
          <div className="scroll-reveal lg:col-span-6 space-y-6" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            
            {/* Title & Author Info */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              <p className="text-sm text-slate-600">
                by <span className="text-emerald-700 font-semibold">{product.author || 'Omove Store'}</span>
              </p>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
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

            {/* Horizontal Divider */}
            <div className="border-t border-slate-200" />

            {/* Description Section */}
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Description</h2>
              <div className="text-[15px] text-slate-700 leading-relaxed space-y-3 font-sans">
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
                          <p key={`p-${key}`} className="text-[15px] text-slate-700 leading-relaxed">
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
                        <h4 key={`h3-${idx}`} className="text-base font-bold text-slate-900 pt-2">
                          {renderInline(line.slice(4))}
                        </h4>
                      );
                    } else if (line.startsWith('## ')) {
                      flushParagraph(idx);
                      elements.push(
                        <h3 key={`h2-${idx}`} className="text-base sm:text-lg font-bold text-slate-900 pt-3">
                          {renderInline(line.slice(3))}
                        </h3>
                      );
                    } else if (line.startsWith('# ')) {
                      flushParagraph(idx);
                      elements.push(
                        <h3 key={`h1-${idx}`} className="text-lg sm:text-xl font-bold text-slate-900 pt-3">
                          {renderInline(line.slice(2))}
                        </h3>
                      );
                    } else if (line === '---') {
                      flushParagraph(idx);
                      elements.push(<hr key={`hr-${idx}`} className="border-slate-200 my-3" />);
                    } else if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('✔ ') || line.startsWith('• ')) {
                      flushParagraph(idx);
                      const bulletText = line.startsWith('✔ ') || line.startsWith('• ') ? line.slice(2) : line.slice(2);
                      elements.push(
                        <div key={`li-${idx}`} className="flex items-start gap-2 text-[14px] text-slate-700 py-0.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{renderInline(bulletText)}</span>
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
            </div>

            {/* Features / Included Items (if available) */}
            {product.features && product.features.length > 0 && (
              <div className="pt-2 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">What's Included</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700 py-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horizontal Divider */}
            <div className="border-t border-slate-200" />

            {/* File Specifications Section */}
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">File Specifications</h2>

              {isEbook ? (
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">File Type</span>
                    <span className="font-semibold text-slate-900">{product.ebookSpecs?.fileType || product.fileType || 'PDF / EPUB'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">File Size</span>
                    <span className="font-semibold text-slate-900">{product.ebookSpecs?.fileSize || product.fileSize || (product as any).downloadSize || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Pages</span>
                    <span className="font-semibold text-slate-900">{product.ebookSpecs?.pages || product.pages || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Language</span>
                    <span className="font-semibold text-slate-900">{product.ebookSpecs?.language || product.language || 'English'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Edition</span>
                    <span className="font-semibold text-slate-900">{product.ebookSpecs?.edition || product.edition || '1st Edition'}</span>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">File Format</span>
                    <span className="font-semibold text-slate-900">{product.fileType || 'ZIP'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Download Size</span>
                    <span className="font-semibold text-slate-900">{product.fileSize || 'N/A'}</span>
                  </div>
                  {product.version && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-500">Version</span>
                      <span className="font-semibold text-emerald-700">{product.version}</span>
                    </div>
                  )}
                  {product.compatibility && product.compatibility.length > 0 && (
                    <div className="py-2 space-y-1">
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

          </div>


          {/* ========================================================================= */}
          {/* RIGHT COLUMN: STICKY PURCHASE PANEL (approx 25% | lg:col-span-3)          */}
          {/* ========================================================================= */}
          <div className="scroll-reveal lg:col-span-3 lg:sticky lg:top-24 space-y-4" style={{ '--reveal-delay': '240ms' } as React.CSSProperties}>
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

      {/* Preview Modal / Lightbox */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white rounded-xl shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Product Preview</h3>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-md bg-slate-50 flex items-center justify-center">
              <img 
                src={mainProductImage} 
                alt={product.name} 
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
