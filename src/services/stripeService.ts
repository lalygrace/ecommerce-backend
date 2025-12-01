import Stripe from 'stripe';
import { env } from '../config/env.js';

const key = env.STRIPE_SECRET_KEY;
if (!key) {
  // In non-production tests this may be undefined. Consumers should handle missing key.
  // We still export a placeholder that will throw if used without configuration.
}

export const stripe = key
  ? new Stripe(key, { apiVersion: '2022-11-15' })
  : (null as unknown as Stripe);

export const isStripeConfigured = () => Boolean(env.STRIPE_SECRET_KEY);
