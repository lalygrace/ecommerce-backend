import { prisma } from '../db/prisma.js';
import type { CreateInventoryEventDtoType } from '../dtos/inventory.dto.js';

export const createInventoryEvent = async (data: CreateInventoryEventDtoType) =>
  prisma.inventoryEvent.create({ data });

export const findEventsForProduct = async (productId: string) =>
  prisma.inventoryEvent.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
  });
