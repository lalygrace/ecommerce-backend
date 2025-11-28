import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const session = res.locals.session;
    if (!session || !session.user || !session.user.id) {
      return next(new AppError('Unauthenticated', 401, true));
    }
    const role = (session.user as any)?.role as string | undefined;
    if (role !== 'ADMIN') return next(new AppError('Forbidden', 403, true));
    return next();
  } catch (err) {
    return next(err);
  }
};
