import type { RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../utils/auth.js';
import { AppError } from '../errors/AppError.js';
import { enrichSessionWithRole } from '../utils/sessionEnricher.js';

// Attach authenticated session and user to res.locals (and enrich with role)
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    let session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session || !session.user || !session.user.id) {
      return next(new AppError('Unauthenticated', 401, true));
    }

    // Ensure session.user has role (some Better Auth responses may omit custom fields)
    session = await enrichSessionWithRole(session);

    res.locals.session = session;
    res.locals.user = session.user;
    return next();
  } catch (err) {
    return next(err);
  }
};
