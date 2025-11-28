import type { RequestHandler } from 'express';
import * as orderService from '../services/orderService.js';
import { AppError } from '../errors/AppError.js';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../utils/auth.js';

export const createOrder: RequestHandler = async (req, res, next) => {
  try {
    // Prefer authenticated user id if available
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session && session.user && session.user.id) {
        req.body.customerId = req.body.customerId ?? session.user.id;
      }
    } catch (e) {
      // ignore session errors and proceed if customerId provided in payload
    }

    const created = await orderService.createOrder(req.body);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};

export const getOrder: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const order = await orderService.getOrderById(id);
    return res.status(200).json({ status: 'success', data: order });
  } catch (err) {
    return next(err);
  }
};

export const listOrders: RequestHandler = async (req, res, next) => {
  try {
    const q = (req as any).validatedQuery ?? (req.query as any);
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const customerId = q.customerId;
    const status = q.status;
    const result = await orderService.listOrders({
      page,
      limit,
      customerId,
      status,
    });
    return res
      .status(200)
      .json({
        status: 'success',
        data: result.items,
        meta: { total: result.total, page, limit },
      });
  } catch (err) {
    return next(err);
  }
};

export const updateOrder: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const updated = await orderService.updateOrder(id, req.body);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

export const deleteOrder: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    await orderService.deleteOrder(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
