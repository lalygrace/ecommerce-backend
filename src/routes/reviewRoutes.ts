import { Router } from 'express';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireReviewOwner } from '../middlewares/requireReviewOwner.js';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ListReviewsQuery,
} from '../dtos/review.dto.js';
import * as reviewController from '../controllers/reviewController.js';

const router = Router();

router.post(
  '/',
  validateRequest(CreateReviewDto),
  requireAuth,
  reviewController.createReview,
);
router.get(
  '/',
  validateRequest(ListReviewsQuery, { target: 'query' }),
  reviewController.listReviews,
);
router.get('/:id', reviewController.getReview);
router.put(
  '/:id',
  validateRequest(UpdateReviewDto),
  requireAuth,
  requireReviewOwner,
  reviewController.updateReview,
);
router.delete(
  '/:id',
  requireAuth,
  requireReviewOwner,
  reviewController.deleteReview,
);

export default router;
