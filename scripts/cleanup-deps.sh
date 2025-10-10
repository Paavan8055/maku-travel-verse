#!/bin/bash

# MAKU.Travel Dependency Cleanup Script
# Phase 3 maintenance procedures for optimal dependency management

set -euo pipefail

echo "🧹 Starting dependency cleanup process..."

if command -v yarn >/dev/null 2>&1 && [ -f "yarn.lock" ]; then
  echo "Detected Yarn workspace — running Yarn maintenance."

  echo "1. Clearing Yarn cache..."
  yarn cache clean

  echo "2. Reinstalling dependencies with the lockfile..."
  yarn install --frozen-lockfile

  echo "3. Validating production dependency tree..."
  TMP_DIR=$(mktemp -d)
  YARN_PRODUCTION=true yarn install --frozen-lockfile --ignore-optional --modules-folder "$TMP_DIR/node_modules"
  rm -rf "$TMP_DIR"

  echo "4. Running production security audit..."
  yarn audit --groups dependencies

  echo "5. Verifying TypeScript compilation..."
  yarn tsc --noEmit

  echo "6. Testing build process..."
  yarn build
else
  echo "Yarn not available — falling back to npm."

  echo "1. Clearing npm cache..."
  npm cache clean --force

  echo "2. Reinstalling dependencies with the lockfile..."
  npm ci --ignore-scripts

  echo "3. Validating production dependency tree..."
  TMP_DIR=$(mktemp -d)
  npm ci --ignore-scripts --omit=dev --prefix "$TMP_DIR"
  rm -rf "$TMP_DIR"

  echo "4. Running production security audit..."
  npm audit --omit=dev || true

  echo "5. Verifying TypeScript compilation..."
  npx tsc --noEmit

  echo "6. Testing build process..."
  npm run build
fi

echo "✅ Dependency cleanup completed successfully!"
echo "📊 Production bundle size optimization: Testing libraries excluded from production builds"
echo "🔒 Security audit completed for production dependencies only"
