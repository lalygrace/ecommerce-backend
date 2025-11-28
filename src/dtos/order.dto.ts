import { z } from 'zod';
import { idSchema, paginationSchema } from './common.dto.js';

export const CreateOrderItemDto = z
  .object({
    productId: idSchema,
    vendorId: idSchema,
    title: z.string().min(1),
    unitPriceCents: z.number().int().nonnegative(),
    quantity: z.number().int().positive(),
    image: z.string().url().optional(),
    variantSku: z.string().optional(),
  })
  .strict();

export type CreateOrderItemDtoType = z.infer<typeof CreateOrderItemDto>;

export const CreateOrderDto = z
  .object({
    customerId: idSchema.optional(),
    items: z.array(CreateOrderItemDto).min(1),
    totalCents: z.number().int().nonnegative(),
    shippingAddress: z.any().optional(),
    couponCode: z.string().optional(),
  })
  .strict();

export type CreateOrderDtoType = z.infer<typeof CreateOrderDto>;

export const ListOrdersQuery = paginationSchema.extend({
  customerId: idSchema.optional(),
  status: z.string().optional(),
});

export type ListOrdersQueryType = z.infer<typeof ListOrdersQuery>;

export const UpdateOrderDto = z
  .object({
    status: z.string().optional(),
  })
  .strict();

export type UpdateOrderDtoType = z.infer<typeof UpdateOrderDto>;
