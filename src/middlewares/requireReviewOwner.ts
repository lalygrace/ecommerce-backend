import type { RequestHandler } from 'express';
import * as reviewService from '../services/reviewService.js';
import { AppError } from '../errors/AppError.js';

export const requireReviewOwner: RequestHandler = async (req, res, next) => {
  try {
    const session = res.locals.session;
    if (!session || !session.user || !session.user.id) {
      return next(new AppError('Unauthenticated', 401, true));
    }

    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));

    const review = await reviewService.getReviewById(id);
    if (!review) return next(new AppError('Review not found', 404, true));

    const userId = session.user.id as string;
    const role = (session.user as any)?.role as string | undefined;

    if (role === 'ADMIN' || review.userId === userId) {
      res.locals.review = review;
      return next();
    }

    return next(new AppError('Forbidden', 403, true));
  } catch (err) {
    return next(err);
  }
};
