import type { RequestHandler } from 'express';
import * as inventoryService from '../services/inventoryService.js';
import { AppError } from '../errors/AppError.js';

export const createEvent: RequestHandler = async (req, res, next) => {
  try {
    const created = await inventoryService.createInventoryEvent(req.body);
    return res.status(201).json({ status: 'success', data: created });
  } catch (err) {
    return next(err);
  }
};
