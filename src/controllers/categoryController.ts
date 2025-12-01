import type { RequestHandler } from 'express';
import * as categoryService from '../services/categoryService.js';
import { AppError } from '../errors/AppError.js';

export const createCategory: RequestHandler = async (req, res, next) => {
  try {
    const created = await categoryService.createCategory(req.body);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};

export const listCategories: RequestHandler = async (req, res, next) => {
  try {
    const q = (req as any).validatedQuery ?? (req.query as any);
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 20);
    const result = await categoryService.listCategories({
      page,
      limit,
      q: q.q,
      parentId: q.parentId,
    });
    return res.status(200).json({
      status: 'success',
      data: result.items,
      meta: { total: result.total, page, limit },
    });
  } catch (err) {
    return next(err);
  }
};

export const getCategory: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const cat = await categoryService.getCategoryById(id);
    return res.status(200).json({ status: 'success', data: cat });
  } catch (err) {
    return next(err);
  }
};

export const updateCategory: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const updated = await categoryService.updateCategory(id, req.body);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

export const deleteCategory: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    await categoryService.deleteCategory(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
