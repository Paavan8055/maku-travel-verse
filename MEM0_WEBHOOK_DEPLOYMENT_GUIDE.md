# Mem0 Webhook Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy the mem0-webhook function to Supabase and register it with your Mem0 project for memory event handling.

## Prerequisites

- Supabase CLI installed locally
- Access to Supabase project `iomeddeasarntjhqzndu`
- Mem0 project with webhook configuration access
- Required environment variables and API keys

## Step 1: Deploy Mem0 Webhook Function to Supabase

### Option A: Using Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
cd /app/frontend
supabase link --project-ref iomeddeasarntjhqzndu

# 4. Deploy the mem0-webhook function
supabase functions deploy mem0-webhook --no-verify-jwt

# 5. Set required environment variables
supabase secrets set MEM0_WEBHOOK_SECRET=your-webhook-secret-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 6. Test the deployment
supabase functions serve --no-verify-jwt
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard → Project Settings → API
2. Navigate to Edge Functions
3. Create new function named `mem0-webhook`
4. Copy the content from `/app/frontend/supabase/functions/mem0-webhook/index.ts`
5. Deploy the function
6. Set environment variables in Project Settings → Edge Function Secrets

## Step 2: Run Database Migrations

```bash
# Apply the new migrations for Mem0 integration
cd /app/frontend
supabase db push

# Or apply specific migration
supabase migration up --target 20250914000006
```

## Step 3: Configure Environment Variables

### Required Environment Variables in Supabase

```bash
# Set in Supabase Edge Function Secrets
MEM0_WEBHOOK_SECRET=your-secure-webhook-secret
MEM0_API_KEY=your-mem0-api-key  
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Backend Environment Variables

Add to `/app/backend/.env`:

```env
# Mem0 Integration
MEM0_API_KEY=your-mem0-api-key
MEM0_WEBHOOK_SECRET=your-secure-webhook-secret
MEM0_BASE_URL=https://api.mem0.ai
```

## Step 4: Get Webhook Endpoint URL

After deployment, your webhook endpoint will be:

```
https://iomeddeasarntjhqzndu.supabase.co/functions/v1/mem0-webhook
```

## Step 5: Register Webhook in Mem0 Project

### Using Mem0 Dashboard

1. **Login to Mem0 Dashboard**: Go to [https://app.mem0.ai](https://app.mem0.ai)
2. **Navigate to Webhooks**: Project Settings → Webhooks
3. **Add New Webhook**: Click "Add Webhook"
4. **Configure Webhook**:
   - **URL**: `https://iomeddeasarntjhqzndu.supabase.co/functions/v1/mem0-webhook`
   - **Events**: Select `memory.add`, `memory.update`, `memory.delete`
   - **Secret**: Use the same secret as `MEM0_WEBHOOK_SECRET`
   - **Description**: "Maku.Travel memory integration"

### Using Mem0 API

```bash
# Register webhook via API
curl -X POST "https://api.mem0.ai/webhooks" \
  -H "Authorization: Bearer YOUR_MEM0_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://iomeddeasarntjhqzndu.supabase.co/functions/v1/mem0-webhook",
    "events": ["memory.add", "memory.update", "memory.delete"],
    "secret": "your-webhook-secret",
    "description": "Maku.Travel memory integration"
  }'
```

## Step 6: Test Webhook Integration

### Test Webhook Endpoint

```bash
# Test webhook endpoint directly
curl -X POST "https://iomeddeasarntjhqzndu.supabase.co/functions/v1/mem0-webhook" \
  -H "Content-Type: application/json" \
  -H "X-Mem0-Signature: sha256=test-signature" \
  -d '{
    "event": "memory.add",
    "data": {
      "id": "test-memory-123",
      "user_id": "test-user-456", 
      "memory": "User prefers luxury hotels with spa amenities",
      "metadata": {"test": true}
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

### Test Memory Event Flow

1. **Create Memory in Mem0**:
```javascript
// Using Mem0 SDK
await mem0.memories.add({
  user_id: "test-user-123",
  memory: "I prefer boutique hotels in city centers",
  metadata: { source: "maku_travel_test" }
});
```

2. **Verify Webhook Reception**:
   - Check Supabase function logs
   - Verify entry in `user_memories` table
   - Check `user_travel_preferences` table for extracted preferences

## Step 7: Backend Integration

Add Mem0 integration endpoints to your backend:

```python
# Add to backend/server.py
@api_router.get("/memories/{user_id}")
async def get_user_memories(user_id: str):
    """Get user memories from Mem0 integration"""
    # Implementation here

@api_router.post("/memories")  
async def create_memory(user_id: str, memory: str, metadata: dict = None):
    """Create new memory in Mem0"""
    # Implementation here
```

## Step 8: Frontend Integration

Create React components for memory management:

```typescript
// Example: Memory integration hook
import { useState, useEffect } from 'react';

export const useUserMemories = (userId: string) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserMemories(userId);
  }, [userId]);

  const fetchUserMemories = async (userId: string) => {
    // Fetch memories from backend
  };

  return { memories, loading };
};
```

## Verification Checklist

### Supabase Function Deployment
- [ ] Function deployed successfully to Supabase
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Function logs show no errors

### Mem0 Webhook Registration  
- [ ] Webhook registered in Mem0 project
- [ ] Correct endpoint URL configured
- [ ] Events selected: memory.add, memory.update, memory.delete
- [ ] Webhook secret configured

### Integration Testing
- [ ] Test webhook endpoint responds correctly
- [ ] Memory events create database entries
- [ ] User preferences are extracted and stored
- [ ] Analytics events are tracked
- [ ] Error handling works properly

## Troubleshooting

### Common Issues

**1. Webhook Not Receiving Events**
```bash
# Check function logs
supabase functions logs mem0-webhook

# Verify webhook registration
curl -X GET "https://api.mem0.ai/webhooks" \
  -H "Authorization: Bearer YOUR_MEM0_API_KEY"
```

**2. Signature Verification Failures**
- Ensure webhook secret matches in both Mem0 and Supabase
- Check signature header format: `X-Mem0-Signature: sha256=...`

**3. Database Permission Errors**
- Verify RLS policies are correctly set
- Check service role key has proper permissions

### Debug Commands

```bash
# Check webhook function status
supabase functions list

# View function logs
supabase functions logs mem0-webhook --follow

# Test database connectivity
supabase db --linked --execute "SELECT * FROM user_memories LIMIT 5;"

# Verify environment variables
supabase secrets list
```

## Security Considerations

1. **Webhook Secret**: Use a strong, unique secret for signature verification
2. **HTTPS Only**: Ensure webhook URL uses HTTPS
3. **Rate Limiting**: Monitor webhook call frequency
4. **Data Validation**: Validate all incoming webhook payloads
5. **Error Logging**: Log errors without exposing sensitive data

## Monitoring & Analytics

The webhook automatically tracks:
- Memory creation, updates, and deletions
- User preference extraction and updates
- Response times and error rates
- Event analytics for admin dashboard

Monitor webhook performance via:
- Supabase function logs
- Analytics dashboard (`/admin` → Analytics tab)
- System alerts for webhook failures

## Production Deployment Notes

1. **Environment Variables**: Ensure all secrets are properly set in production
2. **Webhook URL**: Use production Supabase URL for webhook registration
3. **Error Alerting**: Configure alerts for webhook failures
4. **Backup Strategy**: Webhook events are tracked in analytics for audit trail

---

**Webhook Endpoint**: `https://iomeddeasarntjhqzndu.supabase.co/functions/v1/mem0-webhook`

**Supported Events**: `memory.add`, `memory.update`, `memory.delete`

**Authentication**: HMAC SHA-256 signature verification with webhook secret