import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma.js';

beforeAll(async () => {
  // Ensure prisma client is connected before tests
  await prisma.$connect();
});

afterAll(async () => {
  // Close prisma connection after tests
  await prisma.$disconnect();
});
