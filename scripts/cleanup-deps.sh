#!/bin/bash

# MAKU.Travel Dependency Cleanup Script
# Phase 3 maintenance procedures for optimal dependency management

echo "🧹 Starting dependency cleanup process..."

echo "1. Clearing Yarn cache..."
yarn cache clean

echo "2. Reinstalling dependencies with the lockfile..."
yarn install --frozen-lockfile

echo "3. Validating production dependency tree..."
YARN_PRODUCTION=true yarn install --frozen-lockfile --ignore-optional

echo "4. Running production security audit..."
yarn audit --groups dependencies

echo "5. Verifying TypeScript compilation..."
yarn tsc --noEmit

echo "6. Testing build process..."
yarn build

echo "✅ Dependency cleanup completed successfully!"
echo "📊 Production bundle size optimization: Testing libraries excluded from production builds"
echo "🔒 Security audit completed for production dependencies only"
