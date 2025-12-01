import { Router } from 'express';
import express from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { CreatePaymentDto } from '../dtos/payment.dto.js';
import * as paymentController from '../controllers/paymentController.js';

const router = Router();

router.post(
  '/',
  validateRequest(CreatePaymentDto),
  requireAuth,
  paymentController.createPayment,
);

// webhook endpoint (public) - support Stripe raw body signature and fallback JSON payload
router.post(
  '/webhook',
  express.raw({ type: '*/*' }),
  paymentController.webhook,
);
router.get('/:id', requireAuth, paymentController.getPayment);

export default router;
