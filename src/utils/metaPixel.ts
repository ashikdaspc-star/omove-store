// Meta Pixel & Conversions Tracking Utility for Omove Store
// Dataset / Pixel ID: 1292055219560879
// Architecture: Deduplicated Browser Pixel + Event ID Idempotency

import { CartItem, Order } from '../types';

export const META_PIXEL_ID = '1292055219560879';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

// In-memory deduplication caches
const trackedPurchasesSet = new Set<string>();
let lastTrackedPageView = '';
let lastTrackedViewContentProduct = '';
let lastTrackedInitiateCheckoutKey = '';

/**
 * Initialize Meta Pixel script dynamically if not already loaded by index.html
 */
export function initMetaPixel(): void {
  if (typeof window === 'undefined') return;

  if (window.fbq && typeof window.fbq === 'function') {
    return;
  }

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  if (window.fbq) {
    window.fbq('init', META_PIXEL_ID);
  }
}

/**
 * Track SPA PageView (Deduplicated per pathname + search)
 */
export function trackPageView(url?: string): void {
  if (typeof window === 'undefined') return;

  const currentUrl = url || (window.location.pathname + window.location.search);

  // Prevent duplicate PageView events on immediate re-renders of the same page
  if (lastTrackedPageView === currentUrl) {
    return;
  }

  lastTrackedPageView = currentUrl;

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
}

/**
 * Track ViewContent when a product details page or modal is viewed
 */
export function trackViewContent(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  currency?: string;
}): void {
  if (typeof window === 'undefined' || !product || !product.id) return;

  const dedupKey = `${product.id}:${window.location.pathname}`;
  if (lastTrackedViewContentProduct === dedupKey) {
    return;
  }
  lastTrackedViewContentProduct = dedupKey;

  const value = Math.max(0, Number(product.price) || 0);
  const currency = product.currency || 'INR';

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'ViewContent', {
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      content_category: product.category || 'Digital Products',
      value: value,
      currency: currency
    });
  }
}

/**
 * Track InitiateCheckout when a buyer genuinely initiates the checkout modal
 */
export function trackInitiateCheckout(cart: CartItem[], total: number): void {
  if (typeof window === 'undefined' || !Array.isArray(cart) || cart.length === 0) return;

  const cartKey = cart.map((i) => `${i.product.id}:${i.quantity}`).join('|') + `:${total}`;
  if (lastTrackedInitiateCheckoutKey === cartKey) {
    return;
  }
  lastTrackedInitiateCheckoutKey = cartKey;

  const contentIds = cart.map((i) => i.product.id).filter(Boolean);
  const numItems = cart.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);
  const value = Math.max(0, Number(total) || 0);

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: contentIds,
      content_type: 'product',
      num_items: numItems,
      value: value,
      currency: 'INR'
    });
  }
}

/**
 * Track verified Purchase event
 * ONLY called after server has verified the payment/order successfully.
 * Enforces strict idempotency via in-memory Set and sessionStorage.
 */
export function trackPurchase(order: Order, customEventId?: string): void {
  if (typeof window === 'undefined' || !order) return;

  const orderIdentifier = order.id || order.orderNumber;
  if (!orderIdentifier) return;

  const eventID = customEventId || `purchase_${orderIdentifier}`;

  // 1. In-memory deduplication check
  if (trackedPurchasesSet.has(eventID)) {
    return;
  }

  // 2. Browser sessionStorage deduplication check
  try {
    const raw = sessionStorage.getItem('omove_meta_tracked_purchases');
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (list.includes(eventID)) {
      trackedPurchasesSet.add(eventID);
      return;
    }
    list.push(eventID);
    sessionStorage.setItem('omove_meta_tracked_purchases', JSON.stringify(list));
  } catch (e) {
    // sessionStorage fallback
  }

  trackedPurchasesSet.add(eventID);

  const value = Math.max(0, Number(order.total ?? (order as any).totalAmount ?? 0));
  const currency = order.paymentCurrency || 'INR';
  const contentIds = (order.items || []).map((i: any) => i.productId || i.id).filter(Boolean);
  const numItems = (order.items || []).reduce((acc: number, i: any) => acc + (Number(i.quantity) || 1), 0);

  if (typeof window.fbq === 'function') {
    window.fbq(
      'track',
      'Purchase',
      {
        value: value,
        currency: currency,
        content_ids: contentIds,
        content_type: 'product',
        num_items: numItems,
        order_id: orderIdentifier
      },
      {
        eventID: eventID
      }
    );
  }
}
