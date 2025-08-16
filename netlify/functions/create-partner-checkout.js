const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { partnerType, orgName, contactEmail, userId } = JSON.parse(event.body || '{}');

  const base = (process.env.CURRENCY || 'aud').toLowerCase();
  const lkMap = {
    hotels_activities: `partner_hotels_activities_yearly_${base}`,
    airlines: `partner_airlines_yearly_${base}`,
  };
  const lookup_key = lkMap[partnerType];
  if (!lookup_key) return { statusCode: 400, body: 'Invalid partnerType' };

  const priceResult = await stripe.prices.list({ lookup_keys: [lookup_key], expand: ['data.product'] });
  if (!priceResult.data.length) return { statusCode: 400, body: 'Price not found' };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_creation: 'if_required',
    customer_email: contactEmail,
    line_items: [{ price: priceResult.data[0].id, quantity: 1 }],
    success_url: 'https://maku.travel/partners/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://maku.travel/partners/cancel',
    metadata: { userId, orgName, partnerType, kind: 'partner_onboarding' },
  });

  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
};
