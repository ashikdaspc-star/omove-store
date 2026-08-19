import { Coupon } from '../types';
import { MOCK_COUPONS } from '../data/mockData';

export const getStoredCoupons = (): Coupon[] => {
  try {
    const stored = localStorage.getItem('omove_coupons');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return MOCK_COUPONS;
};

export const fetchAndCacheCoupons = async (): Promise<Coupon[]> => {
  try {
    const res = await fetch('/api/coupons');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        try {
          localStorage.setItem('omove_coupons', JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {
    console.warn('Coupons fetch note:', err);
  }
  return getStoredCoupons();
};

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount: number;
}

export const validateAndApplyCouponAsync = async (inputCode: string, orderTotal: number): Promise<CouponValidationResult> => {
  if (!inputCode.trim()) {
    return { valid: false, message: 'Please enter a coupon code.', discountAmount: 0 };
  }

  const cleanCode = inputCode.trim().toUpperCase();

  // 1. Try Live Server API validation first
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode, orderTotal })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.valid === 'boolean') {
        return {
          valid: data.valid,
          message: data.message || (data.valid ? `Coupon '${cleanCode}' applied!` : `Coupon '${cleanCode}' is invalid.`),
          coupon: data.coupon,
          discountAmount: Number(data.discountAmount) || 0
        };
      }
    }
  } catch (err) {
    console.warn('Live coupon validation note:', err);
  }

  // 2. Fallback to cached local coupons validation
  return validateAndApplyCoupon(cleanCode, orderTotal);
};

export const validateAndApplyCoupon = (inputCode: string, orderTotal: number): CouponValidationResult => {
  if (!inputCode.trim()) {
    return { valid: false, message: 'Please enter a coupon code.', discountAmount: 0 };
  }

  const cleanCode = inputCode.trim().toUpperCase();
  const coupons = getStoredCoupons();
  const found = coupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (!found) {
    return { valid: false, message: `Coupon '${cleanCode}' is invalid or expired.`, discountAmount: 0 };
  }

  if (!found.isActive) {
    return { valid: false, message: `Coupon '${cleanCode}' is currently disabled.`, discountAmount: 0 };
  }

  if (orderTotal < found.minOrderAmount) {
    return { valid: false, message: `Coupon requires a minimum order of ₹${found.minOrderAmount}.`, discountAmount: 0 };
  }

  let calculatedDiscount = 0;
  if (found.discountType === 'percentage') {
    calculatedDiscount = Math.round((orderTotal * found.discountValue) / 100);
  } else {
    calculatedDiscount = Math.min(orderTotal, found.discountValue);
  }

  return {
    valid: true,
    message: `🎉 Coupon '${found.code}' applied! Saved ₹${calculatedDiscount}`,
    coupon: found,
    discountAmount: calculatedDiscount
  };
};

