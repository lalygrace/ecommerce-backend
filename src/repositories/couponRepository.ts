import { prisma } from '../db/prisma.js';
import type {
  CreateCouponDtoType,
  UpdateCouponDtoType,
} from '../dtos/coupon.dto.js';

export const createCoupon = async (data: CreateCouponDtoType) =>
  prisma.coupon.create({
    data: { ...data, active: data.active ?? true } as any,
  });

export const findCouponById = async (id: string) =>
  prisma.coupon.findUnique({ where: { id } });

export const findCouponByCode = async (code: string) =>
  prisma.coupon.findUnique({ where: { code } });

export const findCoupons = async (opts: {
  page: number;
  limit: number;
  active?: boolean;
}) => {
  const where: any = {};
  if (opts.active !== undefined) where.active = opts.active;
  const skip = (opts.page - 1) * opts.limit;
  const [total, items] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      skip,
      take: opts.limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { total, items };
};

export const updateCoupon = async (id: string, data: UpdateCouponDtoType) =>
  prisma.coupon.update({ where: { id }, data: { ...data } as any });

export const deleteCoupon = async (id: string) =>
  prisma.coupon.delete({ where: { id } });

export const incrementCouponUse = async (id: string) =>
  prisma.coupon.update({
    where: { id },
    data: { usedCount: { increment: 1 } as any } as any,
  });
