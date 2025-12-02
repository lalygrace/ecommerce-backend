import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt, bearer, oAuthProxy } from 'better-auth/plugins';
// Social provider config (google) added strictly per provided docs
// If your Prisma file is located elsewhere, you can change the path

const prisma = new PrismaClient();

// Build auth configuration with plugins (JWT + Bearer) and optional Google provider.
// Only include google provider if env vars exist to avoid misconfiguration.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

export const auth = betterAuth({
  // Ensure Better Auth constructs absolute URLs against the frontend
  baseURL,
  emailAndPassword: {
    enabled: true,
    // example of disabling auto sign-in if desired: autoSignIn: false,
  },
  trustedOrigins: ['http://localhost:3000'],
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
            // Ensure OAuth redirects target the frontend domain; Next.js rewrites will proxy to backend
            redirectURI: 'http://localhost:3000/api/auth/callback/google',
            // prompt can be added later if always selecting account is desired
          },
        }
      : undefined,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [
    // JWT plugin with secure payload definition (exclude password hash)
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          role: (user as any).role, // role is part of prisma user model
        }),
      },
    }),
    // Bearer plugin for non-cookie clients (mobile, external services)
    bearer(),
    // Proxy OAuth callbacks through the frontend in dev to avoid mismatched domains
    oAuthProxy({
      currentURL: baseURL,
      // If you deploy with a different production URL, set it here or via env
      productionURL: process.env.PRODUCTION_URL || baseURL,
    }),
  ],
});
