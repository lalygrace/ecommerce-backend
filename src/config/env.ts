import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a number')
    .transform((v: string) => parseInt(v, 10))
    .default('3000' as unknown as number),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required')
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with helpful error messages
  const issues = parsed.error.issues
    .map((i: { path: (string | number)[]; message: string }) => `${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
