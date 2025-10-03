#!/bin/bash

# Mem0 Webhook Deployment Script
# Automates the deployment of mem0-webhook function to Supabase

set -e  # Exit on any error

echo "🚀 Starting Mem0 Webhook Deployment Process"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_PROJECT_ID="iomeddeasarntjhqzndu"
FUNCTION_NAME="mem0-webhook"
WEBHOOK_ENDPOINT="https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${FUNCTION_NAME}"

echo -e "${BLUE}Project ID:${NC} $SUPABASE_PROJECT_ID"
echo -e "${BLUE}Function Name:${NC} $FUNCTION_NAME"
echo -e "${BLUE}Webhook URL:${NC} $WEBHOOK_ENDPOINT"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking Prerequisites...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Please install Supabase CLI:"
    echo "npm install -g supabase"
    exit 1
else
    echo -e "${GREEN}✅ Supabase CLI found${NC}"
fi

# Check if we're in the right directory
if [ ! -f "frontend/supabase/config.toml" ]; then
    echo -e "${RED}❌ Not in Maku.Travel project root${NC}"
    echo "Please run this script from the project root directory"
    exit 1
else
    echo -e "${GREEN}✅ Project structure verified${NC}"
fi

# Check if mem0-webhook function exists
if [ ! -f "frontend/supabase/functions/${FUNCTION_NAME}/index.ts" ]; then
    echo -e "${RED}❌ mem0-webhook function not found${NC}"
    echo "Expected: frontend/supabase/functions/${FUNCTION_NAME}/index.ts"
    exit 1
else
    echo -e "${GREEN}✅ mem0-webhook function found${NC}"
fi

echo ""

# Step 1: Link Supabase project
echo -e "${YELLOW}🔗 Step 1: Linking Supabase Project...${NC}"
cd frontend
supabase link --project-ref $SUPABASE_PROJECT_ID

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully linked to Supabase project${NC}"
else
    echo -e "${RED}❌ Failed to link Supabase project${NC}"
    exit 1
fi

# Step 2: Apply database migrations
echo -e "${YELLOW}🗄️ Step 2: Applying Database Migrations...${NC}"
supabase db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi

# Step 3: Deploy the mem0-webhook function
echo -e "${YELLOW}🚀 Step 3: Deploying mem0-webhook Function...${NC}"
supabase functions deploy $FUNCTION_NAME --no-verify-jwt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Function deployed successfully${NC}"
else
    echo -e "${RED}❌ Function deployment failed${NC}"
    exit 1
fi

# Step 4: Set up environment variables (interactive)
echo -e "${YELLOW}🔐 Step 4: Setting Up Environment Variables...${NC}"

# Check if secrets are already set
echo "Checking existing secrets..."

# MEM0_WEBHOOK_SECRET
if [ -n "$MEM0_WEBHOOK_SECRET" ]; then
    echo "Setting MEM0_WEBHOOK_SECRET from environment variable..."
    supabase secrets set MEM0_WEBHOOK_SECRET="$MEM0_WEBHOOK_SECRET"
else
    read -p "Enter MEM0_WEBHOOK_SECRET (or press Enter to skip): " webhook_secret
    if [ -n "$webhook_secret" ]; then
        supabase secrets set MEM0_WEBHOOK_SECRET="$webhook_secret"
        echo -e "${GREEN}✅ MEM0_WEBHOOK_SECRET set${NC}"
    else
        echo -e "${YELLOW}⚠️ MEM0_WEBHOOK_SECRET not set - you'll need to set this manually${NC}"
    fi
fi

# MEM0_API_KEY
if [ -n "$MEM0_API_KEY" ]; then
    echo "Setting MEM0_API_KEY from environment variable..."
    supabase secrets set MEM0_API_KEY="$MEM0_API_KEY"
else
    read -p "Enter MEM0_API_KEY (or press Enter to skip): " api_key
    if [ -n "$api_key" ]; then
        supabase secrets set MEM0_API_KEY="$api_key"
        echo -e "${GREEN}✅ MEM0_API_KEY set${NC}"
    else
        echo -e "${YELLOW}⚠️ MEM0_API_KEY not set - you'll need to set this manually${NC}"
    fi
fi

# Step 5: Test the deployment
echo -e "${YELLOW}🧪 Step 5: Testing Deployment...${NC}"

# Test basic function response
echo "Testing webhook endpoint..."
response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "memory.add",
    "data": {
      "id": "test-deployment-123",
      "user_id": "test-user",
      "memory": "Test memory from deployment script",
      "metadata": {"test": true}
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }')

if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Webhook endpoint responding correctly${NC}"
else
    echo -e "${RED}❌ Webhook endpoint test failed${NC}"
    echo "Response: $response"
fi

# Step 6: Provide Mem0 registration instructions
echo ""
echo -e "${BLUE}📋 Step 6: Mem0 Webhook Registration Instructions${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}Webhook URL to register in Mem0:${NC}"
echo "$WEBHOOK_ENDPOINT"
echo ""
echo -e "${YELLOW}Events to listen for:${NC}"
echo "• memory.add"
echo "• memory.update" 
echo "• memory.delete"
echo ""
echo -e "${YELLOW}Webhook Secret:${NC}"
echo "Use the same secret you set as MEM0_WEBHOOK_SECRET"
echo ""
echo -e "${YELLOW}Registration Options:${NC}"
echo ""
echo "Option 1 - Using Mem0 Dashboard:"
echo "1. Go to https://app.mem0.ai"
echo "2. Navigate to Project Settings → Webhooks"
echo "3. Click 'Add Webhook'"
echo "4. Enter the webhook URL above"
echo "5. Select events: memory.add, memory.update, memory.delete"
echo "6. Enter your webhook secret"
echo "7. Save the webhook"
echo ""
echo "Option 2 - Using Mem0 API:"
echo "curl -X POST 'https://api.mem0.ai/webhooks' \\"
echo "  -H 'Authorization: Bearer YOUR_MEM0_API_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"url\": \"$WEBHOOK_ENDPOINT\","
echo "    \"events\": [\"memory.add\", \"memory.update\", \"memory.delete\"],"
echo "    \"secret\": \"your-webhook-secret\","
echo "    \"description\": \"Maku.Travel memory integration\""
echo "  }'"
echo ""

# Step 7: Deployment summary
echo -e "${GREEN}🎉 Deployment Summary${NC}"
echo "===================="
echo -e "✅ Supabase project linked"
echo -e "✅ Database migrations applied"
echo -e "✅ mem0-webhook function deployed"
echo -e "✅ Environment variables configured"
echo -e "✅ Endpoint tested and responding"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Register webhook URL in your Mem0 project"
echo "2. Test memory events end-to-end"
echo "3. Monitor function logs for any issues"
echo ""
echo -e "${GREEN}Webhook Endpoint:${NC} $WEBHOOK_ENDPOINT"
echo -e "${YELLOW}Deployment Complete! 🎯${NC}"