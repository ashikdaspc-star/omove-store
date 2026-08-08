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
}

export const DigitalProductCard: React.FC<DigitalProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist
}) => {
  const isOnline = useOnlineStatus();

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-emerald-500/40 transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between">
      <div>
        {/* Thumbnail & Digital Badge */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(product)}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-50" />

          {/* Digital Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
              DIGITAL PRODUCT
            </span>
            {product.discountPercent > 0 && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider bg-slate-900 text-emerald-300 border border-emerald-500/30">
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
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border transition-all z-10 ${
              isWishlisted
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-white/80 text-slate-700 border-slate-200 hover:text-slate-950 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Version / Download Info Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white z-10">
            <span className="px-2 py-0.5 rounded bg-slate-950/70 backdrop-blur-sm">
              {product.version}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/70 backdrop-blur-sm">
              <Download className="w-3 h-3 text-emerald-400" />
              {product.downloadSize}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-2 cursor-pointer" onClick={() => onSelect(product)}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating}</span>
            </div>
          </div>

          <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          <div className="pt-1">
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/80 inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
              <span>Instant Access After Purchase</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono text-slate-900">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-slate-400 line-through font-mono">₹{product.originalPrice}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddToCart(product)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono tracking-wide transition-all min-h-[40px] flex items-center justify-center whitespace-nowrap ${
              !isOnline
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isOnline ? 'BUY NOW' : 'OFFLINE — BUY UNAVAILABLE'}
          </button>
        </div>
      </div>
    </div>
  );
};
