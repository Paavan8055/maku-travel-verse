# Maku Supabase Action

This repository contains a minimal **GPT Action** backend for Maku Travel.

The goal of this project is to expose a few simple REST endpoints backed by
Supabase so that a custom GPT can check a traveller's balance, top up their
account and retrieve their itineraries.  These endpoints are described by an
OpenAPI specification and are consumable by ChatGPT as a GPT Action.  A
legacy [`ai-plugin.json`](./server/.well-known/ai-plugin.json) is also
included for backwards compatibility with older ChatGPT plugin flows.

## Overview

The project is structured as follows:

```
maku-supabase-action/
├── server/
│   ├── app.py                # FastAPI server exposing your endpoints
│   ├── bootstrap.sql         # SQL to create minimal tables for testing
│   ├── openapi.yaml          # OpenAPI schema for the endpoints
│   ├── .env.example          # Template for environment variables
│   └── .well-known/
│       └── ai-plugin.json    # Plugin manifest (for legacy plugin flow)
└── requirements.txt          # Python dependencies for the server
```

### Server

The server uses **FastAPI** and **supabase-py** to connect to your Supabase
project.  It exposes three main endpoints:

1. **GET `/funds/balance`** – returns a traveller's current balance.
2. **POST `/funds/topup`** – tops up a traveller's funds by a given amount.
3. **GET `/itineraries/{user_id}`** – lists itineraries for a specific user.

There is also a `/healthz` endpoint for simple health checking.

### Bootstrap

Run the SQL in `bootstrap.sql` in your Supabase SQL editor to create a
minimal schema.  You can tighten RLS rules later; by default these tables
are publicly accessible (service role only).

### Environment

Copy `.env.example` to `.env` and fill in your own values:

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_BASE_URL=http://localhost:3333
ALLOWED_ORIGINS=http://localhost:3333
```

`SUPABASE_SERVICE_ROLE_KEY` should be kept secret and never exposed to
clients.  It is used by the backend only.  `APP_BASE_URL` and
`ALLOWED_ORIGINS` are used in the plugin manifest and CORS configuration.

### OpenAPI & Plugin Manifest

The API surface is defined in `openapi.yaml`.  You can import this file
directly into the ChatGPT “Actions” interface.  The plugin manifest
(`.well-known/ai-plugin.json`) points at the OpenAPI spec and contains some
human‑readable metadata.  Both files use `APP_BASE_URL` placeholders that
should match where you deploy the server.

## Running Locally

Create a Python virtual environment and install dependencies:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp server/.env.example server/.env  # fill in with your keys
uvicorn server.app:app --reload --port 3333
```

Visit `http://localhost:3333/healthz` to verify the server is running.

## Deploying

You can deploy this server to any platform that supports Python and
long‑running processes.  Common options include Railway, Render, Fly.io or
Vercel (using a serverless adapter).  Make sure to set the environment
variables described above on your host.

## Extending

To add new endpoints—e.g. for bookings, partner management or other
travel‑related operations—add FastAPI routes to `app.py` and update the
OpenAPI schema accordingly.  Don’t forget to adjust the database schema and
RLS policies as needed.
