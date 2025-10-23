/**
 * Sentry Error Tracking Configuration
 * Free tier: 5,000 errors/month
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0';

export function initSentry() {
  // Only initialize if DSN is provided
  if (!SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `maku-frontend@${RELEASE}`,
    
    // Performance Monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        // 1.0 = 100% in preview, 0.1 = 10% in production
        tracePropagationTargets: [
          'localhost',
          'preview.emergentagent.com',
          /^\https:\/\/yield-optimize\.preview\.emergentagent\.com/
        ],
      }),
      new Sentry.Replay({
        // Session replay for debugging
        // Only record sessions with errors
        maskAllText: true,
        blockAllMedia: true,
      })
    ],
    
    // Sample rate for transactions
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Capture 10% of sessions for replay
    replaysSessionSampleRate: 0.1,
    
    // Capture 100% of sessions with errors
    replaysOnErrorSampleRate: 1.0,
    
    // Before sending to Sentry
    beforeSend(event, hint) {
      // Don't send errors in development
      if (ENVIRONMENT === 'development') {
        console.log('Sentry event (dev mode, not sent):', event);
        return null;
      }
      
      // Filter out specific errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors from extensions
        if (error.message.includes('chrome-extension://')) {
          return null;
        }
        
        // Ignore ResizeObserver errors (browser bug)
        if (error.message.includes('ResizeObserver')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Scrub sensitive data
    beforeBreadcrumb(breadcrumb) {
      // Don't log console breadcrumbs in production
      if (breadcrumb.category === 'console' && ENVIRONMENT === 'production') {
        return null;
      }
      return breadcrumb;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'Non-Error promise rejection captured',
      // Random network errors
      'Network request failed',
      'NetworkError',
      // Safari/iOS specific
      'SecurityError',
      // Ad blockers
      'adsbygoogle',
    ],
  });

  console.log('✅ Sentry initialized:', ENVIRONMENT);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture message (non-error)
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Performance monitoring - Start transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

/**
 * Wrap async function with Sentry error boundary
 */
export function withSentry<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          captureException(error);
          throw error;
        });
      }
      return result;
    } catch (error) {
      captureException(error as Error);
      throw error;
    }
  }) as T;
}
