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
# Only deploy directories that contain an index.ts entrypoint
FOUND_FUNCS=$(find supabase/functions -maxdepth 1 -mindepth 1 -type d)
if [ -n "$FOUND_FUNCS" ]; then
  for dir in $FOUND_FUNCS; do
    func=$(basename "$dir")
    if [ -f "$dir/index.ts" ]; then
      echo "Deploying function: $func"
      supabase functions deploy "$func" --project-ref "${SUPABASE_PROJECT_REF}" --no-verify-jwt || exit 1
    else
      echo "Skipping $func (no index.ts entrypoint)"
    fi
  done
else
  echo "No function directories found to deploy"
fi

echo "✅ Deployment completed successfully!"
echo "🔍 Run 'scripts/validate-deployment.sh' to validate production readiness"
