import * as repo from '../repositories/couponRepository.js';
import type { ApplyCouponDtoType, CreateCouponDtoType, UpdateCouponDtoType } from '../dtos/coupon.dto.js';

export const createCoupon = async (data: CreateCouponDtoType) => repo.createCoupon(data);

export const getCouponById = async (id: string) => repo.findCouponById(id);

export const getCouponByCode = async (code: string) => repo.findCouponByCode(code);

export const listCoupons = async (opts: { page: number; limit: number; active?: boolean }) =>
  repo.findCoupons(opts);

export const updateCoupon = async (id: string, data: UpdateCouponDtoType) => repo.updateCoupon(id, data);

export const deleteCoupon = async (id: string) => repo.deleteCoupon(id);

export const validateAndApply = async (payload: ApplyCouponDtoType) => {
  const coupon = await repo.findCouponByCode(payload.code);
  if (!coupon) return { valid: false, reason: 'NOT_FOUND' };
  if (!coupon.active) return { valid: false, reason: 'INACTIVE' };
  const now = new Date();
  if (coupon.validFrom && new Date(coupon.validFrom) > now) return { valid: false, reason: 'NOT_STARTED' };
  if (coupon.validTo && new Date(coupon.validTo) < now) return { valid: false, reason: 'EXPIRED' };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, reason: 'MAX_USES' };
  if (coupon.minOrderAmountCents && payload.totalCents < coupon.minOrderAmountCents)
    return { valid: false, reason: 'MIN_ORDER' };
  // category matching: if coupon.applicableCategorySlugs non-empty, ensure at least one match
  if (coupon.applicableCategorySlugs && coupon.applicableCategorySlugs.length > 0) {
    const categories = payload.categorySlugs ?? [];
    const has = categories.some((c) => coupon.applicableCategorySlugs.includes(c));
    if (!has) return { valid: false, reason: 'CATEGORY_MISMATCH' };
  }

  // compute discount
  let discount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discount = Math.floor((payload.totalCents * (coupon.valueCents || 0)) / 100);
  } else if (coupon.type === 'FIXED') {
    discount = coupon.valueCents;
  } else if (coupon.type === 'FREE_SHIPPING') {
    discount = 0; // shipping handled separately by caller
  }

  return { valid: true, coupon, discountCents: Math.min(discount, payload.totalCents) };
};

export const markCouponUsed = async (id: string) => repo.incrementCouponUse(id);
