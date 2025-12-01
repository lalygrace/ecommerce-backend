import * as repo from '../repositories/paymentRepository.js';
import * as orderRepo from '../repositories/orderRepository.js';
import * as reservationRepo from '../repositories/reservationRepository.js';
import * as reservationSvc from './reservationService.js';
import * as inventorySvc from './inventoryService.js';
import type {
  CreatePaymentDtoType,
  UpdatePaymentDtoType,
  WebhookPaymentDtoType,
} from '../dtos/payment.dto.js';

export const createPayment = async (data: CreatePaymentDtoType) =>
  repo.createPayment(data);

export const getPaymentById = async (id: string) => repo.findPaymentById(id);

export const getPaymentByOrderId = async (orderId: string) =>
  repo.findPaymentByOrderId(orderId);

export const updatePayment = async (id: string, data: UpdatePaymentDtoType) =>
  repo.updatePayment(id, data);

export const handleWebhook = async (payload: WebhookPaymentDtoType) => {
  // Map webhook status to internal payment update; create payment if missing
  let payment = await repo.findPaymentByOrderId(payload.orderId as string);
  if (!payment) {
    // create a payment record representing the gateway event
    payment = await repo.createPayment({
      orderId: payload.orderId,
      method: (payload.gateway ? 'CARD' : 'CARD') as any,
      amountCents: payload.amountCents ?? 0,
      currency: 'USD',
      gateway: payload.gateway ?? null,
      transactionRef: payload.transactionRef ?? null,
    } as any);
  }

  const updated = await repo.updatePayment(payment.id, {
    status: payload.status,
    transactionRef: payload.transactionRef,
    gateway: payload.gateway,
  } as UpdatePaymentDtoType);

  // if paid, advance order status to PROCESSING
  if (payload.status === 'PAID') {
    await orderRepo.updateOrder(payment.orderId, {
      status: 'PROCESSING',
    } as any);

    // consume reservations for this order's items where possible
    try {
      const ord = await orderRepo.findOrderById(payment.orderId);
      if (ord && ord.items && ord.items.length) {
        for (const it of ord.items) {
          // try to find reservation by user then session
          const byUser =
            await reservationRepo.findActiveReservationForProductAndUser(
              it.productId,
              ord.customerId,
            );
          if (byUser) {
            await reservationSvc.consumeReservation(byUser.id);
            continue;
          }
          const bySession =
            await reservationRepo.findActiveReservationForProductAndSession(
              it.productId,
              undefined,
            );
          if (bySession) {
            await reservationSvc.consumeReservation(bySession.id);
            continue;
          }

          // if no reservation, create an explicit SALE inventory event
          await inventorySvc.createInventoryEvent({
            productId: it.productId,
            variantSku: it.variantSku ?? undefined,
            type: 'SALE',
            quantity: it.quantity,
            note: `Auto-sale for order ${payment.orderId}`,
          } as any);
        }
      }
    } catch (err) {
      console.warn(
        'Failed to consume reservations for order',
        payment.orderId,
        err,
      );
    }
  }

  return updated;
};
