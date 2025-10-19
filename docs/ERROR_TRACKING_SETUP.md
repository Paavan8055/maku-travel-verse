# Error Tracking Integration Guide

## Overview

This document outlines the error tracking setup for MAKU.Travel production deployment. We recommend using **Sentry** for comprehensive error monitoring across frontend and backend.

---

## Option 1: Sentry Integration (Recommended)

### Why Sentry?

- ✅ Real-time error tracking
- ✅ Source map support for React
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ User feedback collection
- ✅ Slack/email alerts
- ✅ Free tier: 5,000 errors/month

### Setup Steps

#### 1. Create Sentry Account

1. Visit https://sentry.io/signup/
2. Create new project
3. Choose "React" for frontend
4. Choose "Python" for backend
5. Copy DSN keys

#### 2. Frontend Integration

**Install Sentry SDK:**

```bash
cd /app/frontend
yarn add @sentry/react @sentry/tracing
```

**Create Sentry Configuration:**

File: `/app/frontend/src/lib/sentry.ts`

```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'dev',
      environment: import.meta.env.MODE,
      
      // Ignore known errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
      
      // Filter sensitive data
      beforeSend(event, hint) {
        // Don't send errors in development
        if (import.meta.env.DEV) return null;
        
        // Remove sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.Authorization;
          }
        }
        
        return event;
      },
    });
  }
}
```

**Update App Entry Point:**

File: `/app/frontend/src/main.tsx`

```typescript
import { initSentry } from './lib/sentry';

// Initialize Sentry before anything else
initSentry();

// Rest of your app code...
```

**Add Error Boundary:**

File: `/app/frontend/src/components/ErrorBoundary.tsx`

```typescript
import * as Sentry from '@sentry/react';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Environment Variables:**

Add to `/app/frontend/.env`:

```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

#### 3. Backend Integration

**Install Sentry SDK:**

```bash
cd /app/backend
pip install sentry-sdk[fastapi]
echo "sentry-sdk[fastapi]==1.40.0" >> requirements.txt
```

**Create Sentry Configuration:**

File: `/app/backend/sentry_config.py`

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
import os

def init_sentry():
    """Initialize Sentry for backend error tracking"""
    sentry_dsn = os.environ.get('SENTRY_DSN')
    environment = os.environ.get('ENVIRONMENT', 'development')
    
    if sentry_dsn and environment != 'development':
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FastApiIntegration(),
                StarletteIntegration(),
            ],
            
            # Performance monitoring
            traces_sample_rate=0.1,  # 10% of transactions
            
            # Release tracking
            release=os.environ.get('APP_VERSION', 'dev'),
            environment=environment,
            
            # Filter sensitive data
            before_send=filter_sensitive_data,
        )
        
        print(f"✅ Sentry initialized for {environment}")
    else:
        print(f"ℹ️  Sentry disabled in {environment} mode")

def filter_sensitive_data(event, hint):
    """Remove sensitive data before sending to Sentry"""
    # Remove sensitive headers
    if 'request' in event and 'headers' in event['request']:
        sensitive_headers = ['authorization', 'cookie', 'x-api-key']
        for header in sensitive_headers:
            event['request']['headers'].pop(header, None)
    
    # Remove sensitive query params
    if 'request' in event and 'query_string' in event['request']:
        # Don't log full query strings with potential tokens
        event['request']['query_string'] = '[FILTERED]'
    
    return event
```

**Update Server Initialization:**

File: `/app/backend/server.py` (add at the top):

```python
from sentry_config import init_sentry

# Initialize Sentry
init_sentry()
```

**Environment Variables:**

Add to `/app/backend/.env`:

```env
SENTRY_DSN=https://your-backend-sentry-dsn@sentry.io/project-id
APP_VERSION=1.0.0
ENVIRONMENT=production
```

#### 4. Testing Error Tracking

**Frontend Test:**

Add a test button temporarily:

```typescript
<button onClick={() => {
  throw new Error('Test Sentry error from frontend');
}}>
  Test Error Tracking
</button>
```

**Backend Test:**

Add a test endpoint:

```python
@api_router.get("/test-error")
async def test_sentry_error():
    """Test endpoint for Sentry error tracking"""
    raise Exception("Test Sentry error from backend")
```

Visit the endpoints and verify errors appear in Sentry dashboard.

---

## Option 2: LogRocket Integration (Alternative)

### Why LogRocket?

- ✅ Session replay
- ✅ Console logs capture
- ✅ Network request tracking
- ✅ User interaction replay
- ⚠️ More expensive than Sentry
- ⚠️ Frontend only (no backend)

### Setup Steps

**Install SDK:**

```bash
cd /app/frontend
yarn add logrocket
```

**Initialize:**

```typescript
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init('your-app-id');
  
  LogRocket.identify('USER_ID', {
    name: 'User Name',
    email: 'user@example.com',
  });
}
```

---

## Monitoring Strategy

### Alerts Configuration

**Sentry Alerts:**

1. **Critical Errors:** Email + Slack
   - 500 errors from backend
   - Unhandled promise rejections
   - Payment failures

2. **Performance Issues:** Slack only
   - Page load > 5s
   - API response > 3s
   - Failed transactions

3. **Volume Alerts:**
   - Error rate > 1% in 5 minutes
   - Spike detection (5x normal rate)

### Error Prioritization

**P0 (Critical):**
- Payment processing failures
- Authentication system down
- Database connection errors

**P1 (High):**
- Blockchain transaction failures
- API endpoint errors
- Search functionality broken

**P2 (Medium):**
- UI rendering issues
- Non-critical API timeouts
- Analytics tracking failures

**P3 (Low):**
- Console warnings
- Performance degradation
- Minor UI glitches

---

## Error Response Procedures

### Incident Response Flow

```
1. Error Detected (Sentry/Monitoring)
   ↓
2. Alert Sent (Slack/Email)
   ↓
3. Triage (P0-P3)
   ↓
4. Investigation (Sentry session replay, logs)
   ↓
5. Fix Applied (Hotfix or scheduled)
   ↓
6. Verification (Production check)
   ↓
7. Post-Mortem (For P0/P1)
```

### On-Call Rotation

- Primary: Development Lead
- Secondary: DevOps Engineer
- Escalation: CTO

---

## Cost Estimation

### Sentry

**Free Tier:**
- 5,000 errors/month
- 10,000 performance units
- 1 user

**Team Plan ($26/month):**
- 50,000 errors/month
- 100,000 performance units
- 5 users

**Recommendation:** Start with free tier

### LogRocket

**Free Tier:**
- 1,000 sessions/month

**Team Plan ($99/month):**
- 10,000 sessions/month

---

## Implementation Checklist

- [ ] Create Sentry account
- [ ] Get DSN keys (frontend + backend)
- [ ] Install Sentry SDKs
- [ ] Add environment variables
- [ ] Create error boundaries
- [ ] Test error capture
- [ ] Configure alerts
- [ ] Set up Slack integration
- [ ] Document incident response
- [ ] Train team on Sentry dashboard

---

## Quick Start (Production)

**1. Environment Setup:**

```bash
# Frontend
echo 'VITE_SENTRY_DSN=your-frontend-dsn' >> /app/frontend/.env

# Backend
echo 'SENTRY_DSN=your-backend-dsn' >> /app/backend/.env
echo 'ENVIRONMENT=production' >> /app/backend/.env
```

**2. Install & Deploy:**

```bash
# Install dependencies
cd /app/frontend && yarn add @sentry/react @sentry/tracing
cd /app/backend && pip install sentry-sdk[fastapi]

# Restart services
sudo supervisorctl restart all
```

**3. Verify:**

Visit Sentry dashboard and confirm events are being received.

---

## Support

- Sentry Docs: https://docs.sentry.io/
- LogRocket Docs: https://docs.logrocket.com/
- Internal Wiki: [Link to internal docs]
