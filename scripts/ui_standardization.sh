#!/bin/bash

# UI/UX Standardization Script for Maku.Travel
# Replaces gray backgrounds with white, removes purple/black accents

echo "🎨 Starting UI/UX Standardization..."

# Phase 1: Background Standardization
echo "📋 Phase 1: Replacing gray backgrounds with white..."

# Find all TSX files with gray backgrounds
find /app/frontend/src -type f -name "*.tsx" | while read file; do
    # Skip node_modules
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    
    # Count replacements
    count_before=$(grep -c "bg-gray-50\|bg-gray-100" "$file" 2>/dev/null || echo 0)
    
    if [ "$count_before" -gt 0 ]; then
        echo "  Processing: $file ($count_before instances)"
        
        # Replace bg-gray-50 with bg-white (but keep text-gray, border-gray)
        sed -i 's/bg-gray-50/bg-white/g' "$file"
        sed -i 's/bg-gray-100/bg-white/g' "$file"
        
        # Replace hover:bg-gray-50 with hover:bg-orange-50
        sed -i 's/hover:bg-gray-50/hover:bg-orange-50/g' "$file"
        sed -i 's/hover:bg-gray-100/hover:bg-orange-50/g' "$file"
    fi
done

echo "✅ Phase 1 Complete"

# Phase 2: Remove Purple Accents
echo "📋 Phase 2: Replacing purple with orange/green..."

find /app/frontend/src -type f -name "*.tsx" | while read file; do
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    
    count_purple=$(grep -c "purple" "$file" 2>/dev/null || echo 0)
    
    if [ "$count_purple" -gt 0 ]; then
        echo "  Processing: $file ($count_purple purple instances)"
        
        # Replace purple gradients with orange/green
        sed -i 's/from-purple-500 to-pink-500/from-orange-400 to-orange-500/g' "$file"
        sed -i 's/from-blue-500 to-purple-500/from-orange-500 to-green-400/g' "$file"
        sed -i 's/from-purple-500 to-indigo-600/from-orange-500 to-orange-600/g' "$file"
        sed -i 's/from-purple-100 to-purple-200/from-orange-50 to-orange-100/g' "$file"
        
        # Replace purple backgrounds
        sed -i 's/bg-purple-50/bg-orange-50/g' "$file"
        sed -i 's/bg-purple-100/bg-orange-100/g' "$file"
        
        # Replace purple text
        sed -i 's/text-purple-600/text-orange-600/g' "$file"
        sed -i 's/text-purple-800/text-orange-800/g' "$file"
        sed -i 's/text-purple-300/text-orange-300/g' "$file"
        
        # Replace purple borders
        sed -i 's/border-purple-200/border-orange-200/g' "$file"
        sed -i 's/border-purple-500/border-orange-500/g' "$file"
        sed -i 's/border-l-purple-500/border-l-orange-500/g' "$file"
    fi
done

echo "✅ Phase 2 Complete"

# Phase 3: Remove Black Overlays
echo "📋 Phase 3: Removing black overlays..."

find /app/frontend/src -type f -name "*.tsx" | while read file; do
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    
    if grep -q "bg-black/10\|bg-black/20" "$file"; then
        echo "  Processing: $file"
        
        # Remove or replace black overlays
        sed -i 's/bg-black\/10//g' "$file"
        sed -i 's/bg-black\/20//g' "$file"
    fi
done

echo "✅ Phase 3 Complete"

echo "🎉 UI/UX Standardization Complete!"
echo "📊 Summary:"
echo "  - Replaced gray backgrounds with white"
echo "  - Replaced purple with orange/green"
echo "  - Removed black overlays"
echo ""
echo "⚠️  Please run linting and visual QA to verify changes"
