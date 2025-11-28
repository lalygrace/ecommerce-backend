import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './errors/AppError.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './utils/auth.js';

const app = express();

// Mount Better Auth handler for all auth routes under /api/auth
// Use `app.use` so subpaths are matched without path-to-regexp `*` issues.
// Mount Better Auth handler for all auth routes under /api/auth
// Option A (preferred): mount using `app.use` to match subpaths for all methods.
// app.use('/api/auth', toNodeHandler(auth));

// Option B: use a named catch-all pattern compatible with Express v5 / path-to-regexp.
// This accepts any subpath and captures it as the `any` parameter.
// Express v5 / path-to-regexp newer syntax supports a named catch-all
// using curly braces. If you prefer the documentation's recommendation:
app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Test route to demonstrate error handling
app.get('/error', (_req: Request, _res: Response, next: NextFunction) => {
  // simulate an operational error
  return next(new AppError('Example operational error', 400));
});

// Catch-all for 404
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Not Found', 404));
});

// Centralized error handler
app.use(errorHandler);

export { app };
