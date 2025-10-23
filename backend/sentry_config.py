"""
Sentry Error Tracking Configuration for FastAPI Backend
Free tier: 5,000 errors/month
"""

import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

SENTRY_DSN = os.getenv('SENTRY_DSN')
SENTRY_ENVIRONMENT = os.getenv('SENTRY_ENVIRONMENT', os.getenv('ENVIRONMENT', 'development'))
SENTRY_TRACES_SAMPLE_RATE = float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '1.0'))

def init_sentry():
    """Initialize Sentry for error tracking"""
    
    if not SENTRY_DSN:
        print('⚠️  Sentry DSN not configured. Error tracking disabled.')
        return
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=SENTRY_ENVIRONMENT,
        
        # Integrations
        integrations=[
            FastApiIntegration(
                transaction_style="url",  # Group by URL path
            ),
            StarletteIntegration(
                transaction_style="url",
            ),
        ],
        
        # Performance Monitoring
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
        
        # Release tracking
        release="maku-backend@1.0.0",
        
        # Before send hook
        before_send=before_send_hook,
        
        # Before breadcrumb hook
        before_breadcrumb=before_breadcrumb_hook,
        
        # Ignore specific errors
        ignore_errors=[
            # Ignore 404 errors
            "starlette.exceptions.HTTPException",
            # Ignore client disconnects
            "anyio._backends._asyncio.CancelledError",
        ],
    )
    
    print(f'✅ Sentry initialized: {SENTRY_ENVIRONMENT}')

def before_send_hook(event, hint):
    """Filter/modify events before sending to Sentry"""
    
    # Don't send in development
    if SENTRY_ENVIRONMENT == 'development':
        print(f'Sentry event (dev mode, not sent): {event}')
        return None
    
    # Scrub sensitive data from request body
    if 'request' in event and 'data' in event['request']:
        data = event['request']['data']
        
        # Remove sensitive fields
        sensitive_fields = ['password', 'api_key', 'secret', 'token', 'private_key']
        for field in sensitive_fields:
            if isinstance(data, dict) and field in data:
                data[field] = '[REDACTED]'
    
    # Filter out 404 errors
    if 'exception' in event:
        for exception in event['exception'].get('values', []):
            if exception.get('type') == 'HTTPException':
                if '404' in str(exception.get('value', '')):
                    return None
    
    return event

def before_breadcrumb_hook(crumb, hint):
    """Filter/modify breadcrumbs before adding"""
    
    # Don't log SQL queries in production (can be verbose)
    if crumb.get('category') == 'query' and SENTRY_ENVIRONMENT == 'production':
        return None
    
    # Scrub sensitive data from breadcrumb data
    if 'data' in crumb:
        data = crumb['data']
        sensitive_fields = ['password', 'api_key', 'secret', 'token']
        for field in sensitive_fields:
            if isinstance(data, dict) and field in data:
                data[field] = '[REDACTED]'
    
    return crumb

def capture_exception(error: Exception, context: dict = None):
    """Manually capture exception with additional context"""
    
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_context(key, value)
            sentry_sdk.capture_exception(error)
    else:
        sentry_sdk.capture_exception(error)

def capture_message(message: str, level: str = 'info'):
    """Capture message (non-error)"""
    sentry_sdk.capture_message(message, level=level)

def set_user(user_id: str, email: str = None, username: str = None):
    """Set user context for error tracking"""
    sentry_sdk.set_user({
        'id': user_id,
        'email': email,
        'username': username
    })

def add_breadcrumb(message: str, category: str = 'default', data: dict = None):
    """Add breadcrumb for debugging"""
    sentry_sdk.add_breadcrumb({
        'message': message,
        'category': category,
        'data': data or {},
        'level': 'info'
    })

def start_transaction(name: str, op: str = 'http.server'):
    """Start performance monitoring transaction"""
    return sentry_sdk.start_transaction(name=name, op=op)
