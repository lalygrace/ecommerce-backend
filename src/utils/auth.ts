import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt, bearer, oAuthProxy, emailOTP } from 'better-auth/plugins';
import { sendEmail } from './email.js';
import { buildVerificationEmail } from './emailTemplates.js';
// Social provider config (google) added strictly per provided docs
// If your Prisma file is located elsewhere, you can change the path

const prisma = new PrismaClient();

// In-memory resend rate limiter for OTP emails (dev-friendly).
// Keyed by email; values are arrays of timestamps (ms) when a resend occurred.
const resendTracker = new Map<string, number[]>();
const RESEND_MIN_INTERVAL_SECONDS = Number(process.env.RESEND_MIN_INTERVAL_SECONDS || '60');
const RESEND_MAX_PER_WINDOW = Number(process.env.RESEND_MAX_PER_WINDOW || '3');
const RESEND_WINDOW_MINUTES = Number(process.env.RESEND_WINDOW_MINUTES || '15');

// Build auth configuration with plugins (JWT + Bearer) and optional Google provider.
// Only include google provider if env vars exist to avoid misconfiguration.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

// We cast some options to `any` where the docs omit exact shapes, to keep implementation aligned and non-breaking.
export const auth = betterAuth({
  baseURL,
  emailAndPassword: { enabled: true },
  // Keep link-based verification config minimal; override to OTP flow via plugin
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    requireEmailVerification: true,
    autoSignInAfterVerification: true,
    async afterEmailVerification(user: any) {
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
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 60,
      allowedAttempts: 5,
      disableSignUp: true,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        // eslint-disable-next-line no-console
        console.log('[emailOTP] sendVerificationOTP', { email, type });

        // Simple resend throttle: enforce min interval and max per window.
        try {
          if (email) {
            const now = Date.now();
            const windowStart = now - RESEND_WINDOW_MINUTES * 60 * 1000;
            const history = (resendTracker.get(email) || []).filter((t) => t > windowStart);
            if (history.length >= RESEND_MAX_PER_WINDOW) {
              const err: any = new Error('TOO_MANY_REQUESTS: Too many resend attempts. Please try later.');
              err.code = 'TOO_MANY_REQUESTS';
              throw err;
            }
            const last = history[history.length - 1];
            if (last && now - last < RESEND_MIN_INTERVAL_SECONDS * 1000) {
              const wait = Math.ceil((RESEND_MIN_INTERVAL_SECONDS * 1000 - (now - last)) / 1000);
              const err: any = new Error(`Please wait ${wait}s before requesting a new code.`);
              err.code = 'TOO_SOON';
              throw err;
            }
            // Record this send
            history.push(now);
            resendTracker.set(email, history);
          }
        } catch (throttleErr) {
          // Surface throttle errors to the caller.
          throw throttleErr;
        }

        // Build purpose-tailored email
        const { buildOtpEmail } = await import('./emailTemplates.js');
        const { subject, html, text } = buildOtpEmail({
          appName: process.env.APP_NAME || 'Ecommerce',
          otp,
          type: type as any,
          supportEmail: process.env.SUPPORT_EMAIL,
          expiresInSeconds: 300,
        });
        // Fire and forget; do not await to avoid timing attacks
        void sendEmail({ to: email, subject, html, text }).catch((e) => {
          // eslint-disable-next-line no-console
          console.error('[emailOTP] sendEmail error', e);
        });
      },
    }),
  ],
} as any);
