import { z } from 'zod';
import { idSchema, paginationSchema } from './common.dto.js';

export const ProductStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'DRAFT',
  'ARCHIVED',
]);

export const CreateProductDto = z
  .object({
    vendorId: idSchema,
    title: z.string().min(1).max(300),
    slug: z.string().trim().min(1).optional(),
    description: z.string().max(5000).optional(),
    priceCents: z.number().int().nonnegative(),
    originalPriceCents: z.number().int().nonnegative().optional(),
    stock: z.number().int().nonnegative().default(0),
    shippingFeeCents: z.number().int().nonnegative().optional(),
    deliveryTime: z.string().optional(),
    image: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
    categorySlugs: z.array(z.string()).optional(),
    status: ProductStatusEnum.optional(),
  })
  .strict();

export const UpdateProductDto = CreateProductDto.partial().strict();

export const ListProductsQuery = paginationSchema.extend({
  q: z.string().optional(),
  vendorId: idSchema.optional(),
  category: z.string().optional(),
  status: ProductStatusEnum.optional(),
});

export type CreateProductDtoType = z.infer<typeof CreateProductDto>;
export type UpdateProductDtoType = z.infer<typeof UpdateProductDto>;
export type ListProductsQueryType = z.infer<typeof ListProductsQuery>;
