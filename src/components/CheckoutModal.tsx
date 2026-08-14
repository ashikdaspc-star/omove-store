import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CartItem, Order } from '../types';
import { sendAdminOrderNotificationEmail } from '../utils/emailNotifier';
import { validateAndApplyCouponAsync, fetchAndCacheCoupons } from '../utils/couponManager';
import {
  X,
  Lock,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Printer,
  Tag,
  WifiOff,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useOnlineStatus } from './OfflineBanner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  discountAmount?: number;
  discountCode?: string;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
  onOpenInvoiceModal: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  discountAmount = 0,
  discountCode,
  onClearCart,
  onOrderSuccess,
  onOpenInvoiceModal
}) => {
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  // Customer WhatsApp Phone State
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Processing & Delivery State
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);
  const [paymentFailedNotice, setPaymentFailedNotice] = useState('');

  const handleGoToMyOrders = () => {
    onClose();
    navigate('/my-account?tab=orders');
  };

  const handleTriggerDownload = (googleDriveUrl?: string, fileUrl?: string, productName?: string) => {
    const targetUrl = googleDriveUrl || fileUrl;
    if (!targetUrl || targetUrl.trim() === '' || targetUrl === '#') {
      alert(`Google Drive download link for ${productName || 'this product'} is currently being prepared. Please check back under My Orders or contact support.`);
      return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Expandable Coupon State
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(discountAmount || 0);
  const [appliedCode, setAppliedCode] = useState<string>(discountCode || '');
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    if (discountAmount && discountAmount > 0) {
      setAppliedDiscount(discountAmount);
    }
    if (discountCode) {
      setAppliedCode(discountCode);
      setShowCouponInput(true);
    }
  }, [discountAmount, discountCode]);

  useEffect(() => {
    if (isOpen) {
      fetchAndCacheCoupons().catch(() => {});
    }
  }, [isOpen]);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const finalTotal = Math.max(0, Number((subtotal - appliedDiscount).toFixed(2)));

  // Phone Number Validation: 10-digit Indian Mobile Number
  const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
  const isPhoneValid = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
  const phoneErrorMessage =
    phoneTouched && !isPhoneValid
      ? cleanPhone.length < 10
        ? 'Please enter complete 10-digit mobile number'
        : 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9'
      : '';

  const handleApplyCouponCode = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponStatus({ valid: false, message: 'Please enter a coupon code.' });
      return;
    }

    setCouponStatus({ valid: true, message: 'Validating code...' });
    const res = await validateAndApplyCouponAsync(code, subtotal);
    if (res.valid) {
      setAppliedDiscount(res.discountAmount);
      setAppliedCode(res.coupon?.code || code.toUpperCase());
      setCouponStatus({ valid: true, message: res.message });
      setCouponInput('');
    } else {
      setCouponStatus({ valid: false, message: res.message });
    }
  };

  const handleRemoveCouponCode = () => {
    setAppliedDiscount(0);
    setAppliedCode('');
    setCouponStatus({ valid: true, message: 'Coupon removed.' });
    setTimeout(() => setCouponStatus(null), 3000);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);

    if (!isPhoneValid) {
      setPaymentFailedNotice('Please enter a valid 10-digit WhatsApp number to continue.');
      return;
    }

    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setPaymentFailedNotice('You are currently offline. Please reconnect to the internet to complete your order.');
      return;
    }

    if (!cart || cart.length === 0) {
      setPaymentFailedNotice('Your cart is empty. Please select a product to purchase.');
      return;
    }

    setIsProcessing(true);
    setPaymentFailedNotice('');

    const formattedPhone = `+91 ${cleanPhone}`;
    const generatedEmail = `wa_${cleanPhone}@omovestore.shop`;
    const generatedName = `WhatsApp Customer (${cleanPhone})`;

    try {
      const payload = {
        items: cart.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          price: it.product.price,
          quantity: it.quantity,
          fileSize: it.product.downloadSize || '45 MB',
          fileUrl: it.product.googleDriveUrl || it.product.fileUrl || '/api/downloads/setup',
          googleDriveUrl: it.product.googleDriveUrl || it.product.fileUrl || ''
        })),
        customerName: generatedName,
        customerEmail: generatedEmail,
        customerPhone: formattedPhone,
        paymentMethod: 'Razorpay UPI',
        couponCode: appliedCode || ''
      };

      let orderObj: Order | null = null;
      let rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.success && data.order) {
            orderObj = data.order;
            if (data.order.discount !== undefined) {
              setAppliedDiscount(data.order.discount);
            }
            if (data.razorpayKeyId) rzpKey = data.razorpayKeyId;
          } else {
            setPaymentFailedNotice(data.message || data.error || 'Failed to create order on server.');
            setIsProcessing(false);
            return;
          }
        } else {
          setPaymentFailedNotice('Server error creating order. Please try again.');
          setIsProcessing(false);
          return;
        }
      } catch (e) {
        setPaymentFailedNotice('Network error creating order. Please check your connection.');
        setIsProcessing(false);
        return;
      }

      if (!orderObj) {
        setPaymentFailedNotice('Failed to create order. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Zero-total 100% Coupon Order Transition
      if (orderObj.total <= 0) {
        const verifiedOrder: Order = {
          ...orderObj,
          paymentStatus: 'SUCCESS',
          status: 'completed',
          items: (orderObj.items || []).map((it: any) => ({
            ...it,
            licenseKey: it.licenseKey || `OMV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            downloadLimit: it.downloadLimit || 5,
            fileUrl: it.fileUrl || '/api/downloads/setup'
          }))
        };

        setCreatedOrder(verifiedOrder);
        onOrderSuccess(verifiedOrder);
        onClearCart();
        sendAdminOrderNotificationEmail({
          type: 'PRODUCT_PURCHASE',
          customerName: generatedName,
          email: generatedEmail,
          phone: formattedPhone,
          title: (verifiedOrder.items || []).map((i: any) => i.productName || i.name || 'Digital Item').join(', ') || 'Digital Product',
          amount: 0,
          paymentId: 'FREE (100% Coupon Discount)',
          orderOrBookingId: verifiedOrder.orderNumber || orderObj.orderNumber
        });
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setIsProcessing(false);
        return;
      }

      // Paid Order via Official Razorpay Checkout Modal
      if (typeof (window as any).Razorpay === 'undefined') {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }

      if (typeof (window as any).Razorpay !== 'undefined') {
        const serverRzpOrderId = (orderObj as any)?.razorpayOrderId;
        if (!serverRzpOrderId || !serverRzpOrderId.startsWith('order_')) {
          setPaymentFailedNotice('Failed to initialize secure Razorpay order from payment gateway. Please try again.');
          setIsProcessing(false);
          return;
        }

        const serverTotal = orderObj.total;
        setIsProcessing(false);

        const options = {
          key: rzpKey,
          amount: Math.round(serverTotal * 100),
          currency: 'INR',
          name: 'OMOVE STORE',
          description: `Order ${orderObj.orderNumber} - Instant Access`,
          order_id: serverRzpOrderId,
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
          prefill: {
            name: generatedName,
            email: generatedEmail,
            contact: formattedPhone
          },
          theme: { color: '#0ea5e9' },
          handler: async function (response: any) {
            setIsProcessing(true);
            setPaymentFailedNotice('');
            try {
              const verifyRes = await fetch('/api/orders/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderObj!.id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success && verifyData.verified) {
                const verifiedOrder = verifyData.order || orderObj;
                setCreatedOrder(verifiedOrder);
                onOrderSuccess(verifiedOrder);
                onClearCart();
                sendAdminOrderNotificationEmail({
                  type: 'PRODUCT_PURCHASE',
                  customerName: generatedName,
                  email: generatedEmail,
                  phone: formattedPhone,
                  title: (verifiedOrder.items || []).map((i: any) => i.productName || i.name).join(', ') || 'Digital Product',
                  amount: verifiedOrder.total || verifiedOrder.totalAmount || serverTotal,
                  paymentId: response.razorpay_payment_id || 'VERIFIED',
                  orderOrBookingId: verifiedOrder.orderNumber || orderObj!.orderNumber
                });
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
              } else {
                setPaymentFailedNotice(verifyData.message || verifyData.error || 'Server payment verification failed. Access denied.');
              }
            } catch (vErr) {
              setPaymentFailedNotice('Payment verification network error. Access denied.');
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          }
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.open();
      } else {
        setPaymentFailedNotice('Razorpay payment gateway SDK unavailable. Please check your internet connection.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Razorpay process error:', err);
      setPaymentFailedNotice('Failed to process payment. Please check your internet connection.');
      setIsProcessing(false);
    }
  };

  const handleCopyKey = (key: string, idx: number) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyIndex(idx);
    setTimeout(() => setCopiedKeyIndex(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white font-sans tracking-tight">
                {createdOrder ? 'ORDER COMPLETED' : 'Secure Checkout'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {createdOrder ? 'Instant Delivery Ready' : 'Complete your order in seconds'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdOrder ? (
          /* Final Delivery / Output Page View */
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Payment Successful!</h3>
              <p className="text-xs text-slate-300">
                Order <strong className="font-mono text-cyan-400">{createdOrder.orderNumber}</strong> processed. Your digital downloads and order details are ready below.
              </p>
            </div>

            {/* Products & Delivery Box */}
            <div className="space-y-3">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                Purchased Items & Next Steps
              </h4>

              {createdOrder.items.map((item, idx) => {
                const hasDownloadLink = Boolean(item.googleDriveUrl || item.fileUrl);
                const itemWhatsappUrl = `https://wa.me/918345968169?text=${encodeURIComponent(
                  `Hi, I have completed the payment for ${item.productName}. My Order ID is #${createdOrder.orderNumber || createdOrder.id}.`
                )}`;

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <h5 className="font-bold text-xs text-white truncate">{item.productName}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {hasDownloadLink ? `Digital Download • Size: ${item.fileSize || 'Instant Access'}` : 'Store Product • WhatsApp Order'}
                      </span>
                    </div>

                    {hasDownloadLink ? (
                      <button
                        type="button"
                        onClick={() => handleTriggerDownload(item.googleDriveUrl, item.fileUrl, item.productName)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-emerald-600/20 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    ) : (
                      <a
                        href={itemWhatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-emerald-600/20 shrink-0 transition-transform hover:scale-105"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white" />
                        <span>Contact on WhatsApp</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* General Post-Payment WhatsApp Contact Banner for Store Items */}
            {createdOrder.items.some((i) => !i.googleDriveUrl && !i.fileUrl) && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                  <span>Next Step: Connect on WhatsApp</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your payment has been confirmed. Click below to contact Omove Store on WhatsApp with your Order ID (<strong className="text-cyan-400 font-mono">#{createdOrder.orderNumber || createdOrder.id}</strong>) for instant assistance.
                </p>
                <a
                  href={`https://wa.me/918345968169?text=${encodeURIComponent(
                    `Hi, I have completed the payment for ${createdOrder.items.map((i) => i.productName).join(', ')}. My Order ID is #${createdOrder.orderNumber || createdOrder.id}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01]"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>CONTACT ON WHATSAPP</span>
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => onOpenInvoiceModal(createdOrder)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono flex items-center gap-2 border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>PRINT INVOICE</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoToMyOrders}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>My Orders</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Redesigned Minimal Checkout Form */
          <form onSubmit={handleProcessPayment} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
            
            {!isOnline && (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center gap-2 shadow-lg">
                <WifiOff className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <span>You are offline. Reconnect to complete purchase.</span>
              </div>
            )}

            {paymentFailedNotice && (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center gap-2 shadow-lg">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{paymentFailedNotice}</span>
              </div>
            )}

            {/* Product & Order Summary Section (Compact) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                  Order Summary
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-slate-200 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-mono text-slate-300 shrink-0 font-bold">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}

              {appliedDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400 font-mono font-bold pt-1 border-t border-slate-800/60">
                  <span>Discount ({appliedCode || 'PROMO'})</span>
                  <span>-₹{appliedDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-300">Total Payable</span>
                <span className="font-mono text-cyan-400 text-base font-extrabold">
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* WhatsApp Number Section (Mandatory Single Field) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Number *</span>
              </label>

              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-slate-400 text-xs font-mono font-bold border-r border-slate-800 pr-2">
                  <span className="text-emerald-400">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="Enter 10-digit WhatsApp number"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (!phoneTouched) setPhoneTouched(true);
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  className={`w-full pl-20 pr-3.5 py-3 rounded-2xl bg-slate-950 border text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition-colors ${
                    phoneTouched && !isPhoneValid
                      ? 'border-rose-500/80 focus:border-rose-500'
                      : isPhoneValid
                      ? 'border-emerald-500/60 focus:border-emerald-500'
                      : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
              </div>

              {phoneErrorMessage ? (
                <p className="text-[11px] text-rose-400 font-mono">{phoneErrorMessage}</p>
              ) : (
                <p className="text-[10px] text-slate-400 font-mono leading-tight">
                  Your order details and instant delivery information will be sent to this WhatsApp number.
                </p>
              )}
            </div>

            {/* Expandable Promo Coupon Section */}
            <div className="pt-1">
              {!showCouponInput ? (
                <button
                  type="button"
                  onClick={() => setShowCouponInput(true)}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold transition-colors"
                >
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Have a coupon code?</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-400" />
                      <span>Apply Promo Coupon</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCouponInput(false)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCouponCode()}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs transition-all active:scale-95"
                    >
                      APPLY
                    </button>
                    {appliedCode && (
                      <button
                        type="button"
                        onClick={handleRemoveCouponCode}
                        className="px-2.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold"
                      >
                        REMOVE
                      </button>
                    )}
                  </div>

                  {couponStatus && (
                    <div className={`p-2 rounded-xl border text-[11px] font-mono ${
                      couponStatus.valid ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                    }`}>
                      {couponStatus.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Submit CTA */}
            <button
              type="submit"
              disabled={isProcessing || !isOnline || (!isPhoneValid && phoneTouched)}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-xs font-mono tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all ${
                !isOnline || (!isPhoneValid && phoneTouched)
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 hover:scale-[1.01] active:scale-95'
              }`}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-4 h-4 text-rose-400" />
                  <span>YOU ARE OFFLINE</span>
                </>
              ) : isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>INITIALIZING PAYMENT...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-cyan-200" />
                  <span>
                    {finalTotal <= 0
                      ? 'GET INSTANT ACCESS'
                      : `PAY ₹${finalTotal.toFixed(2)} & GET INSTANT ACCESS`}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Razorpay 256-Bit SSL Encrypted Payment</span>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
