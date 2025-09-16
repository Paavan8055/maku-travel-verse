# Draft PR Notes (Do Not Merge)

This file tracks proposed fixes for top P0/P1 items. Each should be implemented on a short-lived branch and opened as a DRAFT PR with:
- Summary and acceptance criteria
- Risk/rollback plan
- Tests or logs demonstrating fix

Initial Drafts to Open:
1) payments/webhook-idempotency — add webhook_events table + handler guards
2) db/updated-at-and-indexes — apply generic updated_at trigger + key indexes
3) seo/sitemap-canonical — add sitemap, canonical tags, and per-route SEO helper
4) perf/image-optimizations — modern formats + width/height + lazy load
5) obs/sentry-corr-ids — Sentry FE + Edge and x-request-id propagation
