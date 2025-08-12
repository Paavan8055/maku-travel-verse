-- Security hardening: idempotency constraints for Stripe-related records
BEGIN;

-- Ensure one payment record per Stripe Payment Intent
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_stripe_pi
ON public.payments (stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Prevent duplicate fund transaction sessions
CREATE UNIQUE INDEX IF NOT EXISTS ux_fund_txn_stripe_session
ON public.fund_transactions (stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

COMMIT;