import * as repo from '../repositories/reservationRepository.js';
import * as inventorySvc from './inventoryService.js';
import type { CreateReservationDtoType } from '../dtos/reservation.dto.js';

export const createReservation = async (data: CreateReservationDtoType) => {
  // Create reservation record
  const rec = await repo.createReservation(data);
  // create inventory event of type RESERVE to decrement available stock
  await inventorySvc.createInventoryEvent({
    productId: data.productId,
    variantSku: data.variantSku,
    type: 'RESERVE',
    quantity: data.quantity,
    note: `Reservation ${rec.id}`,
  } as any);
  return rec;
};

export const consumeReservation = async (id: string) => {
  // mark consumed and create SALE event
  const rec = await repo.consumeReservation(id);
  await inventorySvc.createInventoryEvent({
    productId: rec.productId,
    variantSku: rec.variantSku ?? undefined,
    type: 'SALE',
    quantity: rec.quantity,
    note: `Consume reservation ${rec.id}`,
  } as any);
  return rec;
};

export const releaseReservation = async (id: string) => {
  const rec = await repo.releaseReservation(id);
  await inventorySvc.createInventoryEvent({
    productId: rec.productId,
    variantSku: rec.variantSku ?? undefined,
    type: 'RELEASE',
    quantity: rec.quantity,
    note: `Release reservation ${rec.id}`,
  } as any);
  return rec;
};

export const cleanupExpired = async () => {
  const now = new Date();
  // delete expired reservations and create release events for each (simplified)
  // For safety, we fetch expired reservations before deleting
  const expired = await (
    await import('../db/prisma.js')
  ).prisma.reservation.findMany({
    where: { expiresAt: { lt: now.toISOString() }, status: 'ACTIVE' },
  });
  for (const r of expired) {
    await releaseReservation(r.id);
  }
};
