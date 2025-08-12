# Payments — Stripe Checklist

- Secrets & Keys
  - [ ] STRIPE_SECRET_KEY set; [ ] STRIPE_WEBHOOK_SECRET configured in Supabase
  - [ ] Publishable key used only on client
- Webhooks
  - [ ] Verify signature with webhook secret; reject invalid
  - [ ] Idempotency: store event_id in webhook_events (unique) before processing
  - [ ] Handle payment_intent.succeeded/failed/processing, refund events
  - [ ] No PII in logs; use correlation IDs
- Client/Server Split
  - [ ] Create PaymentIntent/Checkout on edge function only
  - [ ] Metadata includes booking_id and user_id (if available)
- Verification & State
  - [ ] Post-redirect verification endpoint checks final status
  - [ ] Update payments + bookings atomically; consistent statuses
- Testing
  - [ ] Cover retries, duplicated events, network timeouts
  - [ ] Test cards and webhooks in Stripe test mode end-to-end
