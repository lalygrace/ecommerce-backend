import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './errors/AppError.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './utils/auth.js';
import userRoutes from './routes/userRoutes.js';
import meRoutes from './routes/meRoutes.js';
import productRoutes from './routes/productRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { requestContext } from './middlewares/requestContext.js';

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
// Mount Better Auth handler before JSON parsing.
// Using Express v5 recommended catch-all pattern per provided docs.
app.all('/api/auth/*splat', toNodeHandler(auth));

// Attach correlationId and child logger early (after auth handler so auth can run raw)
app.use(requestContext);
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', meRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/sellers', sellerRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/carts', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);

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
