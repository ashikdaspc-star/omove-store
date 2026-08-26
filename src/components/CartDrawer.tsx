import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, Tag, ShieldCheck, ArrowRight, ShoppingBag, WifiOff } from 'lucide-react';
import { validateAndApplyCoupon, validateAndApplyCouponAsync } from '../utils/couponManager';
import { useOnlineStatus } from './OfflineBanner';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onOpenCheckout: (discountCode?: string, discountAmount?: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onOpenCheckout
}) => {
  const isOnline = useOnlineStatus();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validating, setValidating] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidating(true);
    setCouponError('');

    const result = await validateAndApplyCouponAsync(couponInput, subtotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon({
        code: result.coupon.code,
        discountAmount: result.discountAmount,
        message: result.message
      });
      setCouponInput('');
    } else {
      setCouponError(result.message);
    }
    setValidating(false);
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const taxAmount = 0;
  const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl relative font-sans">
        {/* Cart Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Your Digital Cart</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-sm">Your cart is empty</p>
                <p className="text-xs text-slate-500 mt-1">Explore our store for digital assets and downloads.</p>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">
                    {item.product.category}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h4>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-slate-900">₹{item.product.price}</span>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:text-slate-900 text-slate-500 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1 text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:text-slate-900 text-slate-500 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
            {/* Coupon Form */}
            {appliedCoupon ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>Coupon <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discountPercent}% OFF)</span>
                </div>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code (e.g. OMOVE20)..."
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 uppercase placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={validating}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  {validating ? 'Checking...' : 'Apply'}
                </button>
              </form>
            )}

            {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-emerald-700 font-extrabold">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={!isOnline}
              onClick={() => {
                if (!isOnline) {
                  alert("You’re offline. Please reconnect to the internet to purchase this product.");
                  return;
                }
                onOpenCheckout(appliedCoupon?.code, discountAmount);
              }}
              className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                !isOnline
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-98'
              }`}
            >
              <span>{isOnline ? 'PROCEED TO SECURE CHECKOUT' : 'OFFLINE — CHECKOUT UNAVAILABLE'}</span>
              {isOnline ? <ArrowRight className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-rose-600" />}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified • Instant Google Drive Delivery</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
