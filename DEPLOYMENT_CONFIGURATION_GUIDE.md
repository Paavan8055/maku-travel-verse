# Maku.Travel Deployment Configuration Guide

## Environment Architecture

Maku.Travel supports three environments with centralized configuration management via Supabase:

- **Development**: Local development with test APIs and mock data
- **Staging**: Pre-production environment for testing and QA
- **Production**: Live environment serving real users

## Required Environment Variables

### Core Application Variables

#### Frontend (.env)
```bash
# Supabase Configuration
VITE_SUPABASE_URL="https://iomeddeasarntjhqzndu.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_PROJECT_ID="iomeddeasarntjhqzndu"

# Environment Identification
VITE_ENVIRONMENT="development|staging|production"

# Backend API URLs
VITE_REACT_APP_BACKEND_URL="https://api.dev.maku.travel|https://api.staging.maku.travel|https://api.maku.travel"

# Analytics & Monitoring
VITE_POSTHOG_API_KEY="phc_xxx" # Optional for client-side analytics
VITE_SENTRY_DSN="https://xxx@sentry.io/xxx" # Optional for error tracking
```

#### Backend (.env)
```bash
# Core Database
MONGO_URL="mongodb://localhost:27017|mongodb://staging-cluster|mongodb://prod-cluster"
DB_NAME="maku_dev|maku_staging|maku_production"

# Supabase Configuration
SUPABASE_URL="https://iomeddeasarntjhqzndu.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Required for secrets access

# Environment Settings
ENVIRONMENT="development|staging|production"
DEBUG_MODE="true|false"
CORS_ORIGINS="*|https://staging.maku.travel|https://maku.travel"

# AI Configuration (Development Override)
USE_EMERGENT_AI="false" # Development only
USE_FREE_AI="true" # Development only
DEVELOPMENT_MODE="true|false"
```

### Provider API Keys (Stored in Supabase Environment Table)

#### Travel Providers
- `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET`
- `SABRE_CLIENT_ID` / `SABRE_CLIENT_SECRET` 
- `VIATOR_API_KEY`
- `DUFFLE_API_KEY`
- `RATEHAWK_API_KEY`
- `EXPEDIA_API_KEY`

#### Payment Providers
- `STRIPE_PUBLISHABLE_KEY` (non-secret)
- `STRIPE_SECRET_KEY` (secret)

#### AI/LLM Providers
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

#### Analytics & Monitoring
- `POSTHOG_API_KEY`
- `SENTRY_DSN`

## Environment-Specific Configuration

### Development Environment
```json
{
  "environment": "development",
  "provider_urls": {
    "amadeus": "https://test.api.amadeus.com",
    "sabre": "https://api-crt.cert.havail.sabre.com", 
    "viator": "https://api.sandbox-viatorapi.com",
    "expedia": "https://api.sandbox.expediagroup.com"
  },
  "features": {
    "debug_logging": true,
    "rate_limiting": false,
    "free_ai_mode": true,
    "mock_data": true
  },
  "performance": {
    "cache_ttl": 60,
    "api_timeout": 30,
    "max_concurrent": 50
  }
}
```

### Staging Environment
```json
{
  "environment": "staging",
  "provider_urls": {
    "amadeus": "https://test.api.amadeus.com",
    "sabre": "https://api-crt.cert.havail.sabre.com",
    "viator": "https://api.sandbox-viatorapi.com", 
    "expedia": "https://api.sandbox.expediagroup.com"
  },
  "features": {
    "debug_logging": true,
    "rate_limiting": true,
    "free_ai_mode": false,
    "mock_data": false
  },
  "performance": {
    "cache_ttl": 300,
    "api_timeout": 30,
    "max_concurrent": 100
  }
}
```

### Production Environment
```json
{
  "environment": "production",
  "provider_urls": {
    "amadeus": "https://api.amadeus.com",
    "sabre": "https://api.havail.sabre.com",
    "viator": "https://api.viatorapi.com",
    "expedia": "https://api.expediagroup.com"
  },
  "features": {
    "debug_logging": false,
    "rate_limiting": true,
    "free_ai_mode": false,
    "mock_data": false
  },
  "performance": {
    "cache_ttl": 600,
    "api_timeout": 45,
    "max_concurrent": 500
  }
}
```

## Deployment Pipeline Configuration

### Netlify Configuration (netlify.toml)

```toml
[build]
  base = "frontend/"
  publish = "dist/"
  command = "yarn build"

[build.environment]
  NODE_VERSION = "18"
  YARN_VERSION = "1.22.19"

# Production deployment
[context.production]
  command = "yarn build"
  [context.production.environment]
    VITE_ENVIRONMENT = "production"
    VITE_REACT_APP_BACKEND_URL = "https://api.maku.travel"

# Staging deployment  
[context.staging]
  command = "yarn build"
  [context.staging.environment]
    VITE_ENVIRONMENT = "staging"
    VITE_REACT_APP_BACKEND_URL = "https://api.staging.maku.travel"

# Branch-specific deployments
[context.deploy-preview]
  command = "yarn build"
  [context.deploy-preview.environment]
    VITE_ENVIRONMENT = "development"

[[redirects]]
  from = "/api/*"
  to = "https://api.maku.travel/:splat"
  status = 200
  force = true
  condition = "Country=!staging"

[[redirects]]
  from = "/api/*" 
  to = "https://api.staging.maku.travel/:splat"
  status = 200
  force = true
  condition = "Country=staging"
```

### Docker Configuration (Dockerfile)

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ .
ARG VITE_ENVIRONMENT=production
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT
RUN yarn build

FROM python:3.11-slim AS backend
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
COPY --from=frontend-build /app/frontend/dist ./static
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### GitHub Actions Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy Maku.Travel

on:
  push:
    branches: [main, staging, develop]
  
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Determine Environment
        id: env
        run: |
          if [[ ${{ github.ref }} == 'refs/heads/main' ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          elif [[ ${{ github.ref }} == 'refs/heads/staging' ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT  
          else
            echo "environment=development" >> $GITHUB_OUTPUT
          fi
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './frontend/dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Secret Management via get-secrets Function

### Function Endpoint
```
POST https://iomeddeasarntjhqzndu.functions.supabase.co/get-secrets
```

### Authentication
- Requires `Authorization: Bearer <SERVICE_ROLE_KEY>` header
- Only service-role can access secrets

### Request Format
```json
{
  "environment": "development|staging|production",
  "keys": ["AMADEUS_CLIENT_ID", "STRIPE_SECRET_KEY"] // Optional: specific keys
}
```

### Response Format
```json
{
  "success": true,
  "secrets": {
    "AMADEUS_CLIENT_ID": "your-amadeus-client-id",
    "STRIPE_SECRET_KEY": "sk_test_..."
  },
  "environment": "staging",
  "metadata": {
    "total_items": 2,
    "secret_items": 2,
    "public_items": 0,
    "timestamp": "2024-09-14T10:30:00.000Z"
  }
}
```

## Configuration Access Patterns

### Backend (Python)
```python
from supabase_config import get_config_instance, get_secret, get_provider_config

# Get configuration instance
config = get_config_instance()

# Get secrets
amadeus_key = await get_secret('AMADEUS_CLIENT_ID')
stripe_key = await get_secret('STRIPE_SECRET_KEY')

# Get provider configuration  
amadeus_config = await get_provider_config('amadeus')
# Returns: {"client_id": "...", "client_secret": "...", "base_url": "..."}
```

### Frontend (TypeScript)
```typescript
import { getConfigInstance, getPublicConfig, getProviderConfig } from '@/integrations/supabase/config';

// Get configuration instance
const config = getConfigInstance();

// Get public configurations only
const stripePublishableKey = await getPublicConfig('STRIPE_PUBLISHABLE_KEY');
const frontendUrl = await getPublicConfig('FRONTEND_URL');

// Get provider configuration (public values only)
const stripeConfig = await getProviderConfig('stripe');
// Returns: {"publishable_key": "pk_test_...", "mode": "test"}
```

## Health Checks & Monitoring

### Configuration Validation Endpoint
```bash
GET /api/config/validate
```

### Provider Connection Testing
```bash
POST /api/config/test-connections
```

### Environment Status Check
```bash
GET /api/config/providers
```

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables documented
- [ ] Supabase environment table populated with real API keys
- [ ] get-secrets function deployed and tested
- [ ] Provider base URLs configured for target environment
- [ ] Feature flags set appropriately

### Post-Deployment
- [ ] Health checks passing
- [ ] Configuration validation successful
- [ ] Provider connections tested
- [ ] Analytics/monitoring configured
- [ ] Error tracking operational

## Security Considerations

1. **Secret Storage**: All sensitive data stored in Supabase with proper RLS
2. **Access Control**: Service-role key required for secret access
3. **Environment Isolation**: Separate configurations prevent cross-environment leaks
4. **Audit Trail**: All configuration changes tracked with timestamps
5. **Encryption**: Secrets encrypted at rest and in transit

## Troubleshooting

### Common Issues
1. **Missing Service Role Key**: Ensure SUPABASE_SERVICE_ROLE_KEY is set
2. **Wrong Environment**: Verify ENVIRONMENT variable matches deployment target
3. **Provider API Failures**: Check provider base URLs in environment_configs
4. **CORS Issues**: Verify CORS_ORIGINS matches frontend URL

### Debug Commands
```bash
# Test configuration loading
curl -X GET "https://api.maku.travel/api/config/validate"

# Test provider connections
curl -X POST "https://api.maku.travel/api/config/test-connections"

# Check specific provider config
curl -X GET "https://api.maku.travel/api/config/providers/amadeus"
```

This deployment configuration supports the full lifecycle from development through production with proper security, monitoring, and scalability considerations.