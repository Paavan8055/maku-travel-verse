const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { plan, userId, email } = JSON.parse(event.body || '{}');

  const baseCurrency = (process.env.CURRENCY || 'aud').toLowerCase();
  const lookupMap = {
    monthly: `bos_monthly_${baseCurrency}`,
    yearly: `bos_yearly_${baseCurrency}`,
  };
  const lookup_key = lookupMap[plan || 'monthly'];

  // Fetch price by lookup key
  const priceResult = await stripe.prices.list({ lookup_keys: [lookup_key], expand: ['data.product'] });
  if (!priceResult.data.length) return { statusCode: 400, body: 'Price not found' };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_creation: 'if_required',
    customer_email: email,
    line_items: [{ price: priceResult.data[0].id, quantity: 1 }],
    success_url: 'https://maku.travel/checkout/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://maku.travel/checkout/cancel',
    metadata: { userId, kind: 'customer_bos' },
  });

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
};
