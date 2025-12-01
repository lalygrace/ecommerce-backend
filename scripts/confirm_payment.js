import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('Missing STRIPE_SECRET_KEY in .env');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15' });

const [, , orderId, amountArg] = process.argv;
const amount = amountArg ? parseInt(amountArg, 10) : 1500;

if (!orderId) {
  console.error(
    'Usage: node scripts/confirm_payment.js <orderId> [amountCents]',
  );
  process.exit(1);
}

(async () => {
  try {
    console.log(
      'Creating PaymentIntent for order:',
      orderId,
      'amount:',
      amount,
    );
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { orderId },
      payment_method_types: ['card'],
    });

    console.log('Created PaymentIntent:', intent.id);

    console.log(
      'Confirming PaymentIntent using test payment method: pm_card_visa',
    );
    const confirmed = await stripe.paymentIntents.confirm(intent.id, {
      payment_method: 'pm_card_visa',
    });

    console.log('Confirmed PaymentIntent status:', confirmed.status);
    console.log('Full object:');
    console.log(JSON.stringify(confirmed, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error creating/confirming PaymentIntent:', err);
    process.exit(1);
  }
})();
