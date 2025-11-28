import type { RequestHandler } from 'express';
import * as couponService from '../services/couponService.js';
import { AppError } from '../errors/AppError.js';

export const createCoupon: RequestHandler = async (req, res, next) => {
  try {
    const created = await couponService.createCoupon(req.body);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};

export const listCoupons: RequestHandler = async (req, res, next) => {
  try {
    const query = (req as any).validatedQuery ?? (req.query as any);
    const { page = 1, limit = 20, active } = query;
    const result = await couponService.listCoupons({
      page: Number(page),
      limit: Number(limit),
      active,
    });
    return res
      .status(200)
      .json({
        status: 'success',
        data: result.items,
        meta: { total: result.total },
      });
  } catch (err) {
    return next(err);
  }
};

export const getCoupon: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const rec = await couponService.getCouponById(id);
    if (!rec) return next(new AppError('Not found', 404, true));
    return res.status(200).json({ status: 'success', data: rec });
  } catch (err) {
    return next(err);
  }
};

export const updateCoupon: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const updated = await couponService.updateCoupon(id, req.body);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

export const deleteCoupon: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    await couponService.deleteCoupon(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

export const validateCoupon: RequestHandler = async (req, res, next) => {
  try {
    const result = await couponService.validateAndApply(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    return next(err);
  }
};
