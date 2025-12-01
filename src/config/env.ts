import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Build a normalized env object first so we can accept either MONGO_URI or DATABASE_URL
const rawEnv = {
  ...process.env,
  MONGO_URI: process.env.MONGO_URI ?? process.env.DATABASE_URL,
};

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z
    .string()
    .optional()
    .refine((v) => v === undefined || /^\d+$/.test(v), {
      message: 'PORT must be a number',
    })
    .transform((v) => (v === undefined ? 3000 : parseInt(v as string, 10))),
  MONGO_URI: z.string().min(1, 'MONGO_URI (or DATABASE_URL) is required'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = EnvSchema.safeParse(rawEnv);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i: any) => `${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
