import { z } from 'zod';
import { idSchema } from './common.dto.js';

export const CreateInventoryEventDto = z
  .object({
    productId: idSchema,
    variantSku: z.string().optional(),
    type: z.string().min(1), // ADJUST, SALE, RETURN, RESERVE, RELEASE
    quantity: z.number().int(),
    note: z.string().optional(),
  })
  .strict();

export type CreateInventoryEventDtoType = z.infer<
  typeof CreateInventoryEventDto
>;
