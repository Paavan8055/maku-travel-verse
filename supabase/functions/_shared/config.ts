// Environment configuration for MAKU.Travel
// Controls test vs production endpoints across all services

interface EnvironmentConfig {
  isProduction: boolean;
  amadeus: {
    baseUrl: string;
    tokenUrl: string;
  };
  sabre: {
    baseUrl: string;
    tokenUrl: string;
  };
  hotelbeds: {
    baseUrl: string;
    mtlsUrl: string;
    cacheApiUrl: string;
  };
}

function getEnvironmentConfig(): EnvironmentConfig {
  // Check for production flag - defaults to test mode for safety
  const isProduction = Deno.env.get('MAKU_ENVIRONMENT') === 'production';
  
  return {
    isProduction,
    amadeus: {
      baseUrl: isProduction 
        ? 'https://api.amadeus.com' 
        : 'https://test.api.amadeus.com',
      tokenUrl: isProduction
        ? 'https://api.amadeus.com/v1/security/oauth2/token'
        : 'https://test.api.amadeus.com/v1/security/oauth2/token'
    },
    sabre: {
      baseUrl: isProduction
        ? 'https://api.sabre.com'
        : 'https://api-crt.cert.havail.sabre.com',
      tokenUrl: isProduction
        ? 'https://api.sabre.com/v2/auth/token'
        : 'https://api-crt.cert.havail.sabre.com/v2/auth/token'
    },
    hotelbeds: {
      baseUrl: isProduction
        ? 'https://api.hotelbeds.com'
        : 'https://api.test.hotelbeds.com',
      mtlsUrl: isProduction
        ? 'https://api-mtls.hotelbeds.com'
        : 'https://api.test.hotelbeds.com',
      cacheApiUrl: isProduction
        ? 'https://api.hotelbeds.com/cache-api/1.0'
        : 'https://api.test.hotelbeds.com/cache-api/1.0'
    }
  };
}

export const ENV_CONFIG = getEnvironmentConfig();

// Helper to check if we're in production mode
export const isProductionMode = () => ENV_CONFIG.isProduction;

// Credential validation helper - supports service-specific credentials
export function validateProviderCredentials(provider: 'amadeus' | 'sabre' | 'hotelbeds'): boolean {
  switch (provider) {
    case 'amadeus':
      return !!(Deno.env.get('AMADEUS_CLIENT_ID') && Deno.env.get('AMADEUS_CLIENT_SECRET'));
    case 'sabre':
      return !!(Deno.env.get('SABRE_CLIENT_ID') && Deno.env.get('SABRE_CLIENT_SECRET'));
    case 'hotelbeds':
      // Fallback to generic credentials if service-specific ones aren't available
      return !!(Deno.env.get('HOTELBEDS_API_KEY') && Deno.env.get('HOTELBEDS_SECRET'));
    default:
      return false;
  }
}

// Service-specific credential validation for HotelBeds APIs
export function validateHotelBedsCredentials(service: 'hotel' | 'activity' | 'transfer'): boolean {
  const serviceCredentials = getHotelBedsCredentials(service);
  return !!(serviceCredentials.apiKey && serviceCredentials.secret);
}

// Get service-specific HotelBeds credentials with fallback to generic ones
export function getHotelBedsCredentials(service: 'hotel' | 'activity' | 'transfer'): { apiKey: string | undefined; secret: string | undefined } {
  const serviceMap = {
    hotel: { 
      apiKey: 'HOTELBEDS_HOTEL_API_KEY', 
      secret: 'HOTELBEDS_HOTEL_SECRET' 
    },
    activity: { 
      apiKey: 'HOTELBEDS_ACTIVITY_API_KEY', 
      secret: 'HOTELBEDS_ACTIVITY_SECRET' 
    },
    transfer: { 
      apiKey: 'HOTELBEDS_TRANSFER_API_KEY', 
      secret: 'HOTELBEDS_TRANSFER_SECRET' 
    }
  };

  const serviceKeys = serviceMap[service];
  let apiKey = Deno.env.get(serviceKeys.apiKey);
  let secret = Deno.env.get(serviceKeys.secret);

  // Fallback to generic credentials if service-specific ones aren't available
  if (!apiKey || !secret) {
    apiKey = Deno.env.get('HOTELBEDS_API_KEY');
    secret = Deno.env.get('HOTELBEDS_SECRET');
  }

  return { apiKey, secret };
}

// Rate limiting configuration
export const RATE_LIMITS = {
  hotelbeds: {
    searchPerMinute: 30,
    bookingPerMinute: 10,
    contentPerMinute: 50,
    burstLimit: 5
  }
};

// mTLS Certificate helpers
export function getMTLSConfig(): { enabled: boolean; certPath?: string; keyPath?: string } {
  const certPath = Deno.env.get('HOTELBEDS_CLIENT_CERT_PATH');
  const keyPath = Deno.env.get('HOTELBEDS_CLIENT_KEY_PATH');
  
  return {
    enabled: ENV_CONFIG.isProduction && !!(certPath && keyPath),
    certPath,
    keyPath
  };
}

// Production readiness checks with service-specific validation
export function validateProductionReadiness(): { ready: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (ENV_CONFIG.isProduction) {
    // Check generic HotelBeds credentials
    if (!validateProviderCredentials('hotelbeds')) {
      issues.push('HotelBeds production credentials not configured');
    }
    
    // Check service-specific HotelBeds credentials
    if (!validateHotelBedsCredentials('hotel')) {
      issues.push('HotelBeds hotel API credentials not configured');
    }
    
    if (!validateHotelBedsCredentials('activity')) {
      issues.push('HotelBeds activity API credentials not configured');
    }
    
    const mtlsConfig = getMTLSConfig();
    if (!mtlsConfig.enabled) {
      issues.push('mTLS certificates not configured for production');
    }
    
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      issues.push('Stripe production keys not configured');
    }
  }
  
  return {
    ready: issues.length === 0,
    issues
  };
}

// Get all available HotelBeds services based on credentials
export function getAvailableHotelBedsServices(): string[] {
  const services: string[] = [];
  
  if (validateHotelBedsCredentials('hotel')) {
    services.push('hotel');
  }
  
  if (validateHotelBedsCredentials('activity')) {
    services.push('activity');
  }
  
  if (validateHotelBedsCredentials('transfer')) {
    services.push('transfer');
  }
  
  return services;
}