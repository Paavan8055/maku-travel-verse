#!/usr/bin/env bash
set -euo pipefail

# Deploy database migrations and edge functions using Supabase CLI

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Please install it from https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

# Push database migrations
supabase db push --non-interactive

# Deploy all edge functions
FUNCTIONS=$(ls supabase/functions)
if [ -n "$FUNCTIONS" ]; then
  supabase functions deploy $FUNCTIONS --project-ref "${SUPABASE_PROJECT_REF}" || exit 1
fi
