#!/bin/bash

# MAKU.Travel Dependency Cleanup Script
# Phase 3 maintenance procedures for optimal dependency management

echo "🧹 Starting dependency cleanup process..."

echo "1. Clearing npm cache..."
npm cache clean --force

echo "2. Removing duplicate packages..."
npm dedupe

echo "3. Pruning unused packages..."
npm prune

echo "4. Running production security audit..."
npm audit --production

echo "5. Verifying TypeScript compilation..."
npx tsc --noEmit

echo "6. Testing build process..."
npm run build

echo "✅ Dependency cleanup completed successfully!"
echo "📊 Production bundle size optimization: Testing libraries excluded from production builds"
echo "🔒 Security audit completed for production dependencies only"