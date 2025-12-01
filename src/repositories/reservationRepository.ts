import { prisma } from '../db/prisma.js';
import type { CreateReservationDtoType } from '../dtos/reservation.dto.js';

export const createReservation = async (data: CreateReservationDtoType) => {
  const prismaData: any = {
    productId: data.productId,
    variantSku: data.variantSku ?? null,
    userId: data.userId ?? null,
    orderId: (data as any).orderId ?? null,
    sessionId: data.sessionId ?? null,
    quantity: data.quantity,
    expiresAt: data.expiresAt,
    status: 'ACTIVE',
  };

  return prisma.reservation.create({ data: prismaData });
};

export const findActiveReservationsForProduct = async (productId: string) =>
  prisma.reservation.findMany({ where: { productId, status: 'ACTIVE' } });

export const findActiveReservationForProductAndUser = async (
  productId: string,
  userId: string | undefined,
) =>
  prisma.reservation.findFirst({
    where: { productId, userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

export const findActiveReservationForProductAndSession = async (
  productId: string,
  sessionId: string | undefined,
) =>
  prisma.reservation.findFirst({
    where: { productId, sessionId, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

export const consumeReservation = async (id: string) =>
  prisma.reservation.update({ where: { id }, data: { status: 'CONSUMED' } });

export const releaseReservation = async (id: string) =>
  prisma.reservation.update({ where: { id }, data: { status: 'EXPIRED' } });

export const deleteExpiredReservations = async (beforeDate: Date) =>
  prisma.reservation.deleteMany({ where: { expiresAt: { lt: beforeDate } } });
