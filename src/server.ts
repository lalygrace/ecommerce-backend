import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  // Basic startup log; replace with structured logger when added
  console.log(`Server listening on port ${env.PORT} (env: ${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force exit if not closed within timeout
  setTimeout(() => {
    console.error('Force exiting after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
