import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../errors/AppError.js';

type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Validate an Express request target (`body`/`params`/`query`) with a Zod schema.
 * On success the parsed value replaces the original value on `req`.
 */
export const validateRequest = (
  schema: ZodTypeAny,
  options?: { target?: ValidationTarget },
): RequestHandler => {
  const target: ValidationTarget = options?.target ?? 'body';

  return (req, _res, next) => {
    try {
      const valueToValidate = (req as any)[target];
      const parsed = schema.parse(valueToValidate);
      // For `query` Express may expose a read-only getter; attach parsed
      // values to a namespaced property to avoid assignment errors.
      if (target === 'query') {
        (req as any).validatedQuery = parsed;
      } else {
        (req as any)[target] = parsed;
      }
      return next();
    } catch (err: unknown) {
      // In development include Zod details to aid debugging
      const devMessage =
        process.env.NODE_ENV !== 'production' &&
        err &&
        typeof (err as any).message === 'string'
          ? `Invalid request payload: ${(err as any).message}`
          : 'Invalid request payload';
      return next(new AppError(devMessage, 400, true));
    }
  };
};
