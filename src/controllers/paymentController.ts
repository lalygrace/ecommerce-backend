import type { RequestHandler } from 'express';
import * as paymentService from '../services/paymentService.js';
import { AppError } from '../errors/AppError.js';
import { WebhookPaymentDto } from '../dtos/payment.dto.js';

export const createPayment: RequestHandler = async (req, res, next) => {
  try {
    const session = res.locals.session;
    if (!session || !session.user || !session.user.id)
      return next(new AppError('Unauthenticated', 401, true));
    const created = await paymentService.createPayment(req.body);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};

export const getPayment: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const rec = await paymentService.getPaymentById(id);
    if (!rec) return next(new AppError('Not found', 404, true));
    return res.status(200).json({ status: 'success', data: rec });
  } catch (err) {
    return next(err);
  }
};

export const webhook: RequestHandler = async (req, res, next) => {
  try {
    // Support Stripe webhook verification which requires the raw body and signature header.
    const sig = req.headers['stripe-signature'];
    const raw = req.body;

    if (sig) {
      // body is expected as raw Buffer when route is configured with express.raw
      const updated = await paymentService.handleStripeWebhook(
        raw as any,
        sig as any,
      );
      return res.status(200).json({ status: 'success', data: updated });
    }

    // Fallback: parse JSON body (req.body may be Buffer from express.raw)
    let bodyObj: any = req.body;
    if (Buffer.isBuffer(req.body)) {
      try {
        bodyObj = JSON.parse(req.body.toString('utf8'));
      } catch (err) {
        return next(new AppError('Invalid JSON payload', 400, true));
      }
    }
    const parsed = WebhookPaymentDto.safeParse(bodyObj);
    if (!parsed.success)
      return next(new AppError('Invalid webhook payload', 400, true));
    const updated = await paymentService.handleWebhook(parsed.data);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};
