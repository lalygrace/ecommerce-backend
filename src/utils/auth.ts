import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt, bearer, oAuthProxy } from 'better-auth/plugins';
import { sendEmail } from './email.js';
import { buildVerificationEmail } from './emailTemplates.js';
// Social provider config (google) added strictly per provided docs
// If your Prisma file is located elsewhere, you can change the path

const prisma = new PrismaClient();

// Build auth configuration with plugins (JWT + Bearer) and optional Google provider.
// Only include google provider if env vars exist to avoid misconfiguration.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

// We cast some options to `any` where the docs omit exact shapes, to keep implementation aligned and non-breaking.
export const auth = betterAuth({
  baseURL,
  emailAndPassword: { enabled: true },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    requireEmailVerification: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url, token }: any, _request: any) {
      // Debug logging to ensure callback fires
      // eslint-disable-next-line no-console
      console.log('[emailVerification] sendVerificationEmail invoked', {
        userEmail: user?.email,
        hasUrl: !!url,
        snippet: typeof url === 'string' ? url.slice(0, 80) : undefined,
        tokenPresent: !!token,
      });
      if (!user?.email || !url) {
        // eslint-disable-next-line no-console
        console.warn(
          '[emailVerification] Missing user email or url, aborting send',
        );
        return;
      }
      const preferredBase =
        process.env.BETTER_AUTH_URL || 'http://localhost:3000';
      let finalUrl = url;
      try {
        const u = new URL(url);
        const f = new URL(preferredBase);
        // Keep path + query from generated URL, swap to frontend origin
        finalUrl = `${f.origin}${u.pathname}${u.search}`;
      } catch {
        // Fallback replacement for local dev ports
        finalUrl = url.replace(
          'http://localhost:4000',
          'http://localhost:3000',
        );
      }
      const { subject, html, text } = buildVerificationEmail({
        appName: process.env.APP_NAME || 'Ecommerce',
        verifyUrl: finalUrl,
        supportEmail: process.env.SUPPORT_EMAIL,
      });
      await sendEmail({ to: user.email, subject, html, text });
      // eslint-disable-next-line no-console
      console.log('[emailVerification] Verification email dispatch attempted');
    },
    async afterEmailVerification(user: any, _request: any) {
      // eslint-disable-next-line no-console
      console.log('Email verified for user', user?.id || user?.email);
    },
  },
  trustedOrigins: ['http://localhost:3000'],
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
            redirectURI: 'http://localhost:3000/api/auth/callback/google',
          },
        }
      : undefined,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  plugins: [
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          role: (user as any).role,
        }),
      },
    }),
    bearer(),
    oAuthProxy({
      currentURL: baseURL,
      productionURL: process.env.PRODUCTION_URL || baseURL,
    }),
  ],
} as any);
