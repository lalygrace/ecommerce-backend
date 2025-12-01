import { z } from 'zod';
import { idSchema } from './common.dto.js';

export const CreateReservationDto = z
  .object({
    productId: idSchema,
    variantSku: z.string().optional(),
    userId: idSchema.optional(),
    orderId: idSchema.optional(),
    sessionId: z.string().optional(),
    quantity: z.number().int().positive(),
    expiresAt: z.string().datetime(),
  })
  .strict();

export type CreateReservationDtoType = z.infer<typeof CreateReservationDto>;
