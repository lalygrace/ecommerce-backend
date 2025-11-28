import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './errors/AppError.js';

const app = express();

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
