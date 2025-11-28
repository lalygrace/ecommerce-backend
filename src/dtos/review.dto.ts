import { z } from 'zod';
import { idSchema, paginationSchema } from './common.dto.js';

export const CreateReviewDto = z
  .object({
    productId: idSchema,
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).optional(),
    body: z.string().optional(),
  })
  .strict();

export type CreateReviewDtoType = z.infer<typeof CreateReviewDto>;

export const UpdateReviewDto = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().optional(),
    body: z.string().optional(),
  })
  .strict();

export type UpdateReviewDtoType = z.infer<typeof UpdateReviewDto>;

export const ListReviewsQuery = paginationSchema.extend({
  productId: idSchema.optional(),
  userId: idSchema.optional(),
});

export type ListReviewsQueryType = z.infer<typeof ListReviewsQuery>;
