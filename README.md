# Maku Travel OTA

[![CI](https://github.com/Paavan8055/maku-travel-verse/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Paavan8055/maku-travel-verse/actions/workflows/ci.yml)

- Maku Travel is an open-source Online Travel Agency built with Vite, React and Supabase. It provides a unified booking experience for flights, hotels and activities while monitoring provider health and costs in real time.

## Features
- Search and book flights, hotels and activities
- Personalized offers and saved travel preferences
- Stripe-powered checkout with vaulted payment methods
- Provider rotation, quota monitoring and circuit breakers
- Admin dashboard for system metrics and provider analytics

## Maku Travel OTA — CTO Overview, Audit & Build Guide

Maku Travel is an open-source Online Travel Agency (OTA) built with Vite, React and Supabase. This document serves two purposes:

- A practical developer guide: how to build, run and deploy the project locally and to common hosts.
- A CTO-style audit and prioritized recommendations for security, reliability, and developer experience.

If you were handed this repository as the engineering lead, read the "CTO audit & recommendations" section first (it contains high-impact, prioritized items).

---

## Quick start (developer)

1. Install Node & npm (Node 18+, npm 10 recommended). Use nvm if needed.
1. Install JS deps:

```bash
npm install
```

1. Frontend env (create `.env.local` in repo root):

```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

1. Start dev server:

```bash
npm run dev
```

1. Serve Edge Functions (locally) one at a time:

```bash
supabase functions serve <function> --env-file supabase/.env
```

1. FastAPI action (optional, used for GPT action / small API):

```bash
# from repository root
cd maku-supabase-action
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp server/.env.example server/.env  # fill in values
uvicorn server.app:app --reload --port 3333
```

1. Tests & linting:

```bash
npm test
npm run lint
```

---

## Build & deploy (summary)

- Frontend (Netlify, Vercel, static): `npm run build` → publish `dist/`.
- Supabase (edge functions & DB): `supabase db push` and `supabase functions deploy <function>` (or use `./scripts/deploy.sh`).
- Python action: deploy to any Python host (Railway, Render, Fly, or container). Ensure `SUPABASE_SERVICE_ROLE_KEY` is set as a secret.

---

## Environment variables (where to put them)

- Frontend: `.env.local` in repo root (Vite reads VITE_ prefixed vars).
- Edge functions: `supabase/.env` (copy from a project-specific template). The README previously recommended copying `.env.example` to `supabase/.env` — maintain that practice but keep sensitive keys out of source control.
- maku-supabase-action: `maku-supabase-action/server/.env` (copy from `server/.env.example`).

Example edge-function variables (do not commit):

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
AMADEUS_CLIENT_ID=...
AMADEUS_CLIENT_SECRET=...
HOTELBEDS_API_KEY=...
HOTELBEDS_API_SECRET=...
SABRE_CLIENT_ID=...
SABRE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...
```

---

## CTO audit — current state (condensed)

Findings based on the repo:

- Frontend: Vite + React, well-structured. `package.json` includes dev, build, preview and test scripts.
- Edge functions: Very large set under `supabase/functions` and a `supabase/config.toml` that configures per-function `verify_jwt` flags. Most functions are present and some require JWT verification.
- Secrets & env: README already instructs copying `.env.example` to `supabase/.env`. There is not a single canonical `.env.example` at the repo root covering all services (some action subfolders have their own examples).
- Small Python FastAPI action exists under `maku-supabase-action/` with `requirements.txt` and `server/.env.example`.

Risk & operational concerns:

- Edge function attack surface: Many edge functions are exposed and the config toggles `verify_jwt`. Misconfigured functions (verify_jwt=false) may expose sensitive provider endpoints. The presence of `verify_jwt` flags indicates security hardening is in flight.
- Secrets handling: Service role keys and provider secrets must never be committed. The repo relies on local `.env` files but lacks a single developer-friendly `.env.example` at root.
- Testing & CI: `vitest` is present, but there's no visible CI workflow in this repo snapshot. Adding CI that runs lint/test/build and a lightweight security scan will catch regressions early.
- Observability: There are functions for enhanced logging and monitoring, but it's unclear if the default deployment wires logs/metrics to a single observability stack.

---

## CTO recommendations (prioritized)

High priority (P0/P1) — fix within 1 sprint

1. (P0) Secrets & deploy-time config

- Add a single `env.example` at repository root listing required variables for frontend, supabase functions, and the FastAPI action (non-secret placeholders). Keep provider secrets out of source control.
- Enforce a pre-commit hook (husky or a CI check) that blocks accidental commits of `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` literals.

1. (P0) Harden edge functions with consistent JWT verification

- Audit all functions marked `verify_jwt = false` in `supabase/config.toml` and confirm they are intentionally public. For any function that touches bookings/payments/provider credentials, set `verify_jwt = true` and perform a migration/test to avoid breaking integrations.
- Add a short unit/integration test that attempts an unauthenticated request to critical endpoints and asserts 401/403.

1. (P1) CI pipeline (lint, test, build, secrets scan)

- Create CI (GitHub Actions) that runs: `npm ci`, `npm run lint`, `npm test`, `npm run build` for PRs. Add a step to scan for leaked secrets (truffleHog/secretlint) and to fail PR if the scan finds likely secrets.

Medium priority (P2) — plan for next 2 sprints

1. (P2) Observability & alerting

- Ensure server logs (edge functions + backend) are routed to a centralized log store (e.g., Datadog/Logflare/Sentry). Add error-rate alerts for booking/payment flows.

1. (P2) Rate limiting and circuit breakers

- Add/confirm rate-limiting middleware on functions that call external provider APIs. Implement exponential backoff and local caching for high-cost provider calls.

Lower priority (P3) — backlog

1. (P3) Developer DX improvements

- Add `make` or `scripts/dev-setup.sh` to bootstrap `.env` stubs and run the dev environment in a single step.
- Provide `docker-compose` for the supabase local stack for contributors who don't want to install the CLI.

---

## Recommended immediate action plan (tickets)

Below are actionable tickets with acceptance criteria. Treat the P0 items as blockers for release.

- TICKET-001 (P0) Add root `env.example`
  - Create `/env.example` listing all env keys required by frontend, `supabase` and `maku-supabase-action`. Use placeholder values and short comments. Do not include secrets.
  - Acceptance: `cp env.example .env.local` and `cp supabase/.env.example supabase/.env` provide a complete dev environment after the contributor fills values.

- TICKET-002 (P0) Prevent secrets commit
  - Add git pre-commit hook and CI check using `secretlint` or `git-secrets` to fail on likely secrets. Add documentation in `CONTRIBUTING.md`.
  - Acceptance: Creating a test commit containing `SUPABASE_SERVICE_ROLE_KEY=abc123` fails locally and in CI.

- TICKET-003 (P0) Audit & enforce JWT on critical functions
  - Create a script to parse `supabase/config.toml` and generate a report of functions with `verify_jwt=false` and their file durations; mark functions that handle bookings/payments.
  - Acceptance: All payment/booking functions are `verify_jwt = true` or have documented justification.

- TICKET-004 (P1) CI pipeline
  - Add GitHub Actions workflow that runs lint/test/build and a secrets scan on PRs. Provide badges in README.
  - Acceptance: A PR triggers the workflow and the results are visible in checks.

---

## How to contribute safely

- Never commit `.env` or any file with secrets. Add `.env` to `.gitignore` if not already present.
- Use the root `env.example` and copy to `.env.local`/`supabase/.env` as needed.
- Run `npm run lint` and `npm test` before submitting PRs.

---

## Developer checklist (quick)

- [ ] Setup: `npm install` and `cp env.example .env.local` then edit values
- [ ] Start dev: `npm run dev`
- [ ] Local functions: `supabase functions serve <function> --env-file supabase/.env`
- [ ] Run Python action (optional): see `maku-supabase-action/README.md`
- [ ] Tests: `npm test`

---

## Appendix: useful commands

Frontend dev & build

```bash
npm install
npm run dev        # development server
npm run build      # production build -> dist/
npm run preview    # preview a production build locally
```

Supabase edge functions

```bash
supabase functions serve <function> --env-file supabase/.env
supabase functions deploy <function> --project-ref YOUR_REF
supabase db push
```

Python FastAPI action (maku-supabase-action)

```bash
cd maku-supabase-action
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp server/.env.example server/.env
uvicorn server.app:app --reload --port 3333
```

---

If you'd like, I can open a PR that implements the following immediately:

1. Add `/env.example` at repo root (P0).
2. Add a GitHub Actions workflow for lint/test/build and a secrets scan (P1).
3. Add a short script to report `verify_jwt` mismatches in `supabase/config.toml` (P0 analysis helper).

Mark which of the three you'd like me to implement now and I will create the changes and run quick validation.
