#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Validating deployment readiness..."

# Check if critical dependency versions are correct
echo "📦 Checking dependency versions..."

# Check date-fns version
DATE_FNS_VERSION=$(npm list date-fns --depth=0 2>/dev/null | grep date-fns | cut -d'@' -f2 | cut -d' ' -f1 || echo "not found")
if [[ "$DATE_FNS_VERSION" == 4.1.* ]]; then
    echo "✅ date-fns: $DATE_FNS_VERSION"
else
    echo "❌ date-fns version incorrect: $DATE_FNS_VERSION (expected 4.1.x)"
    exit 1
fi

# Check react-leaflet version  
REACT_LEAFLET_VERSION=$(npm list react-leaflet --depth=0 2>/dev/null | grep react-leaflet | cut -d'@' -f2 | cut -d' ' -f1 || echo "not found")
if [[ "$REACT_LEAFLET_VERSION" == 4.2.1* ]]; then
    echo "✅ react-leaflet: $REACT_LEAFLET_VERSION"
else
    echo "❌ react-leaflet version incorrect: $REACT_LEAFLET_VERSION (expected 4.2.1)"
    exit 1
fi

# Check @react-leaflet/core version
REACT_LEAFLET_CORE_VERSION=$(npm list @react-leaflet/core --depth=0 2>/dev/null | grep @react-leaflet/core | cut -d'@' -f3 | cut -d' ' -f1 || echo "not found")
if [[ "$REACT_LEAFLET_CORE_VERSION" == 2.1.0* ]]; then
    echo "✅ @react-leaflet/core: $REACT_LEAFLET_CORE_VERSION"
else
    echo "❌ @react-leaflet/core version incorrect: $REACT_LEAFLET_CORE_VERSION (expected 2.1.0)"
    exit 1
fi

echo "🎉 All dependency versions are correct!"

# Validate edge functions integrity
echo "🔍 Validating edge functions integrity..."
if command -v deno >/dev/null 2>&1; then
  if deno run --allow-read scripts/verify-edge-functions.ts; then
    echo "✅ All edge functions have proper entrypoints"
  else
    echo "❌ Some edge functions are missing entrypoints"
    echo "💡 Run with --auto-stub to create missing stubs automatically"
    exit 1
  fi
else
  echo "⚠️  Deno not found. Skipping edge function verification."
fi

echo "🚀 Deployment validation successful!"