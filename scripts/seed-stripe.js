// scripts/seed-stripe.js
// Usage: STRIPE_SECRET_KEY=sk_test_... CURRENCY=aud node scripts/seed-stripe.js
const Stripe = require('stripe');
const CURRENCY = (process.env.CURRENCY || 'aud').toLowerCase();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const defs = [
  {
    product: { name: 'BOS Pro', description: 'Breakthrough Operating System subscription (test mode)', metadata: { category: 'customer' } },
    prices: [
      { lookup_key: `bos_monthly_${CURRENCY}`, recurring: { interval: 'month' }, unit_amount: 900, currency: CURRENCY },
      { lookup_key: `bos_yearly_${CURRENCY}`,  recurring: { interval: 'year'  }, unit_amount: 9900, currency: CURRENCY },
    ],
  },
  {
    product: { name: 'Partner Onboarding — Hotels & Activities', description: 'Annual onboarding & partner services (test mode)', metadata: { category: 'partner', type: 'hotels_activities' } },
    prices: [
      { lookup_key: `partner_hotels_activities_yearly_${CURRENCY}`, recurring: { interval: 'year' }, unit_amount: 33300, currency: CURRENCY },
    ],
  },
  {
    product: { name: 'Partner Onboarding — Airlines', description: 'Annual onboarding & premium partner services (test mode)', metadata: { category: 'partner', type: 'airlines', tier: 'premium' } },
    prices: [
      { lookup_key: `partner_airlines_yearly_${CURRENCY}`, recurring: { interval: 'year' }, unit_amount: 999900, currency: CURRENCY },
    ],
  },
];

async function upsert() {
  for (const def of defs) {
    // Find or create product by name
    const list = await stripe.products.list({ limit: 100, active: true });
    let product = list.data.find(p => p.name === def.product.name);
    if (!product) product = await stripe.products.create(def.product);

    // Ensure prices by lookup key
    for (const p of def.prices) {
      // find by lookup_key (needs list with active=false too)
      const plist = await stripe.prices.list({ product: product.id, limit: 100, active: true });
      let price = plist.data.find(x => x.lookup_key === p.lookup_key);
      if (!price) {
        await stripe.prices.create({ ...p, product: product.id });
        console.log(`Created price ${p.lookup_key} for ${def.product.name}`);
      } else {
        console.log(`Exists: ${p.lookup_key}`);
      }
    }
  }
}

upsert().then(()=>console.log('Done (TEST mode).')).catch(e=>{console.error(e);process.exit(1);});
