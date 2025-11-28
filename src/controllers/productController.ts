import type { RequestHandler } from 'express';
import * as productService from '../services/productService.js';
import { AppError } from '../errors/AppError.js';

export const createProduct: RequestHandler = async (req, res, next) => {
  try {
    const created = await productService.createProduct(req.body);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};

export const getProduct: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const product = await productService.getProductById(id);
    return res.status(200).json({ status: 'success', data: product });
  } catch (err) {
    return next(err);
  }
};

export const listProducts: RequestHandler = async (req, res, next) => {
  try {
    const query = (req as any).validatedQuery ?? (req.query as any);
    const { page = 1, limit = 20, q, vendorId, category, status } = query;
    const result = await productService.listProducts({
      page: Number(page),
      limit: Number(limit),
      q,
      vendorId,
      category,
      status,
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

export const updateProduct: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    const updated = await productService.updateProduct(id, req.body);
    return res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

export const deleteProduct: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return next(new AppError('Missing id parameter', 400, true));
    await productService.deleteProduct(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
