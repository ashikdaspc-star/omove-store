/**
 * Shared Singleton PayPal SDK Loader for Omove Store
 *
 * Performance Guarantees:
 * 1. The PayPal JS SDK is downloaded at most ONCE per application lifecycle.
 * 2. All components (CheckoutModal, HomeView, RemoteSupportBookingView, ServicesView, SupportView)
 *    share the exact same Promise and SDK instance.
 * 3. PayPal client ID / config is fetched at most ONCE from /api/paypal/config and cached in memory.
 * 4. Loads ONLY on-demand when the customer explicitly chooses PayPal (never on initial page load).
 * 5. Uses standard PayPal SDK URL (https://www.paypal.com/sdk/js) with components=buttons&currency=USD&intent=capture.
 * 6. Never deletes or removes window.paypal across React re-renders or route changes.
 */

let paypalConfigPromise: Promise<string> | null = null;
let paypalSdkPromise: Promise<any> | null = null;

/**
 * Fetch and cache PayPal Client ID
 */
export async function getPayPalClientId(): Promise<string> {
  if (paypalConfigPromise) {
    return paypalConfigPromise;
  }

  paypalConfigPromise = (async () => {
    try {
      const res = await fetch('/api/paypal/config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.clientId) {
          return data.clientId;
        }
      }
    } catch (e) {
      console.warn('[PayPal Loader] Config fetch note:', e);
    }

    return (
      import.meta.env.VITE_PAYPAL_CLIENT_ID ||
      (window as any).__PAYPAL_CLIENT_ID__ ||
      'BAAq2PyxqOTR12C8YmU9N7Km0YSbwzwu4dOJHk4mmXV4GiCRQ1pS-IEROr24x4Tjej_Pzmnx24E51GSCIo'
    );
  })();

  return paypalConfigPromise;
}

/**
 * Load PayPal JavaScript SDK with singleton Promise deduplication
 */
export function loadPayPalSDK(): Promise<any> {
  // If window.paypal is already loaded and ready in memory, resolve immediately
  if (typeof (window as any).paypal !== 'undefined' && typeof (window as any).paypal.Buttons === 'function') {
    return Promise.resolve((window as any).paypal);
  }

  // If a script load is already in progress, return the active Promise
  if (paypalSdkPromise) {
    return paypalSdkPromise;
  }

  paypalSdkPromise = (async () => {
    const clientId = await getPayPalClientId();
    if (!clientId) {
      throw new Error('PayPal Client ID is missing');
    }

    if (typeof (window as any).paypal !== 'undefined' && typeof (window as any).paypal.Buttons === 'function') {
      return (window as any).paypal;
    }

    // Check if script tag is already attached to DOM
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]') as HTMLScriptElement | null;
    if (existingScript) {
      return new Promise((resolve, reject) => {
        if (typeof (window as any).paypal !== 'undefined' && typeof (window as any).paypal.Buttons === 'function') {
          resolve((window as any).paypal);
          return;
        }

        const handleLoad = () => {
          existingScript.removeEventListener('load', handleLoad);
          existingScript.removeEventListener('error', handleError);
          if (typeof (window as any).paypal !== 'undefined') {
            resolve((window as any).paypal);
          } else {
            reject(new Error('PayPal SDK script loaded but window.paypal is undefined'));
          }
        };

        const handleError = () => {
          existingScript.removeEventListener('load', handleLoad);
          existingScript.removeEventListener('error', handleError);
          paypalSdkPromise = null;
          reject(new Error('Failed to load PayPal SDK script'));
        };

        existingScript.addEventListener('load', handleLoad);
        existingScript.addEventListener('error', handleError);
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&components=buttons&intent=capture`;
      script.async = true;

      script.onload = () => {
        if (typeof (window as any).paypal !== 'undefined') {
          resolve((window as any).paypal);
        } else {
          paypalSdkPromise = null;
          reject(new Error('PayPal SDK loaded but window.paypal is not found'));
        }
      };

      script.onerror = (err) => {
        console.error('[PayPal Loader] Script network load failed:', err);
        paypalSdkPromise = null; // Allow retry on network glitch
        reject(new Error('Failed to load PayPal JavaScript SDK'));
      };

      document.head.appendChild(script);
    });
  })();

  return paypalSdkPromise;
}
