import * as repo from '../repositories/orderRepository.js';
import * as reservationSvc from './reservationService.js';
import type {
  CreateOrderDtoType,
  UpdateOrderDtoType,
} from '../dtos/order.dto.js';

export const createOrder = async (data: CreateOrderDtoType) => {
  const order = await repo.createOrder(data);
  try {
    // create reservations for each item to reserve stock until payment
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    for (const it of data.items) {
      await reservationSvc.createReservation({
        productId: it.productId,
        variantSku: it.variantSku ?? undefined,
        userId: data.customerId ?? undefined,
        orderId: order.id,
        sessionId: null,
        quantity: it.quantity,
        expiresAt: expiresAt.toISOString(),
      } as any);
    }
  } catch (err) {
    // reservation failures should not prevent order creation; log and continue
    // In production, you might roll back the order or mark order as needing attention
    console.warn('Failed to create reservations for order', order.id, err);
  }
  return order;
};

export const getOrderById = async (id: string) => repo.findOrderById(id);

export const listOrders = async (opts: {
  page: number;
  limit: number;
  customerId?: string;
  status?: string;
}) => repo.findOrders(opts);

export const updateOrder = async (id: string, data: UpdateOrderDtoType) =>
  repo.updateOrder(id, data);

export const deleteOrder = async (id: string) => repo.deleteOrder(id);
