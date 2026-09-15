import React from 'react';
import { Product } from '../types';
import { Star, Download, Heart, ShoppingBag, Zap } from 'lucide-react';
import { useOnlineStatus } from './OfflineBanner';

interface DigitalProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  staggerIndex?: number;
}

export const DigitalProductCard: React.FC<DigitalProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
  staggerIndex
}) => {
  const isOnline = useOnlineStatus();
  const delay = typeof staggerIndex === 'number' && staggerIndex > 0 ? `${(staggerIndex % 4) * 140}ms` : undefined;

  return (
    <div
      data-scroll-reveal="card"
      style={delay ? ({ '--reveal-delay': delay } as React.CSSProperties) : undefined}
      className="scroll-reveal group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-emerald-500/40 transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between"
    >
      <div>
        {/* Thumbnail & Digital Badge */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(product)}>
          <img
            src={product.image || product.previewImage || '/logo.png'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.currentTarget;
              if (product.previewImage && target.src !== product.previewImage && product.image && target.src.includes(product.image)) {
                target.src = product.previewImage;
                return;
              }
              target.onerror = null;
              target.src = '/logo.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-50 pointer-events-none" />

          {/* Digital & SubCategory Badge */}
          <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 sm:gap-1.5 z-10">
            <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
              DIGITAL
            </span>
            {product.subCategory && (
              <span className="hidden min-[400px]:inline px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-800 border border-slate-200 shadow-xs">
                {product.subCategory}
              </span>
            )}
            {product.discountPercent > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[10px] font-bold tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                -{product.discountPercent}%
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl backdrop-blur-md border transition-all z-10 ${
              isWishlisted
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-white/90 text-slate-700 border-slate-200 hover:text-slate-950 hover:bg-white shadow-xs'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Version / Download Info Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] sm:text-[11px] text-slate-700 z-10">
            {product.version && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm border border-slate-200 shadow-xs font-medium">
                {product.version}
              </span>
            )}
            {product.downloadSize && (
              <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm border border-slate-200 shadow-xs ml-auto font-medium">
                <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                {product.downloadSize}
              </span>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-2 cursor-pointer" onClick={() => onSelect(product)}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider truncate max-w-[100px]">
              {product.category}
            </span>
            {product.rating ? (
              <div className="flex items-center gap-0.5 sm:gap-1 text-amber-500 text-[10px] sm:text-xs font-semibold">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                <span>{product.rating}</span>
              </div>
            ) : null}
          </div>

          <h3 className="font-bold text-xs sm:text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed hidden min-[360px]:block">
            {product.shortDescription}
          </p>

          <div className="pt-0.5">
            <span className="text-[8px] sm:text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-emerald-200/80 inline-flex items-center gap-0.5 sm:gap-1">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 fill-emerald-600" />
              <span>Instant Access</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="p-2.5 sm:p-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-sm sm:text-lg font-bold font-mono text-slate-900">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-mono hidden min-[380px]:inline">₹{product.originalPrice}</span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => onAddToCart(product)}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[30px] min-w-[30px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center cursor-pointer"
            title="Add to Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            disabled={!isOnline}
            onClick={(e) => {
              if (!isOnline) {
                e.preventDefault();
                e.stopPropagation();
                alert("You’re offline. Please reconnect to the internet to purchase this product.");
                return;
              }
              onBuyNow(product);
            }}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold font-mono tracking-wide transition-all min-h-[30px] sm:min-h-[40px] flex items-center justify-center whitespace-nowrap cursor-pointer ${
              !isOnline
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isOnline ? 'BUY' : 'OFFLINE'}
          </button>
        </div>
      </div>
    </div>
  );
};
