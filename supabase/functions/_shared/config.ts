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

export default config;