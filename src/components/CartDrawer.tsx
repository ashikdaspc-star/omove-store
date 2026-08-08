import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, Tag, ShieldCheck, ArrowRight, ShoppingBag, WifiOff } from 'lucide-react';
import { validateAndApplyCoupon } from '../utils/couponManager';
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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidating(true);
    setCouponError('');

    const result = validateAndApplyCoupon(couponInput, subtotal);
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl relative">
        {/* Cart Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg text-white font-mono">Your Digital Cart</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600/30 text-indigo-300">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white font-semibold">Your cart is empty</p>
                <p className="text-xs text-slate-400 mt-1">Explore our store for instant software keys and tools.</p>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-4"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-indigo-400 font-mono">
                    {item.product.category}
                  </span>
                  <h4 className="font-bold text-xs text-white truncate">{item.product.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-sm font-bold text-white">₹{item.product.price}</span>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:text-white text-slate-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold px-1 text-white">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:text-white text-slate-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-2 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-800 bg-slate-950 space-y-4">
            {/* Coupon Form */}
            {appliedCoupon ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>Coupon <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discountPercent}% OFF)</span>
                </div>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-slate-400 hover:text-white text-[11px]"
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
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={validating}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono transition-colors"
                >
                  {validating ? 'Checking...' : 'Apply'}
                </button>
              </form>
            )}

            {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="font-mono text-cyan-400">₹{total.toFixed(2)}</span>
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
              className={`w-full py-3.5 rounded-xl font-bold text-xs font-mono tracking-wider flex items-center justify-center gap-2 transition-all ${
                !isOnline
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-98'
              }`}
            >
              <span>{isOnline ? 'PROCEED TO SECURE CHECKOUT' : 'OFFLINE — CHECKOUT UNAVAILABLE'}</span>
              {isOnline ? <ArrowRight className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Razorpay Verified • Instant License Key Delivery</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
