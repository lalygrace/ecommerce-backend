import type { RequestHandler } from 'express';
import * as reviewService from '../services/reviewService.js';
import { AppError } from '../errors/AppError.js';

export const createReview: RequestHandler = async (req, res, next) => {
  try {
    const session = res.locals.session;
    const userId = session?.user?.id as string | undefined;
    if (!userId) return next(new AppError('Unauthenticated', 401, true));
    const payload = { ...(req.body as any), userId };
    const created = await reviewService.createReview(payload);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};

export const getReview: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const rec = await reviewService.getReviewById(id);
    if (!rec) return next(new AppError('Not found', 404, true));
    return res.status(200).json({ status: 'success', data: rec });
  } catch (err) {
    return next(err);
  }
};

export const listReviews: RequestHandler = async (req, res, next) => {
  try {
    const query = (req as any).validatedQuery ?? (req.query as any);
    const { page = 1, limit = 20, productId, userId } = query;
    const result = await reviewService.listReviews({
      page: Number(page),
      limit: Number(limit),
      productId,
      userId,
    });
    return res.status(200).json({
      status: 'success',
      data: result.items,
      meta: { total: result.total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    return next(err);
  }
};

export const updateReview: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    // ensure owner/admin check was performed by middleware
    const updated = await reviewService.updateReview(id, req.body);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

export const deleteReview: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    await reviewService.deleteReview(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
