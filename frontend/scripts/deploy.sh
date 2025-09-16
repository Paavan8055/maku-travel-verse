#!/usr/bin/env bash
set -euo pipefail

# Deploy database migrations and edge functions using Supabase CLI

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Please install it from https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

echo "🚀 Starting MAKU.Travel deployment..."
echo "Timestamp: $(date)"

# Verify edge functions integrity before deployment
echo "🔍 Verifying edge functions..."
if command -v deno >/dev/null 2>&1; then
  if ! deno run --allow-read --allow-write scripts/verify-edge-functions.ts; then
    echo "❌ Edge function verification failed. Use --auto-stub to create missing stubs."
    echo "Or run: deno run --allow-read --allow-write scripts/verify-edge-functions.ts --auto-stub"
    exit 1
  fi
else
  echo "⚠️  Deno not found. Skipping edge function verification."
fi

# Push database migrations
echo "📊 Deploying database migrations..."
supabase db push --non-interactive

# Deploy all edge functions with force flag to bust cache
echo "⚡ Deploying edge functions..."

# Get list of deployable functions
DEPLOYABLE_FUNCS=""
SKIPPED_FUNCS=""
FOUND_FUNCS=$(find supabase/functions -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort)

if [ -n "$FOUND_FUNCS" ]; then
  for dir in $FOUND_FUNCS; do
    func=$(basename "$dir")
    
    # Skip if disabled
    if [ -f "$dir/.disabled" ]; then
      SKIPPED_FUNCS="$SKIPPED_FUNCS $func(disabled)"
      continue
    fi
    
    # Check for entrypoint
    if [ -f "$dir/index.ts" ]; then
      DEPLOYABLE_FUNCS="$DEPLOYABLE_FUNCS $func"
    else
      SKIPPED_FUNCS="$SKIPPED_FUNCS $func(no-entrypoint)"
    fi
  done
  
  echo "📋 Functions to deploy:$(echo "$DEPLOYABLE_FUNCS" | tr ' ' '\n' | sort | tr '\n' ' ')"
  if [ -n "$SKIPPED_FUNCS" ]; then
    echo "⏭️  Skipped functions: $SKIPPED_FUNCS"
  fi
  
  # Deploy each function
  for func in $DEPLOYABLE_FUNCS; do
    echo "🚀 Deploying function: $func"
    if ! supabase functions deploy "$func" --project-ref "${SUPABASE_PROJECT_REF}" --no-verify-jwt; then
      echo "❌ Failed to deploy $func"
      exit 1
    fi
  done
else
  echo "📭 No function directories found to deploy"
fi

echo "✅ Deployment completed successfully!"
echo "🔍 Run 'scripts/validate-deployment.sh' to validate production readiness"
