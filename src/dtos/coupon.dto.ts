import { z } from 'zod';
import { paginationSchema } from './common.dto.js';

export const CouponTypeEnum = z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING']);

export const CreateCouponDto = z
  .object({
    code: z.string().min(1),
    type: CouponTypeEnum,
    valueCents: z.number().int().nonnegative(),
    maxUses: z.number().int().positive().optional(),
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional(),
    active: z.boolean().optional(),
    minOrderAmountCents: z.number().int().nonnegative().optional(),
    applicableCategorySlugs: z.array(z.string()).optional(),
  })
  .strict();

export type CreateCouponDtoType = z.infer<typeof CreateCouponDto>;

export const UpdateCouponDto = CreateCouponDto.partial().strict();
export type UpdateCouponDtoType = z.infer<typeof UpdateCouponDto>;

export const ListCouponsQuery = paginationSchema.extend({ active: z.boolean().optional() });
export type ListCouponsQueryType = z.infer<typeof ListCouponsQuery>;

export const ApplyCouponDto = z
  .object({
    code: z.string().min(1),
    totalCents: z.number().int().nonnegative(),
    categorySlugs: z.array(z.string()).optional(),
  })
  .strict();

export type ApplyCouponDtoType = z.infer<typeof ApplyCouponDto>;
