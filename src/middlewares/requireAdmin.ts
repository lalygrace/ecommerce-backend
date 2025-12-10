import type { RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../utils/auth.js';
import { AppError } from '../errors/AppError.js';
import { hasRole } from '../utils/rbac.js';

// Ensures the request is authenticated and the user has ADMIN role.
export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    // Prefer a previously resolved session (set by requireAuth). If missing, fetch it.
    let session = res.locals.session;
    if (!session) {
      session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session) res.locals.session = session;
    }

    if (!session || !session.user || !session.user.id) {
      return next(new AppError('Unauthenticated', 401, true));
    }

    // Ensure the session has a role (some Better Auth responses omit custom fields)
    try {
      // dynamic import to avoid circular references in some build setups
      const { enrichSessionWithRole } =
        await import('../utils/sessionEnricher.js');
      await enrichSessionWithRole(session);
    } catch (e) {
      // log and continue; permission check below will fail if role still missing
      // eslint-disable-next-line no-console
      console.error('[requireAdmin] failed to enrich session role', e);
    }

    const role = (session.user as any)?.role as string | undefined;
    if (!hasRole(role, 'ADMIN'))
      return next(new AppError('Forbidden', 403, true));
    return next();
  } catch (err) {
    return next(err);
  }
};
