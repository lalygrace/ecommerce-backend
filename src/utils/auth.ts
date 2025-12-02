import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt, bearer } from 'better-auth/plugins';
// Social provider config (google) added strictly per provided docs
// If your Prisma file is located elsewhere, you can change the path

const prisma = new PrismaClient();

// Build auth configuration with plugins (JWT + Bearer) and optional Google provider.
// Only include google provider if env vars exist to avoid misconfiguration.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
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
  ],
});
