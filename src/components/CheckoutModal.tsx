import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CartItem, Order } from '../types';
import { sendAdminOrderNotificationEmail } from '../utils/emailNotifier';
import { validateAndApplyCoupon, validateAndApplyCouponAsync, fetchAndCacheCoupons } from '../utils/couponManager';
import {
  X,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  Lock,
  CheckCircle2,
  Download,
  Copy,
  Check,
  FileText,
  Zap,
  Printer,
  Phone,
  Tag,
  WifiOff,
  AlertTriangle
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

  const [paymentMethod, setPaymentMethod] = useState<'Razorpay UPI' | 'Credit / Debit Card' | 'NetBanking' | 'Wallet'>('Razorpay UPI');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);
  const [showTestGateway, setShowTestGateway] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [simulatingSuccess, setSimulatingSuccess] = useState(false);
  const [paymentFailedNotice, setPaymentFailedNotice] = useState('');

  // Coupon state inside Checkout Modal
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
    }
  }, [discountAmount, discountCode]);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const taxAmount = 0;
  const finalTotal = Math.max(0, Number((subtotal - appliedDiscount).toFixed(2)));

  useEffect(() => {
    if (isOpen) {
      fetchAndCacheCoupons().catch(() => {});
    }
  }, [isOpen]);

  const handleApplyCouponCode = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponStatus({ valid: false, message: 'Please enter a promo coupon code.' });
      return;
    }

    setCouponStatus({ valid: true, message: 'Validating coupon...' });
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

  if (!isOpen) return null;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setPaymentFailedNotice('You are currently offline. Please reconnect to the internet to purchase this product.');
      return;
    }

    setIsProcessing(true);
    setPaymentFailedNotice('');

    try {
      const payload = {
        items: cart.map((it) => ({ productId: it.product.id, quantity: it.quantity })),
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        discountAmount: appliedDiscount
      };

      let orderObj: Order | null = null;
      let rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G';

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
            if (data.razorpayKeyId) rzpKey = data.razorpayKeyId;
          }
        }
      } catch (e) {
        console.warn('Backend order creation notice:', e);
      }

      if (!orderObj) {
        const orderId = `ord-${Date.now()}`;
        const orderNumber = `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        orderObj = {
          id: orderId,
          orderNumber: orderNumber,
          customerName: customerName || 'Customer',
          customerEmail: customerEmail || 'customer@omovestore.shop',
          customerPhone: customerPhone || '',
          items: cart.map((it) => ({
            productId: it.product.id,
            productName: it.product.name,
            price: it.product.price,
            quantity: it.quantity,
            licenseKey: `OMV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            downloadLimit: 5,
            downloadsCount: 0,
            fileSize: it.product.downloadSize || '45 MB',
            fileUrl: it.product.fileUrl || '/api/downloads/setup'
          })),
          subtotal: subtotal,
          discount: appliedDiscount,
          tax: taxAmount,
          total: finalTotal,
          paymentMethod: paymentMethod || 'Razorpay UPI',
          paymentStatus: finalTotal <= 0 ? 'SUCCESS' : 'PENDING',
          createdAt: new Date().toISOString()
        };
      }

      // Zero-total 100% coupon order verification
      if (orderObj.total <= 0) {
        const verifyRes = await fetch('/api/orders/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderObj.id })
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success && verifyData.verified) {
          const verifiedOrder = verifyData.order;
          setCreatedOrder(verifiedOrder);
          onOrderSuccess(verifiedOrder);
          onClearCart();
          sendAdminOrderNotificationEmail({
            type: 'PRODUCT_PURCHASE',
            customerName: verifiedOrder.customerName,
            email: verifiedOrder.customerEmail,
            phone: verifiedOrder.customerPhone,
            title: verifiedOrder.items.map((i: any) => i.productName).join(', '),
            amount: 0,
            paymentId: 'FREE (100% Coupon Discount)',
            orderOrBookingId: verifiedOrder.orderNumber
          });
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } else {
          setPaymentFailedNotice(verifyData.error || 'Coupon order verification failed.');
        }
        setIsProcessing(false);
        return;
      }

      // Paid Order via Razorpay Checkout Modal
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
        const options = {
          key: rzpKey,
          amount: Math.round(orderObj.total * 100),
          currency: 'INR',
          name: 'OMOVE TECH',
          description: `Order ${orderObj.orderNumber} - Digital Products`,
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
          },
          theme: { color: '#059669' },
          handler: async function (response: any) {
            setIsProcessing(true);
            try {
              const verifyRes = await fetch('/api/orders/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderObj.id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success && verifyData.verified) {
                const verifiedOrder = verifyData.order;
                setCreatedOrder(verifiedOrder);
                onOrderSuccess(verifiedOrder);
                onClearCart();
                sendAdminOrderNotificationEmail({
                  type: 'PRODUCT_PURCHASE',
                  customerName: verifiedOrder.customerName,
                  email: verifiedOrder.customerEmail,
                  phone: verifiedOrder.customerPhone,
                  title: verifiedOrder.items.map((i: any) => i.productName).join(', '),
                  amount: verifiedOrder.total,
                  paymentId: verifiedOrder.razorpayPaymentId,
                  orderOrBookingId: verifiedOrder.orderNumber
                });
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
              } else {
                setPaymentFailedNotice(verifyData.error || 'Server payment verification failed. Access denied.');
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmTestPayment = () => {
    setSimulatingSuccess(true);
    setTimeout(() => {
      if (pendingOrder) {
        setCreatedOrder(pendingOrder);
        onOrderSuccess(pendingOrder);
        onClearCart();
        sendAdminOrderNotificationEmail({
          type: 'PRODUCT_PURCHASE',
          customerName: pendingOrder.customerName,
          email: pendingOrder.customerEmail,
          phone: pendingOrder.customerPhone,
          title: pendingOrder.items.map((i) => i.productName).join(', '),
          amount: pendingOrder.total,
          paymentId: pendingOrder.razorpayPaymentId || 'TEST_SIMULATED',
          orderOrBookingId: pendingOrder.orderNumber
        });
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      setSimulatingSuccess(false);
      setShowTestGateway(false);
    }, 1000);
  };

  const handleCopyKey = (key: string, idx: number) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyIndex(idx);
    setTimeout(() => setCopiedKeyIndex(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-mono">
                {createdOrder ? 'ORDER COMPLETED' : 'RAZORPAY SECURE CHECKOUT'}
              </h3>
              <p className="text-[10px] text-slate-400">256-Bit SSL Encrypted Payment Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Gateway Screen */}
        {showTestGateway ? (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-mono text-[10px] font-bold tracking-wider uppercase">
                    RAZORPAY TEST GATEWAY
                  </span>
                  <span className="text-[11px] text-indigo-300 font-mono">Interactive Demo Mode</span>
                </div>
                <span className="text-xl font-mono font-extrabold text-cyan-400">₹{finalTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-300">
                Simulating secure payment gateway transaction. Click below to verify payment and receive your digital license keys.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                <span>Customer Name</span>
                <span className="text-white font-bold">{customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                <span>Payment Method</span>
                <span className="text-indigo-400 font-bold">{paymentMethod}</span>
              </div>
              {paymentMethod === 'Razorpay UPI' && (
                <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                  <span>UPI VPA ID</span>
                  <span className="text-cyan-300">{upiVpa}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Order Reference</span>
                <span className="text-slate-300">{pendingOrder?.orderNumber}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmTestPayment}
                disabled={simulatingSuccess}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-slate-950 font-extrabold text-sm font-mono tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {simulatingSuccess ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>AUTHENTICATING TEST PAYMENT...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>COMPLETE SIMULATED PAYMENT (₹{finalTotal.toFixed(2)})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowTestGateway(false)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
              >
                CANCEL & RETURN TO CHECKOUT
              </button>
            </div>
          </div>
        ) : createdOrder ? (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Payment Successful!</h3>
              <p className="text-xs text-slate-300">
                Order <strong className="font-mono text-cyan-400">{createdOrder.orderNumber}</strong> has been processed. Your software license keys are generated below and sent to{' '}
                <strong className="text-white">{createdOrder.customerEmail}</strong>.
              </p>
            </div>

            {/* License Keys & Downloads Box */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                Your Digital Products & License Keys
              </h4>

              {createdOrder.items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-white">{item.productName}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">Size: {item.fileSize}</span>
                    </div>
                    <a
                      href={item.fileUrl}
                      download
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Now</span>
                    </a>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase text-slate-500 font-bold block">License Activation Key</span>
                      <span className="font-mono font-bold text-xs text-indigo-300 select-all truncate block">
                        {item.licenseKey}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyKey(item.licenseKey, idx)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1"
                    >
                      {copiedKeyIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Print Invoice Button */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <button
                onClick={() => onOpenInvoiceModal(createdOrder)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono flex items-center gap-2 border border-slate-700"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>VIEW / PRINT OFFICIAL INVOICE (PDF)</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono"
              >
                CLOSE WINDOW
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleProcessPayment} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {!isOnline && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center gap-2.5 shadow-lg animate-fadeIn">
                <WifiOff className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                <div>
                  <strong className="block text-rose-300 font-bold">You are currently offline</strong>
                  <span className="text-[11px] text-rose-200">Please reconnect to the internet to purchase this product.</span>
                </div>
              </div>
            )}

            {paymentFailedNotice && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center gap-2.5 shadow-lg animate-fadeIn">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{paymentFailedNotice}</span>
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                Customer Information
              </h4>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                Select Razorpay Payment Method
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'Razorpay UPI', label: 'UPI / QR', icon: Smartphone },
                  { id: 'Credit / Debit Card', label: 'Cards', icon: CreditCard },
                  { id: 'NetBanking', label: 'NetBanking', icon: Building },
                  { id: 'Wallet', label: 'Wallet', icon: Wallet }
                ].map((pm) => {
                  const Icon = pm.icon;
                  const selected = paymentMethod === pm.id;
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3 rounded-2xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                        selected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${selected ? 'text-cyan-400' : ''}`} />
                      <span className="text-[11px] font-bold font-mono">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Promo Coupon Apply Section */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Apply Promo Coupon</span>
                </h4>
                {appliedCode && (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Code '{appliedCode}' Active (-₹{appliedDiscount})
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER COUPON CODE (e.g. OMOVE15)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCouponCode()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-xs shadow-md shadow-amber-500/20 shrink-0 transition-all active:scale-95"
                >
                  APPLY
                </button>
                {appliedCode && (
                  <button
                    type="button"
                    onClick={handleRemoveCouponCode}
                    className="px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition-all"
                  >
                    REMOVE
                  </button>
                )}
              </div>

              {couponStatus && (
                <div className={`p-2.5 rounded-xl border text-xs font-mono ${
                  couponStatus.valid ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                }`}>
                  {couponStatus.message}
                </div>
              )}
            </div>

            {/* Order Total Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-mono text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-mono font-bold">
                  <span>Coupon Discount ({appliedCode || 'PROMO'})</span>
                  <span>-₹{appliedDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Payable</span>
                <span className="font-mono text-cyan-400 text-base">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* 100% Refund Guarantee */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-400 font-bold block text-xs">100% Refund Guarantee</strong>
                <span className="text-[11px] text-slate-300 leading-snug block mt-0.5">
                  If we're unable to resolve your issue, your payment will be automatically refunded within 2–3 business days.
                </span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isProcessing || !isOnline}
              className={`w-full py-4 rounded-2xl font-extrabold text-sm font-mono tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all ${
                !isOnline
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-600/30 hover:scale-[1.01] disabled:opacity-50'
              }`}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-4 h-4 text-rose-400" />
                  <span>YOU ARE OFFLINE — PURCHASES DISABLED</span>
                </>
              ) : isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>VERIFYING RAZORPAY TRANSACTION...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>PAY ₹{finalTotal.toFixed(2)} & GET INSTANT KEYS</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
