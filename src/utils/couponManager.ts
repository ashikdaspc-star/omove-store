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

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount: number;
}

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
