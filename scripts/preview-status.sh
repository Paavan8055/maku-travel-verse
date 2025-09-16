#!/bin/bash

# Preview Environment Status Script
echo "🏗️  Maku.Travel Preview Environment Status"
echo "=========================================="

# Read current config
if [ -f "/app/preview-config.json" ]; then
    echo "📊 Current Configuration:"
    node /app/scripts/switch-environment.js
    
    echo ""
    echo "🔍 Service Status:"
    sudo supervisorctl status | grep -E "(frontend|backend)" | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo "🌐 Environment Variables:"
    echo "   Frontend Backend URL: $(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)"
    echo "   Backend MongoDB URL: $(grep MONGO_URL /app/backend/.env | cut -d'=' -f2)"
    
    echo ""
    echo "📁 Source Configuration:"
    echo "   .emergent/emergent.yml source: $(grep -o '"source": "[^"]*"' /app/.emergent/emergent.yml | cut -d'"' -f4)"
    
else
    echo "❌ Preview configuration not found!"
    exit 1
fi