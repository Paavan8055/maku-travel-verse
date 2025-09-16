// Sentry configuration and initialization
// This should be loaded only when Sentry DSN is available

export interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  debug?: boolean;
}

export const initializeSentry = async (config: SentryConfig) => {
  // Only initialize if DSN is provided and we're not in development mode
  if (!config.dsn || process.env.NODE_ENV === 'development') {
    console.log('Sentry not initialized - missing DSN or in development mode');
    return;
  }

  try {
    // Check if Sentry is already available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      console.log('Sentry already initialized');
      return;
    }
    
    console.log('Sentry configuration ready - DSN provided');
    console.log('To complete setup: npm install @sentry/react');
    
    // Store config for later use when Sentry package is available
    (window as any).sentryConfig = config;
    
    // TODO: Dynamic import when @sentry/react is installed
    // const Sentry = await import('@sentry/react');
    // ... rest of initialization
    
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

// Helper to check if Sentry is available
export const isSentryAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Sentry;
};

// Helper to add travel-specific context
export const addTravelContext = (context: {
  bookingType?: 'flight' | 'hotel' | 'activity';
  searchParams?: Record<string, any>;
  userJourney?: string;
  supplierId?: string;
}) => {
  if (!isSentryAvailable()) return;
  
  const Sentry = (window as any).Sentry;
  
  Sentry.withScope((scope: any) => {
    if (context.bookingType) {
      scope.setTag('bookingType', context.bookingType);
    }
    
    if (context.userJourney) {
      scope.setTag('userJourney', context.userJourney);
    }
    
    if (context.supplierId) {
      scope.setTag('supplierId', context.supplierId);
    }
    
    if (context.searchParams) {
      scope.setContext('searchParams', context.searchParams);
    }
  });
};