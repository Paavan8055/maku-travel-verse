#!/usr/bin/env bash
set -euo pipefail

# Deploy database migrations and edge functions using Supabase CLI

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Please install it from https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

echo "🚀 Starting MAKU.Travel deployment..."
echo "Timestamp: $(date)"

# Push database migrations
echo "📊 Deploying database migrations..."
supabase db push --non-interactive

# Deploy all edge functions with force flag to bust cache
echo "⚡ Deploying edge functions..."
FUNCTIONS=$(ls supabase/functions)
if [ -n "$FUNCTIONS" ]; then
  # Force redeploy all functions to ensure latest code is active
  for func in $FUNCTIONS; do
    echo "Deploying function: $func"
    supabase functions deploy "$func" --project-ref "${SUPABASE_PROJECT_REF}" --no-verify-jwt || exit 1
  done
else
  echo "No functions found to deploy"
fi

echo "✅ Deployment completed successfully!"
echo "🔍 Run 'scripts/validate-deployment.sh' to validate production readiness"
