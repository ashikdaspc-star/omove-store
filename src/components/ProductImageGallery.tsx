import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, Eye } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  isEbook?: boolean;
  className?: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  productName,
  isEbook = false,
  className = ''
}) => {
  // Filter and normalize valid images
  const validImages = React.useMemo(() => {
    const list = images.filter((img) => typeof img === 'string' && img.trim().length > 0);
    if (list.length === 0) {
      return ['/logo.png'];
    }
    return Array.from(new Set(list));
  }, [images, isEbook]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Touch Swipe State for Mobile
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  // Thumbnail container ref for auto-scrolling
  const thumbnailsRef = useRef<HTMLDivElement | null>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement | null>(null);

  const total = validImages.length;
  const hasMultiple = total > 1;

  const goToNext = useCallback(() => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [hasMultiple, total]);

  const goToPrev = useCallback(() => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [hasMultiple, total]);

  const selectIndex = useCallback((index: number) => {
    if (index >= 0 && index < total) {
      setCurrentIndex(index);
    }
  }, [total]);

  // Scroll active thumbnail into view when index changes
  useEffect(() => {
    if (activeThumbnailRef.current && thumbnailsRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, isLightboxOpen]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultiple) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Only treat as horizontal swipe if horizontal displacement > vertical displacement
    if (Math.abs(diffX) > Math.abs(diffY)) {
      touchDeltaXRef.current = diffX;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;
    const deltaX = touchDeltaXRef.current;
    const threshold = 40; // minimum swipe distance

    if (deltaX < -threshold) {
      goToNext();
    } else if (deltaX > threshold) {
      goToPrev();
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const currentImage = validImages[currentIndex] || validImages[0];

  return (
    <div className={`product-gallery w-full max-w-full space-y-3 font-sans select-none ${className}`}>
      
      {/* ========================================================================= */}
      {/* MAIN PRODUCT IMAGE CONTAINER */}
      {/* ========================================================================= */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-slate-50/95 border border-slate-200/90 group shadow-xs transition-all duration-200 hover:border-slate-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main Display Box with fixed proportional height preventing layout shift */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="relative w-full flex items-center justify-center p-3 sm:p-5 lg:p-6 cursor-zoom-in h-[220px] min-[360px]:h-[245px] sm:h-[300px] md:h-[340px] lg:h-[380px] xl:h-[400px] max-w-full overflow-hidden"
          role="button"
          tabIndex={0}
          aria-label={`View full size preview of ${productName} (Image ${currentIndex + 1} of ${total})`}
        >
          <img
            key={currentImage}
            src={currentImage}
            alt={`${productName} - Preview ${currentIndex + 1}`}
            className="w-auto h-auto max-w-[85%] sm:max-w-[90%] max-h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02] shadow-xs"
            loading="eager"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.png';
            }}
          />

          {/* Quick Zoom Pill Button (Desktop Hover / Mobile corner) */}
          <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity duration-200 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium shadow-md">
              <ZoomIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zoom</span>
            </span>
          </div>

          {/* Image Counter Glass Badge */}
          {hasMultiple && (
            <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
              <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-950/65 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold font-mono tracking-tight shadow-md border border-white/10">
                {currentIndex + 1} / {total}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Arrows (Shown on hover for desktop, tap-friendly for mobile) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 sm:opacity-0 sm:-translate-x-2'
              } group-hover:opacity-100 group-hover:translate-x-0`}
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 sm:opacity-0 sm:translate-x-2'
              } group-hover:opacity-100 group-hover:translate-x-0`}
              aria-label="Next Image"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            </button>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* HORIZONTAL THUMBNAIL STRIP */}
      {/* ========================================================================= */}
      {hasMultiple && (
        <div
          ref={thumbnailsRef}
          className="w-full flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 max-w-full min-w-0 box-border scroll-smooth"
        >
          {validImages.map((imgUrl, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                ref={isSelected ? activeThumbnailRef : null}
                type="button"
                onClick={() => selectIndex(idx)}
                className={`relative shrink-0 rounded-xl overflow-hidden bg-slate-50 border-2 transition-all duration-200 cursor-pointer p-1 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-[68px] lg:h-[68px] ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-sm opacity-100 scale-102 bg-emerald-50/20'
                    : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                }`}
                aria-label={`Select Image ${idx + 1}`}
                aria-current={isSelected ? 'true' : 'false'}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain rounded-md"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN LIGHTBOX / HIGH-RES PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Product Image Preview Lightbox"
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col items-center justify-between rounded-2xl bg-slate-900/90 border border-white/10 p-3 sm:p-5 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Lightbox Bar */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 text-white shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                  {productName}
                </h3>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {hasMultiple && (
                  <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                    {currentIndex + 1} / {total}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Lightbox Image View */}
            <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4 min-h-[260px] max-h-[65vh] overflow-hidden my-auto">
              <img
                key={currentImage}
                src={currentImage}
                alt={`${productName} High-Res View`}
                className="w-auto h-auto max-w-full max-h-[62vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
              />

              {/* Lightbox Prev / Next Arrows */}
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrev();
                    }}
                    className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 shadow-lg cursor-pointer transition-all active:scale-95"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 shadow-lg cursor-pointer transition-all active:scale-95"
                    aria-label="Next Image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Lightbox Thumbnails Strip */}
            {hasMultiple && (
              <div className="w-full pt-3 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none shrink-0 py-1">
                {validImages.map((imgUrl, idx) => {
                  const isSelected = idx === currentIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectIndex(idx)}
                      className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer p-0.5 w-11 h-11 sm:w-13 sm:h-13 ${
                        isSelected
                          ? 'border-emerald-400 ring-2 ring-emerald-400/40 opacity-100 scale-105'
                          : 'border-white/20 opacity-50 hover:opacity-100'
                      }`}
                      aria-label={`Go to preview ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Lightbox thumb ${idx + 1}`}
                        className="w-full h-full object-contain rounded"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
