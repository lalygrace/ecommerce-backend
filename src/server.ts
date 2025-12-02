import { app } from './app.js';
import { env } from './config/env.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const server = app.listen(env.PORT, () => {
  // Basic startup log; replace with structured logger when added
  console.log(`Server listening on port ${env.PORT} (env: ${env.NODE_ENV})`);
});

// Periodic cleanup of unverified users older than a TTL (e.g., 24h) who never verified.
// This prevents storing accounts indefinitely when email verification is required.
const UNVERIFIED_TTL_HOURS = Number(
  process.env.UNVERIFIED_USER_TTL_HOURS || '24',
);
const CLEAN_INTERVAL_MINUTES = 60; // run hourly

async function cleanupUnverified() {
  const cutoff = new Date(Date.now() - UNVERIFIED_TTL_HOURS * 60 * 60 * 1000);
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        emailVerified: false,
        createdAt: { lt: cutoff },
      },
    });
    if (deleted.count) {
      console.log(
        `[cleanup] Removed ${deleted.count} stale unverified user(s)`,
      );
    }
  } catch (e) {
    console.error('[cleanup] Error pruning unverified users', e);
  }
}

setInterval(
  () => {
    void cleanupUnverified();
  },
  CLEAN_INTERVAL_MINUTES * 60 * 1000,
).unref();

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
