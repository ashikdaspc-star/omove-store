import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DigitalProduct, DigitalCategory, CartItem } from '../types';
import { matchProductBySlugOrId } from '../utils/productMatcher';
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
  Loader2
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

  // Try resolving product from passed prop, products list, or fetched state
  const product = initialProduct || matchProductBySlugOrId(products, routeSlug) || fetchedProduct;

  useEffect(() => {
    // If not found in current props and routeSlug exists, attempt direct API fetch (for direct URLs & hard refresh)
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
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 mx-auto text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-mono text-xs font-bold uppercase tracking-wider">Loading Digital Product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 font-mono">Digital Product Not Found</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          The requested digital file may have been moved or updated in our catalog.
        </p>
        <button
          onClick={() => navigate('/digital-products')}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-md inline-flex items-center gap-2"
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

  // Convert DigitalProduct to standard product wrapper for cart compatibility
  const cartProductPayload = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    productType: 'DIGITAL' as const,
    category: (category?.name || 'Digital Software') as any,
    shortDescription: product.shortDescription,
    fullDescription: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercent: discountPercent,
    downloadSize: product.fileSize,
    version: product.version || 'v1.0',
    licenseType: 'Digital File Download' as any,
    rating: 4.9,
    reviewCount: 24,
    image: product.image,
    screenshots: [product.image],
    features: product.features,
    requirements: product.compatibility || [],
    versionHistory: [],
    fileUrl: '/api/downloads/digital',
    googleDriveUrl: '', // NEVER EXPOSE GOOGLE DRIVE URL ON FRONTEND
    instantKeyAvailable: true,
    status: product.status,
    tags: ['Digital File', product.fileType || 'Download']
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-mono text-slate-500 overflow-x-auto pb-1">
        <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link to="/digital-products" className="hover:text-emerald-600 transition-colors">Digital Products</Link>

        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link to={`/digital-products/${category.slug}`} className="hover:text-emerald-600 transition-colors">
              {category.name}
            </Link>
          </>
        )}

        {subcategory && category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link to={`/digital-products/${category.slug}/${subcategory.slug}`} className="hover:text-emerald-600 transition-colors">
              {subcategory.name}
            </Link>
          </>
        )}

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-bold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Preview & Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Image Showcase Card */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/40 backdrop-blur-md">
                  {product.fileType || 'DIGITAL FILE'}
                </span>
                {product.version && (
                  <span className="px-3 py-1 rounded-full bg-slate-950/90 text-slate-300 text-xs font-mono font-bold border border-slate-700 backdrop-blur-md">
                    {product.version}
                  </span>
                )}
              </div>

              {discountPercent > 0 && (
                <div className="absolute top-3 right-3 bg-rose-600 text-white font-mono font-black text-xs px-3 py-1 rounded-full shadow-lg">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Clean & Malware Free File</span>
              </div>
              <button
                onClick={handleShare}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isCopied ? 'Link Copied!' : 'Share Product'}</span>
              </button>
            </div>
          </div>

          {/* Product Description */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-mono flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Product Details & Description</span>
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {product.description || product.shortDescription}
            </p>
          </div>

          {/* Features Checklist */}
          {product.features && product.features.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>What's Included In This Digital File</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {product.features.map((feat, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Checkout & File Specifications */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          {/* Purchase Box */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl space-y-6">
            <div className="space-y-2">
              {category && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-mono font-bold uppercase">
                  {category.name} {subcategory ? `• ${subcategory.name}` : ''}
                </span>
              )}
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                {product.name}
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            {/* Pricing Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-mono uppercase block">Instant Digital Access</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold font-mono text-emerald-400">₹{product.price}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm font-mono text-slate-500 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
              </div>

              {discountPercent > 0 && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-mono font-extrabold text-xs">
                  SAVE {discountPercent}%
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => onBuyNow(cartProductPayload)}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-mono text-sm tracking-wider shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>BUY NOW • ₹{product.price}</span>
              </button>

              <button
                onClick={() => onAddToCart(cartProductPayload)}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>ADD TO CART</span>
              </button>
            </div>

            {/* Instant Delivery Notice */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <DownloadCloud className="w-4 h-4 shrink-0" />
                <span>Instant Google Drive Delivery</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Upon verified payment completion, your download access links to the Google Drive file will immediately activate under <strong>My Account $\rightarrow$ Downloads</strong>.
              </p>
            </div>
          </div>

          {/* File Specifications Panel */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 font-mono text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>File Specifications</span>
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">File Type Format</span>
                <span className="font-bold text-slate-900">{product.fileType || 'ZIP'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">File Download Size</span>
                <span className="font-bold text-slate-900">{product.fileSize || 'N/A'}</span>
              </div>

              {product.version && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Version</span>
                  <span className="font-bold text-emerald-700">{product.version}</span>
                </div>
              )}

              {product.compatibility && product.compatibility.length > 0 && (
                <div className="py-1 space-y-1.5">
                  <span className="text-slate-500 block">Compatibility</span>
                  <div className="flex flex-wrap gap-1">
                    {product.compatibility.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
