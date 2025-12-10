import type { RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../utils/auth.js';
import * as sellerService from '../services/sellerService.js';
import * as vendorRepo from '../repositories/vendorRepository.js';
import { AppError } from '../errors/AppError.js';

// Ensures the request is authenticated and the authenticated user is the owner
// of the vendor referenced in the request body (vendorId). Attaches seller and
// vendor records to `res.locals` for downstream handlers.
export const requireSeller: RequestHandler = async (req, res, next) => {
  try {
    let session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    // enrich role if missing
    try {
      const { enrichSessionWithRole } =
        await import('../utils/sessionEnricher.js');
      session = await enrichSessionWithRole(session);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[requireSeller] failed to enrich session role', e);
    }
    if (!session || !session.user || !session.user.id) {
      return next(new AppError('Unauthenticated', 401, true));
    }

    const userId = session.user.id as string;
    const seller = await sellerService.getSellerByUserId(userId);
    if (!seller) {
      return next(
        new AppError('Seller profile not found for current user', 403, true),
      );
    }

    const vendorId = (req.body && (req.body as any).vendorId) as
      | string
      | undefined;
    if (!vendorId) {
      return next(new AppError('vendorId is required', 400, true));
    }

    const vendor = await vendorRepo.findVendorById(vendorId);
    if (!vendor) {
      return next(new AppError('Vendor not found', 404, true));
    }

    if (vendor.sellerId !== seller.id) {
      return next(new AppError('You do not own this vendor', 403, true));
    }

    // Attach for downstream use
    res.locals.seller = seller;
    res.locals.vendor = vendor;
    res.locals.session = session;
    return next();
  } catch (err) {
    return next(err);
  }
};
