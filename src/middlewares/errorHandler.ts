import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Default to 500 for unknown errors
  if (err instanceof AppError) {
    logger.error({ err }, 'Operational error');
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      // expose only when not production
      ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    });
  }

  // Unexpected errors
  logger.fatal({ err }, 'Unhandled error');
  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
}
