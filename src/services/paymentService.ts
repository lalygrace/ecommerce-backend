import * as repo from '../repositories/paymentRepository.js';
import * as orderRepo from '../repositories/orderRepository.js';
import * as reservationRepo from '../repositories/reservationRepository.js';
import * as reservationSvc from './reservationService.js';
import * as inventorySvc from './inventoryService.js';
import { stripe, isStripeConfigured } from './stripeService.js';
import { env } from '../config/env.js';
import type {
  CreatePaymentDtoType,
  UpdatePaymentDtoType,
  WebhookPaymentDtoType,
} from '../dtos/payment.dto.js';

export const createPayment = async (data: CreatePaymentDtoType) => {
  // If card payment and Stripe configured, create a PaymentIntent and persist
  if (data.method === 'CARD' && (data.gateway === 'stripe' || !data.gateway)) {
    if (!isStripeConfigured()) {
      // Fallback: persist payment record but do not call Stripe
      return repo.createPayment({
        ...data,
        gateway: data.gateway ?? null,
      } as any);
    }

    const currency = (data.currency ?? 'USD').toLowerCase();
    // create PaymentIntent
    const intent = await stripe.paymentIntents.create({
      amount: data.amountCents,
      currency,
      metadata: { orderId: data.orderId },
      // automatic payment methods enables card and others supported
      automatic_payment_methods: { enabled: true },
    } as any);

    // Persist payment record referencing Stripe intent
    const rec = await repo.createPayment({
      ...data,
      gateway: 'stripe',
      transactionRef: intent.id,
    } as any);

    // Return client secret so frontend can confirm the payment
    return { payment: rec, clientSecret: intent.client_secret };
  }

  // Default: persist payment record
  return repo.createPayment(data);
};

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

export const handleStripeWebhook = async (
  rawBody: Buffer,
  sigHeader: string | string[] | undefined,
) => {
  if (!isStripeConfigured()) throw new Error('Stripe not configured');
  if (!sigHeader || Array.isArray(sigHeader))
    throw new Error('Missing stripe signature header');
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sigHeader as string,
      secret,
    );
  } catch (err: any) {
    throw new Error(`Invalid Stripe webhook signature: ${err.message}`);
  }

  // Handle payment_intent.succeeded and payment_intent.payment_failed
  if (
    event.type === 'payment_intent.succeeded' ||
    event.type === 'payment_intent.payment_failed'
  ) {
    const intent = event.data.object as any;
    const orderId = intent.metadata?.orderId as string | undefined;
    const status =
      event.type === 'payment_intent.succeeded' ? 'PAID' : 'FAILED';

    const payload: WebhookPaymentDtoType = {
      orderId: orderId as any,
      transactionRef: intent.id,
      status: status as any,
      gateway: 'stripe',
      amountCents: intent.amount ?? 0,
    } as any;

    return handleWebhook(payload);
  }

  // Unhandled events return null
  return null;
};
