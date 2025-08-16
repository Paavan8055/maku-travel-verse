const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let evt;
  try {
    evt = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const handle = async () => {
    switch (evt.type) {
      case 'checkout.session.completed': {
        const s = evt.data.object;
        const meta = s.metadata || {};
        if (meta.kind === 'customer_bos') {
          await supabase.from('profiles').update({
            subscription_status: 'active',
            plan: 'bos',
            stripe_customer_id: s.customer,
          }).eq('id', meta.userId);
        }
        if (meta.kind === 'partner_onboarding') {
          await supabase.from('partners').upsert({
            user_id: meta.userId || null,
            organization_name: meta.orgName || null,
            partner_type: meta.partnerType || null,
            subscription_status: 'active',
            stripe_customer_id: s.customer,
            subscription_id: s.subscription,
            current_period_end: null,
          }, { onConflict: 'organization_name' });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        const sub = evt.data.object;
        const status = evt.type === 'customer.subscription.deleted' ? 'canceled' : sub.status;
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        await supabase.from('partners').update({
          subscription_status: status,
          subscription_id: sub.id,
          current_period_end: periodEnd,
        }).eq('stripe_customer_id', sub.customer);
        await supabase.from('profiles').update({
          subscription_status: status,
          current_period_end: periodEnd,
        }).eq('stripe_customer_id', sub.customer);
        break;
      }
      default:
        break;
    }
  };
  await handle();
  return { statusCode: 200, body: 'ok' };
};
