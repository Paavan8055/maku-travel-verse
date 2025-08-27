import logger from "./logger.ts";

// Environment configuration utilities
export const ENV_CONFIG = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  
  // Amadeus
  AMADEUS_CLIENT_ID: Deno.env.get('AMADEUS_CLIENT_ID'),
  AMADEUS_CLIENT_SECRET: Deno.env.get('AMADEUS_CLIENT_SECRET'),
  
  // Sabre
  SABRE_CLIENT_ID: Deno.env.get('SABRE_CLIENT_ID'),
  SABRE_CLIENT_SECRET: Deno.env.get('SABRE_CLIENT_SECRET'),
  
  // HotelBeds
  HOTELBEDS_HOTEL_API_KEY: Deno.env.get('HOTELBEDS_HOTEL_API_KEY'),
  HOTELBEDS_HOTEL_SECRET: Deno.env.get('HOTELBEDS_HOTEL_SECRET'),
  HOTELBEDS_ACTIVITY_API_KEY: Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY'),
  HOTELBEDS_ACTIVITY_SECRET: Deno.env.get('HOTELBEDS_ACTIVITY_SECRET'),
  
  // Stripe
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
  
  // Email
  RESEND_API_KEY: Deno.env.get('RESEND_API_KEY'),

  // Provider API URLs - Production environment check
  amadeus: {
    tokenUrl: Deno.env.get('NODE_ENV') === 'production' 
      ? "https://api.amadeus.com/v1/security/oauth2/token"
      : "https://test.api.amadeus.com/v1/security/oauth2/token",
    baseUrl: Deno.env.get('NODE_ENV') === 'production'
      ? "https://api.amadeus.com"
      : "https://test.api.amadeus.com"
  },
  sabre: {
    tokenUrl: Deno.env.get('NODE_ENV') === 'production'
      ? "https://api.sabre.com/v2/auth/token"
      : "https://api-crt.cert.havail.sabre.com/v2/auth/token",
    baseUrl: Deno.env.get('NODE_ENV') === 'production'
      ? "https://api.sabre.com"
      : "https://api-crt.cert.havail.sabre.com"
  },
  hotelbeds: {
    baseUrl: Deno.env.get('NODE_ENV') === 'production'
      ? "https://api.hotelbeds.com"
      : "https://api.test.hotelbeds.com",
    hotel: {
      baseUrl: Deno.env.get('NODE_ENV') === 'production'
        ? "https://api.hotelbeds.com"
        : "https://api.test.hotelbeds.com"
    },
    activity: {
      baseUrl: Deno.env.get('NODE_ENV') === 'production'
        ? "https://api.hotelbeds.com"
        : "https://api.test.hotelbeds.com"
    }
  },
  
  // Environment flags
  isProduction: Deno.env.get('NODE_ENV') === 'production'
};

// Rate limiting configuration
export const RATE_LIMITS = {
  amadeus: {
    requestsPerSecond: 10,
    requestsPerMinute: 600,
    requestsPerHour: 30000
  },
  sabre: {
    requestsPerSecond: 5,
    requestsPerMinute: 300,
    requestsPerHour: 18000
  },
  hotelbeds: {
    requestsPerSecond: 5,
    requestsPerMinute: 300,
    requestsPerHour: 15000
  }
};

// Enhanced provider credential validation
export function validateProviderCredentials(provider: 'amadeus' | 'sabre'): boolean {
  try {
    switch (provider) {
      case 'amadeus':
        const amadeusValid = !!(ENV_CONFIG.AMADEUS_CLIENT_ID && ENV_CONFIG.AMADEUS_CLIENT_SECRET);
        if (!amadeusValid) {
          logger.warn('[CONFIG] Amadeus credentials missing', {
            hasClientId: !!ENV_CONFIG.AMADEUS_CLIENT_ID,
            hasClientSecret: !!ENV_CONFIG.AMADEUS_CLIENT_SECRET
          });
        }
        return amadeusValid;
        
      case 'sabre':
        const sabreValid = !!(ENV_CONFIG.SABRE_CLIENT_ID && ENV_CONFIG.SABRE_CLIENT_SECRET);
        if (!sabreValid) {
          logger.warn('[CONFIG] Sabre credentials missing', {
            hasClientId: !!ENV_CONFIG.SABRE_CLIENT_ID,
            hasClientSecret: !!ENV_CONFIG.SABRE_CLIENT_SECRET
          });
        }
        return sabreValid;
        
      default:
        return false;
    }
  } catch (error) {
    logger.error(`[CONFIG] Error validating ${provider} credentials:`, error);
    return false;
  }
}

export function validateHotelBedsCredentials(service: 'hotel' | 'activity'): boolean {
  try {
    switch (service) {
      case 'hotel':
        const hotelValid = !!(ENV_CONFIG.HOTELBEDS_HOTEL_API_KEY && ENV_CONFIG.HOTELBEDS_HOTEL_SECRET);
        if (!hotelValid) {
          logger.warn('[CONFIG] HotelBeds hotel credentials missing', {
            hasApiKey: !!ENV_CONFIG.HOTELBEDS_HOTEL_API_KEY,
            hasSecret: !!ENV_CONFIG.HOTELBEDS_HOTEL_SECRET
          });
        }
        return hotelValid;
        
      case 'activity':
        const activityValid = !!(ENV_CONFIG.HOTELBEDS_ACTIVITY_API_KEY && ENV_CONFIG.HOTELBEDS_ACTIVITY_SECRET);
        if (!activityValid) {
          logger.warn('[CONFIG] HotelBeds activity credentials missing', {
            hasApiKey: !!ENV_CONFIG.HOTELBEDS_ACTIVITY_API_KEY,
            hasSecret: !!ENV_CONFIG.HOTELBEDS_ACTIVITY_SECRET
          });
        }
        return activityValid;
        
      default:
        return false;
    }
  } catch (error) {
    logger.error(`[CONFIG] Error validating HotelBeds ${service} credentials:`, error);
    return false;
  }
}

export function getAvailableHotelBedsServices(): string[] {
  const services: string[] = [];
  
  if (validateHotelBedsCredentials('hotel')) {
    services.push('hotel');
  }
  
  if (validateHotelBedsCredentials('activity')) {
    services.push('activity');
  }
  
  return services;
}

export function getHotelBedsCredentials(service: 'hotel' | 'activity') {
  switch (service) {
    case 'hotel':
      return {
        apiKey: ENV_CONFIG.HOTELBEDS_HOTEL_API_KEY,
        secret: ENV_CONFIG.HOTELBEDS_HOTEL_SECRET
      };
    case 'activity':
      return {
        apiKey: ENV_CONFIG.HOTELBEDS_ACTIVITY_API_KEY,
        secret: ENV_CONFIG.HOTELBEDS_ACTIVITY_SECRET
      };
    default:
      return { apiKey: '', secret: '' };
  }
}

// Get provider health status
export function getProviderHealthStatus() {
  return {
    amadeus: {
      available: validateProviderCredentials('amadeus'),
      services: ['flight', 'hotel', 'activity']
    },
    sabre: {
      available: validateProviderCredentials('sabre'),
      services: ['flight', 'hotel']
    },
    hotelbeds: {
      available: validateHotelBedsCredentials('hotel') || validateHotelBedsCredentials('activity'),
      services: getAvailableHotelBedsServices()
    }
  };
}

// Check if core secrets are configured
export function validateCoreSecrets(): { valid: boolean; missing: string[] } {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  const missing = required.filter(key => !ENV_CONFIG[key as keyof typeof ENV_CONFIG]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Production readiness validation
export const validateProductionReadiness = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AMADEUS_CLIENT_ID',
    'AMADEUS_CLIENT_SECRET',
    'STRIPE_SECRET_KEY'
  ];
  
  const missing = required.filter(key => !ENV_CONFIG[key as keyof typeof ENV_CONFIG]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables:', missing);
    return false;
  }
  
  logger.info('✅ Production readiness check passed');
  return true;
};

// MTLS configuration for secure provider connections
export const getMTLSConfig = () => {
  return {
    rejectUnauthorized: Deno.env.get('NODE_ENV') === 'production',
    timeout: 30000,
    retries: 3
  };
};

// Emergency configuration check
export function performEmergencyConfigCheck(): boolean {
  const coreSecrets = validateCoreSecrets();
  const providerHealth = getProviderHealthStatus();
  
  const hasAtLeastOneProvider = Object.values(providerHealth).some(p => p.available);
  
  if (!coreSecrets.valid) {
    logger.error('[CONFIG] CRITICAL: Core secrets missing:', coreSecrets.missing);
    return false;
  }
  
  if (!hasAtLeastOneProvider) {
    logger.error('[CONFIG] CRITICAL: No providers available');
    return false;
  }
  
  logger.info('[CONFIG] Emergency check passed', {
    coreSecrets: coreSecrets.valid,
    providersAvailable: Object.entries(providerHealth)
      .filter(([, config]) => config.available)
      .map(([name]) => name)
  });
  
  return true;
}