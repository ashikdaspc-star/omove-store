/**
 * Global Payment & Feature Configuration for Omove Store
 *
 * Feature Flags:
 * - PAYPAL_CHECKOUT_ENABLED: Set to `false` to disable PayPal across the customer-facing website.
 *   When `false`:
 *   - PayPal options, cards, buttons, USD conversion cards, and labels are completely hidden.
 *   - PayPal JS SDK is NEVER loaded and no API config requests are initiated from the frontend.
 *   - Razorpay remains the active, secure, and only visible payment provider.
 *   - Backend PayPal API endpoints, routes, and credentials remain 100% intact and ready for reactivation.
 */
export const PAYPAL_CHECKOUT_ENABLED = false;
