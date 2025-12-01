import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { CreateReservationDto } from '../dtos/reservation.dto.js';
import * as reservationController from '../controllers/reservationController.js';

const router = Router();

router.post(
  '/',
  validateRequest(CreateReservationDto),
  requireAuth,
  reservationController.createReservation,
);
router.post(
  '/:id/consume',
  requireAuth,
  reservationController.consumeReservation,
);
router.post(
  '/:id/release',
  requireAuth,
  reservationController.releaseReservation,
);

export default router;
