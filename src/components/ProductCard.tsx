import React from 'react';
import { Product } from '../types';
import { Star, Download, ShieldCheck, Heart, ShoppingBag, Zap, Check } from 'lucide-react';

import { useOnlineStatus } from './OfflineBanner';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist
}) => {
  const isOnline = useOnlineStatus();

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-emerald-500/40 transition-all duration-300 shadow-xs hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col justify-between">
      <div>
        {/* Thumbnail & Badges */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(product)}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
              {product.category}
            </span>
            {product.isBestSeller && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs">
                BESTSELLER
              </span>
            )}
            {product.discountPercent > 0 && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider bg-emerald-500 text-white shadow-xs">
                -{product.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border transition-all z-10 ${
              isWishlisted
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-white/80 text-slate-700 border-slate-200 hover:text-slate-950 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Version & Size overlay (Only for non-store digital items if present) */}
          {product.productType !== 'STORE' && (product.version || product.downloadSize) && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white z-10">
              {product.version && (
                <span className="px-2 py-0.5 rounded bg-slate-950/70 backdrop-blur-sm">
                  {product.version}
                </span>
              )}
              {product.downloadSize && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/70 backdrop-blur-sm">
                  <Download className="w-3 h-3 text-emerald-400" />
                  {product.downloadSize}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3 cursor-pointer" onClick={() => onSelect(product)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating}</span>
              <span className="text-slate-400">({product.reviewCount})</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {product.licenseType}
            </span>
          </div>

          <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Key Feature Bullets */}
          <ul className="space-y-1 text-[11px] text-slate-600 pt-1">
            {(product.features || []).slice(0, 2).map((feat, idx) => (
              <li key={idx} className="flex items-center gap-1.5 line-clamp-1">
                <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{feat}</span>
              </li>
            ))}
          </ul>

          {/* 100% Refund Guarantee Badge */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-lg flex items-center gap-1.5 leading-tight">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>100% Refund Guarantee (2–3 Days)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-slate-900">₹{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through font-mono">₹{product.originalPrice}</span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
            <Zap className="w-3 h-3 fill-emerald-600 animate-pulse" />
            Instant Access your product
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddToCart(product)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
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
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide transition-all min-h-[44px] flex items-center justify-center whitespace-nowrap ${
              !isOnline
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:scale-105 active:scale-95'
            }`}
          >
            {isOnline ? 'BUY NOW' : 'OFFLINE — BUY UNAVAILABLE'}
          </button>
        </div>
      </div>
    </div>
  );
};
