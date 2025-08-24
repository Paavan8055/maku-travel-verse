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

// Credential validation helper
export function validateProviderCredentials(provider: 'amadeus' | 'sabre' | 'hotelbeds'): boolean {
  switch (provider) {
    case 'amadeus':
      return !!(Deno.env.get('AMADEUS_CLIENT_ID') && Deno.env.get('AMADEUS_CLIENT_SECRET'));
    case 'sabre':
      return !!(Deno.env.get('SABRE_CLIENT_ID') && Deno.env.get('SABRE_CLIENT_SECRET'));
    case 'hotelbeds':
      return !!(Deno.env.get('HOTELBEDS_API_KEY') && Deno.env.get('HOTELBEDS_SECRET'));
    default:
      return false;
  }
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

// Production readiness checks
export function validateProductionReadiness(): { ready: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (ENV_CONFIG.isProduction) {
    if (!validateProviderCredentials('hotelbeds')) {
      issues.push('HotelBeds production credentials not configured');
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