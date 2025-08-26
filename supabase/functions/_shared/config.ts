// Common configuration for all Supabase functions
export const config = {
  cors: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  },
  
  // Supabase configuration
  supabase: {
    url: 'SUPABASE_URL',
    serviceRoleKey: 'SUPABASE_SERVICE_ROLE_KEY',
  },
  
  // Provider configurations
  providers: {
    amadeus: {
      clientId: 'AMADEUS_CLIENT_ID',
      clientSecret: 'AMADEUS_CLIENT_SECRET',
      baseUrl: 'https://test.api.amadeus.com',
    },
    
    sabre: {
      clientId: 'SABRE_CLIENT_ID',
      clientSecret: 'SABRE_CLIENT_SECRET',
      baseUrl: 'SABRE_BASE_URL',
    },
    
    hotelbeds: {
      apiKey: 'HOTELBEDS_API_KEY',
      secret: 'HOTELBEDS_SECRET',
      baseUrl: 'https://api.test.hotelbeds.com',
    },
    
    stripe: {
      secretKey: 'STRIPE_SECRET_KEY',
      publishableKey: 'STRIPE_PUBLISHABLE_KEY',
      webhookSecret: 'STRIPE_WEBHOOK_SECRET',
    }
  },
  
  // Rate limiting
  rateLimits: {
    default: 100, // requests per minute
    health: 30,   // health checks per minute
    search: 60,   // searches per minute
  },
  
  // Timeouts
  timeouts: {
    default: 30000, // 30 seconds
    provider: 15000, // 15 seconds for provider calls
    booking: 60000,  // 60 seconds for booking operations
  }
};

// NEW: Environment-specific configuration that Edge Functions expect
export const ENV_CONFIG = {
  amadeus: {
    baseUrl: 'https://test.api.amadeus.com',
    tokenUrl: 'https://test.api.amadeus.com/v1/security/oauth2/token'
  },
  sabre: {
    baseUrl: 'https://api-crt.cert.havail.sabre.com',
    tokenUrl: 'https://api-crt.cert.havail.sabre.com/v2/auth/token'
  },
  hotelbeds: {
    baseUrl: 'https://api.test.hotelbeds.com',
    mtlsUrl: 'https://api.test.hotelbeds.com',
    cacheApiUrl: 'https://api.test.hotelbeds.com/cache-api/1.0'
  }
};

// Rate limiting configuration for specific providers
export const RATE_LIMITS = {
  amadeus: {
    searchPerMinute: 30,
    bookingPerMinute: 10
  },
  sabre: {
    searchPerMinute: 20,
    bookingPerMinute: 5
  },
  hotelbeds: {
    searchPerMinute: 25,
    bookingPerMinute: 8
  }
};

// Provider validation functions
export function validateProviderCredentials(provider: string): boolean {
  switch (provider) {
    case 'amadeus':
      return !!(Deno.env.get('AMADEUS_CLIENT_ID') && Deno.env.get('AMADEUS_CLIENT_SECRET'));
    case 'sabre':
      return !!(Deno.env.get('SABRE_CLIENT_ID') && Deno.env.get('SABRE_CLIENT_SECRET'));
    case 'hotelbeds':
      return validateHotelBedsCredentials();
    case 'stripe':
      return !!(Deno.env.get('STRIPE_SECRET_KEY') && Deno.env.get('STRIPE_PUBLISHABLE_KEY'));
    default:
      return false;
  }
}

export function validateHotelBedsCredentials(service?: string): boolean {
  // Check service-specific credentials first
  if (service === 'hotel') {
    return !!(Deno.env.get('HOTELBEDS_HOTEL_API_KEY') && Deno.env.get('HOTELBEDS_HOTEL_SECRET'));
  }
  if (service === 'activity') {
    return !!(Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY') && Deno.env.get('HOTELBEDS_ACTIVITY_SECRET'));
  }
  if (service === 'transfer') {
    return !!(Deno.env.get('HOTELBEDS_API_KEY') && Deno.env.get('HOTELBEDS_SECRET'));
  }
  
  // Fallback to generic credentials
  return !!(Deno.env.get('HOTELBEDS_API_KEY') && Deno.env.get('HOTELBEDS_SECRET'));
}

export function getHotelBedsCredentials(service?: string): { apiKey: string; secret: string } | null {
  // Service-specific credentials
  if (service === 'hotel') {
    const apiKey = Deno.env.get('HOTELBEDS_HOTEL_API_KEY');
    const secret = Deno.env.get('HOTELBEDS_HOTEL_SECRET');
    if (apiKey && secret) return { apiKey, secret };
  }
  
  if (service === 'activity') {
    const apiKey = Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY');
    const secret = Deno.env.get('HOTELBEDS_ACTIVITY_SECRET');
    if (apiKey && secret) return { apiKey, secret };
  }
  
  // Fallback to generic credentials
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET');
  if (apiKey && secret) return { apiKey, secret };
  
  return null;
}

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

export default config;