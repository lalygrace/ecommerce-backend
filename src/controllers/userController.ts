import type { RequestHandler } from 'express';
import * as userService from '../services/userService.js';
import { AppError } from '../errors/AppError.js';

export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const created = await userService.createUser(req.body);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new AppError('Missing id parameter', 400, true));
    }
    const user = await userService.getUserById(id);
    return res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    return next(err);
  }
};

export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const q = (req as any).validatedQuery ?? (req.query as any);
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const role = q.role;
    const result = await userService.listUsers({ page, limit, role, q: q.q });
    return res.status(200).json({
      status: 'success',
      data: result.items,
      meta: { total: result.total, page, limit },
    });
  } catch (err) {
    return next(err);
  }
};

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const updated = await userService.updateUser(id, req.body);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    await userService.deleteUser(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
