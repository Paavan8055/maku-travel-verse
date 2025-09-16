#!/bin/bash

# Deployment script for different environments
ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./deploy-environment.sh <lovable|emergent>"
    echo "This script prepares the application for deployment in the specified environment"
    exit 1
fi

echo "🚀 Preparing deployment for $ENVIRONMENT environment..."

# Switch to target environment
echo "📋 Switching to $ENVIRONMENT environment..."
node /app/scripts/switch-environment.js $ENVIRONMENT

if [ $? -ne 0 ]; then
    echo "❌ Failed to switch environment"
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."

# Backend dependencies
echo "   Checking backend dependencies..."
cd /app/backend
pip install -r requirements.txt --quiet

# Frontend dependencies  
echo "   Checking frontend dependencies..."
cd /app/frontend
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    yarn install
fi

# Build frontend
echo "🔨 Building frontend..."
yarn build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Restart services
echo "🔄 Restarting services..."
sudo supervisorctl restart all

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Check service status
echo "✅ Checking service status..."
sudo supervisorctl status

echo ""
echo "🎉 Deployment preparation complete for $ENVIRONMENT environment!"
echo "📍 Backend URL: $(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)"
echo "🔧 Source: $ENVIRONMENT"

cd /app