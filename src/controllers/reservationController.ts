import type { RequestHandler } from 'express';
import * as reservationService from '../services/reservationService.js';
import { AppError } from '../errors/AppError.js';

export const createReservation: RequestHandler = async (req, res, next) => {
  try {
    const session = res.locals.session as any;
    const userId = session?.user?.id as string | undefined;
    const payload = { ...(req.body as any), userId };
    const created = await reservationService.createReservation(payload);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};

export const consumeReservation: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const rec = await reservationService.consumeReservation(id);
    return res.status(200).json({ status: 'success', data: rec });
  } catch (err) {
    return next(err);
  }
};

export const releaseReservation: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const rec = await reservationService.releaseReservation(id);
    return res.status(200).json({ status: 'success', data: rec });
  } catch (err) {
    return next(err);
  }
};
