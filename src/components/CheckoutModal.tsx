import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CartItem, Order } from '../types';
import { sendAdminOrderNotificationEmail } from '../utils/emailNotifier';
import { validateAndApplyCouponAsync, fetchAndCacheCoupons } from '../utils/couponManager';
import { Country, getDefaultCountry, validatePhoneNumber } from '../utils/countryData';
import { InternationalPhoneInput } from './InternationalPhoneInput';
import { PaymentMethodCards } from './PaymentMethodCards';
import {
  X,
  Lock,
  CheckCircle2,
  Download,
  Printer,
  Tag,
  WifiOff,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useOnlineStatus } from './OfflineBanner';

// Custom Razorpay SVG Logo / Icon
const RazorpayIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.28 2.05L7.05 13.52h5.12L8.72 21.95l10.4-12.02h-5.46l3.62-7.88h-3z"
      fill="url(#rzp-blue-grad)"
    />
    <defs>
      <linearGradient id="rzp-blue-grad" x1="7" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
    </defs>
  </svg>
);

// Custom PayPal SVG Logo / Icon
const PaypalIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.802.802 0 0 1 .792-.67h6.634c2.81 0 4.885.666 5.845 1.877.944 1.192.983 2.872.115 5.002-1.077 2.645-3.084 4.095-5.965 4.31l-.226.012-.665 4.22-.054.34a.641.641 0 0 1-.633.526H7.076z"
      fill="#0079C1"
    />
    <path
      d="M8.765 17.575l1.04-6.597.185-.013c2.518-.187 4.272-1.455 5.216-3.768.761-1.867.728-3.339-.098-4.382-.843-1.062-2.658-1.646-5.118-1.646H5.736a.802.802 0 0 0-.792.67L2.47 20.597a.641.641 0 0 0 .633.74h4.606l1.056-3.762z"
      fill="#00457C"
      opacity="0.9"
    />
    <path
      d="M17.485 8.929c-.87 2.13-2.876 3.58-5.757 3.795l-.226.012-.86 5.464a.641.641 0 0 1-.633.526h-3.47l-.248 1.57a.641.641 0 0 0 .633.741h3.94a.802.802 0 0 0 .792-.67l.033-.175.748-4.743.048-.262a.802.802 0 0 1 .792-.67h.499c2.81 0 5.01-.987 5.953-3.303.785-1.928.618-3.568-.49-4.285z"
      fill="#0079C1"
    />
    <path
      d="M16.33 8.243c-.234 1.597-1.326 2.766-3.084 3.013l-.24.034-.666 4.22-.054.34a.641.641 0 0 1-.633.526H9.155l1.45-9.208.106-.015c2.195-.164 3.728-1.27 4.553-3.29.67-1.644.64-2.94-.086-3.856a3.54 3.54 0 0 0-1.57-.96 5.688 5.688 0 0 1 2.722 9.206z"
      fill="#002C6C"
      opacity="0.3"
    />
  </svg>
);

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

  // Customer International WhatsApp Phone State
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    cleanNumber: string;
    e164: string;
    country: Country;
  }>(() => {
    const def = getDefaultCountry();
    return { ...validatePhoneNumber('', def), country: def };
  });

  // Processing & Delivery State
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paymentFailedNotice, setPaymentFailedNotice] = useState('');

  // Payment Method State (Razorpay or PayPal)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'paypal'>('razorpay');
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const createdOrderRef = useRef<Order | null>(null);

  const handleGoToMyOrders = () => {
    onClose();
    navigate('/my-account?tab=orders');
  };

  const handleTriggerDownload = (googleDriveUrl?: string, fileUrl?: string, productName?: string, productId?: string) => {
    let targetUrl = googleDriveUrl || fileUrl;
    if (!targetUrl || targetUrl.trim() === '' || targetUrl === '#' || targetUrl === '/api/downloads/setup') {
      if (createdOrder) {
        targetUrl = `/api/downloads/setup?orderId=${encodeURIComponent(createdOrder.id || createdOrder.orderNumber)}&productId=${encodeURIComponent(productId || '')}`;
      }
    }
    if (!targetUrl || targetUrl.trim() === '' || targetUrl === '#') {
      alert(`Download package link for ${productName || 'this product'} is currently being prepared. Please check back under My Orders or contact support.`);
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
  const previewUsd = finalTotal > 0 ? finalTotal / 95 : 0;
  const previewUsdDisplay = previewUsd > 0 ? (Math.round(previewUsd * 100) / 100).toFixed(2) : '0.00';

  // Country-aware Phone Validation
  const isPhoneValid = phoneValidation.isValid;
  const normalizedE164 = phoneValidation.e164;
  const cleanDigits = phoneValidation.cleanNumber;
  const phoneErrorMessage =
    phoneTouched && !isPhoneValid
      ? 'Please enter a valid WhatsApp number for the selected country.'
      : '';

  const handlePhoneInputChange = (
    val: string,
    validation: { isValid: boolean; cleanNumber: string; e164: string; country: Country }
  ) => {
    setCustomerPhone(val);
    setPhoneValidation(validation);
  };

  const paypalStateRef = useRef({
    cart,
    phoneValidation,
    isPhoneValid,
    appliedCode,
    previewUsdDisplay
  });

  useEffect(() => {
    paypalStateRef.current = {
      cart,
      phoneValidation,
      isPhoneValid,
      appliedCode,
      previewUsdDisplay
    };
  }, [cart, phoneValidation, isPhoneValid, appliedCode, previewUsdDisplay]);

  // PayPal SDK Auto-Loader & Smart Button Renderer
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'paypal') {
      setPaypalReady(false);
      return;
    }

    let isCancelled = false;
    setPaypalLoading(true);

    async function initPayPal() {
      try {
        let ppConfig: any = null;
        try {
          const cfgRes = await fetch('/api/paypal/config');
          if (cfgRes.ok) {
            ppConfig = await cfgRes.json();
          }
        } catch (e) {}

        const activeClientId = ppConfig?.clientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || 'BAAq2PyxqOTR12C8YmU9N7Km0YSbwzwu4dOJHk4mmXV4GiCRQ1pS-IEROr24x4Tjej_Pzmnx24E51GSCIo';
        if (!activeClientId || isCancelled) return;

        // Check if script already in DOM with matching clientId
        const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]') as HTMLScriptElement | null;
        if (existingScript && !existingScript.src.includes(activeClientId)) {
          existingScript.remove();
          delete (window as any).paypal;
        }

        if (typeof (window as any).paypal === 'undefined') {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${activeClientId}&currency=USD&components=buttons&intent=capture`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('PayPal SDK script load error'));
            document.body.appendChild(script);
          });
        }

        if (isCancelled || typeof (window as any).paypal === 'undefined') return;

        const container = document.getElementById('paypal-button-container');
        if (!container) return;
        container.innerHTML = '';

        (window as any).paypal.Buttons({
          createOrder: async () => {
            const curr = paypalStateRef.current;
            if (!curr.isPhoneValid || !curr.phoneValidation.e164) {
              setPhoneTouched(true);
              setPaymentFailedNotice('Please enter a valid WhatsApp number for the selected country.');
              throw new Error('Valid WhatsApp number required');
            }

            setPaymentFailedNotice('');
            setIsProcessing(true);

            const e164Phone = curr.phoneValidation.e164;
            const cleanDigitsOnly = e164Phone.replace(/\D/g, '');
            const generatedEmail = `wa_${cleanDigitsOnly}@omovestore.shop`;
            const generatedName = `WhatsApp Customer (${e164Phone})`;

            const payload = {
              items: curr.cart.map((it) => {
                const isDig = it.product.productType === 'DIGITAL' || it.product.id?.startsWith('dig') || it.product.category === 'Digital Products';
                return {
                  productId: it.product.id,
                  productName: it.product.name,
                  productType: isDig ? ('DIGITAL' as const) : ('STORE' as const),
                  price: it.product.price,
                  quantity: it.quantity,
                  fileSize: isDig ? (it.product.downloadSize || 'Instant Access') : '',
                  fileUrl: isDig ? (it.product.googleDriveUrl || it.product.fileUrl || '/api/downloads/setup') : '',
                  googleDriveUrl: isDig ? (it.product.googleDriveUrl || it.product.fileUrl || '') : ''
                };
              }),
              customerName: generatedName,
              customerEmail: generatedEmail,
              customerPhone: e164Phone,
              couponCode: curr.appliedCode || ''
            };

            const createRes = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const createData = await createRes.json();
            if (!createRes.ok || !createData.success || !createData.paypalOrderId) {
              const errMsg = createData.message || createData.error || 'Failed to create PayPal order.';
              setPaymentFailedNotice(errMsg);
              setIsProcessing(false);
              throw new Error(errMsg);
            }

            createdOrderRef.current = createData.order;
            setIsProcessing(false);
            return createData.paypalOrderId;
          },
          onApprove: async (data: any) => {
            setIsProcessing(true);
            setPaymentFailedNotice('');
            try {
              const captureRes = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paypalOrderId: data.orderID })
              });
              const captureData = await captureRes.json();

              if (captureRes.ok && captureData.success && captureData.verified) {
                const verifiedOrder = captureData.order || createdOrderRef.current;
                setCreatedOrder(verifiedOrder);
                onOrderSuccess(verifiedOrder);
                onClearCart();
                const curr = paypalStateRef.current;
                const e164Phone = curr.phoneValidation.e164;
                const cleanDigitsOnly = e164Phone.replace(/\D/g, '');
                sendAdminOrderNotificationEmail({
                  type: 'PRODUCT_PURCHASE',
                  customerName: `WhatsApp Customer (${e164Phone})`,
                  email: `wa_${cleanDigitsOnly}@omovestore.shop`,
                  phone: e164Phone,
                  title: (verifiedOrder.items || []).map((i: any) => i.productName || i.name).join(', ') || 'Product',
                  amount: verifiedOrder.paymentAmountUsd || verifiedOrder.total || 0,
                  paymentId: `PayPal: ${data.orderID}`,
                  orderOrBookingId: verifiedOrder.orderNumber || createdOrderRef.current?.orderNumber
                });
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
              } else {
                setPaymentFailedNotice(captureData.message || captureData.error || 'PayPal payment verification failed.');
              }
            } catch (err: any) {
              setPaymentFailedNotice('PayPal payment capture network error.');
            } finally {
              setIsProcessing(false);
            }
          },
          onCancel: () => {
            setPaymentFailedNotice('PayPal checkout was cancelled.');
            setIsProcessing(false);
          },
          onError: (err: any) => {
            console.error('PayPal Button Error:', err);
            setPaymentFailedNotice('PayPal checkout encountered an issue. Please try again.');
            setIsProcessing(false);
          },
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 44
          }
        }).render('#paypal-button-container');

        if (!isCancelled) {
          setPaypalReady(true);
          setPaypalLoading(false);
        }
      } catch (e: any) {
        console.error('PayPal setup failed:', e);
        if (!isCancelled) {
          setPaypalLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      initPayPal();
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, paymentMethod]);

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

    if (!isPhoneValid || !normalizedE164) {
      setPaymentFailedNotice('Please enter a valid WhatsApp number for the selected country.');
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

    // ── Razorpay Flow (unchanged) ──
    if (paymentMethod === 'paypal') {
      // If PayPal is selected, PayPal smart buttons handle click directly
      return;
    }

    setIsProcessing(true);
    setPaymentFailedNotice('');

    const e164Phone = normalizedE164;
    const cleanDigitsOnly = e164Phone.replace(/\D/g, '');
    const generatedEmail = `wa_${cleanDigitsOnly}@omovestore.shop`;
    const generatedName = `WhatsApp Customer (${e164Phone})`;

    try {
      const payload = {
        items: cart.map((it) => {
          const isDig = it.product.productType === 'DIGITAL' || it.product.id?.startsWith('dig') || it.product.category === 'Digital Products';
          return {
            productId: it.product.id,
            productName: it.product.name,
            productType: isDig ? ('DIGITAL' as const) : ('STORE' as const),
            price: it.product.price,
            quantity: it.quantity,
            fileSize: isDig ? (it.product.downloadSize || 'Instant Access') : '',
            fileUrl: isDig ? (it.product.googleDriveUrl || it.product.fileUrl || '/api/downloads/setup') : '',
            googleDriveUrl: isDig ? (it.product.googleDriveUrl || it.product.fileUrl || '') : ''
          };
        }),
        customerName: generatedName,
        customerEmail: generatedEmail,
        customerPhone: e164Phone,
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
          items: (orderObj.items || []).map((it: any) => {
            const isDig = it.productType === 'DIGITAL' || it.productId?.startsWith('dig') || it.category === 'Digital Products';
            return {
              ...it,
              productType: isDig ? 'DIGITAL' : 'STORE',
              licenseKey: isDig ? (it.licenseKey || `OMV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`) : '',
              downloadLimit: isDig ? (it.downloadLimit || 5) : 0,
              fileUrl: isDig ? (it.fileUrl || '/api/downloads/setup') : '',
              googleDriveUrl: isDig ? (it.googleDriveUrl || '') : ''
            };
          })
        };

        setCreatedOrder(verifiedOrder);
        onOrderSuccess(verifiedOrder);
        onClearCart();
        sendAdminOrderNotificationEmail({
          type: 'PRODUCT_PURCHASE',
          customerName: generatedName,
          email: generatedEmail,
          phone: e164Phone,
          title: (verifiedOrder.items || []).map((i: any) => i.productName || i.name || 'Product').join(', ') || 'Product',
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
          description: `Order ${orderObj.orderNumber}`,
          order_id: serverRzpOrderId,
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
          prefill: {
            name: generatedName,
            email: generatedEmail,
            contact: e164Phone
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
                  phone: e164Phone,
                  title: (verifiedOrder.items || []).map((i: any) => i.productName || i.name).join(', ') || 'Product',
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

  const hasStoreItems = createdOrder?.items.some((i) => i.productType === 'STORE' || (!i.productType && !i.productId?.startsWith('dig'))) ?? false;
  const hasDigitalItems = createdOrder?.items.some((i) => i.productType === 'DIGITAL' || (!i.productType && i.productId?.startsWith('dig'))) ?? false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white">
                {createdOrder ? 'Order Completed' : 'Express Checkout'}
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {createdOrder ? `Order #${createdOrder.orderNumber || createdOrder.id}` : '100% Encrypted & Verified'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout modal"
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
                Order <strong className="font-mono text-cyan-400">#{createdOrder.orderNumber}</strong> processed successfully.{' '}
                {hasStoreItems && !hasDigitalItems
                  ? 'Your payment has been received. Contact us on WhatsApp to continue with your order setup.'
                  : hasDigitalItems && !hasStoreItems
                  ? 'Your digital download is ready below.'
                  : 'Your digital download and WhatsApp order details are ready below.'}
              </p>
            </div>

            {/* Products & Next Steps Box */}
            <div className="space-y-3">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                Purchased Product{createdOrder.items.length > 1 ? 's' : ''} & Next Steps
              </h4>

              {createdOrder.items.map((item, idx) => {
                const isDigitalItem = item.productType === 'DIGITAL' || (item.productId && item.productId.startsWith('dig'));
                const itemWhatsappUrl = `https://wa.me/918345968169?text=${encodeURIComponent(
                  `Hi, I have completed the payment for ${item.productName}. My Order ID is #${createdOrder.orderNumber || createdOrder.id}.`
                )}`;

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <h5 className="font-bold text-xs text-white truncate">{item.productName}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isDigitalItem
                          ? `Digital Product • ${item.fileSize || 'Instant Access'}`
                          : `Store Product • ₹${item.price.toFixed(2)}`}
                      </span>
                    </div>

                    {isDigitalItem ? (
                      <button
                        type="button"
                        onClick={() => handleTriggerDownload(item.googleDriveUrl, item.fileUrl, item.productName, item.productId)}
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
            {hasStoreItems && (
              <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                  <span>NEXT STEP: CONNECT ON WHATSAPP</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your payment has been received. Contact us on WhatsApp with your Order ID (<strong className="text-cyan-400 font-mono">#{createdOrder.orderNumber || createdOrder.id}</strong>) to proceed with your setup.
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
          <form onSubmit={handleProcessPayment} className="p-6 sm:p-7 space-y-5 max-h-[82vh] overflow-y-auto">
            
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

            {/* International WhatsApp Number Section */}
            <InternationalPhoneInput
              value={customerPhone}
              onChange={handlePhoneInputChange}
              touched={phoneTouched}
              onBlur={() => setPhoneTouched(true)}
              errorMessage={phoneErrorMessage}
              disabled={isProcessing}
              variant="dark"
            />

            {/* Expandable Promo Coupon Section */}
            <div className="pt-1">
              {!showCouponInput ? (
                <button
                  type="button"
                  onClick={() => setShowCouponInput(true)}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold transition-colors cursor-pointer"
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
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
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
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs transition-all active:scale-95 cursor-pointer"
                    >
                      APPLY
                    </button>
                    {appliedCode && (
                      <button
                        type="button"
                        onClick={handleRemoveCouponCode}
                        className="px-2.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold cursor-pointer"
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

            {/* Redesigned Premium Payment Method Section */}
            {finalTotal > 0 && (
              <div className="space-y-2.5">
                <PaymentMethodCards
                  paymentMethod={paymentMethod}
                  onSelectMethod={(m) => {
                    setPaymentMethod(m);
                    setPaypalReady(false);
                  }}
                  inrAmount={finalTotal}
                  usdAmountDisplay={previewUsdDisplay}
                  razorpayTitle="RAZORPAY"
                  razorpaySubtitle="UPI • Card • NetBanking"
                  razorpayTagline="Instant Processing • 100% Secure"
                  paypalTitle="PAYPAL"
                  paypalSubtitle="International Checkout"
                  paypalTagline="Pay in USD • Not Refundable"
                  themeAccent="cyan"
                  variant="dark"
                />

                {/* PayPal Conversion Info Card (shown when PayPal is selected) */}
                {paymentMethod === 'paypal' && (
                  <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs font-mono space-y-2 animate-fadeIn">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Product Price (Authoritative):</span>
                      <span className="text-white font-bold">₹{finalTotal.toFixed(2)} INR</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Conversion Rate:</span>
                      <span className="text-slate-300">₹95 = $1.00 USD</span>
                    </div>
                    <div className="pt-2 border-t border-blue-500/30 flex justify-between items-center font-bold">
                      <span className="text-blue-300">PayPal Total (USD):</span>
                      <span className="text-base text-blue-400">${previewUsdDisplay} USD</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PayPal Buttons Container (shown when PayPal is selected) */}
            {paymentMethod === 'paypal' && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-blue-500/40 shadow-xl shadow-blue-500/10 space-y-2 animate-fadeIn">
                <div className="text-center">
                  <span className="text-[11px] text-blue-400 font-mono font-bold">
                    {paypalLoading ? 'Loading PayPal Secure Gateway...' : `Pay via PayPal • $${previewUsdDisplay} USD`}
                  </span>
                </div>
                <div id="paypal-button-container" className="min-h-[44px] w-full" />
              </div>
            )}

            {/* Razorpay Submit CTA (rendered when Razorpay is active) */}
            {paymentMethod === 'razorpay' && (
              <button
                type="submit"
                disabled={isProcessing || !isOnline || (!isPhoneValid && phoneTouched)}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-xs font-mono tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
            )}

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{paymentMethod === 'paypal' ? 'PayPal Buyer Protection • Secure Checkout' : 'Razorpay 256-Bit SSL Encrypted Payment'}</span>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
