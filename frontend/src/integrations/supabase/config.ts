/**
 * Supabase Configuration Module
 * 
 * This module provides centralized configuration management for the Maku.Travel platform.
 * It reads from both environment tables and environment_configs tables in Supabase,
 * providing a unified interface for both Emergent and Lovable frontends.
 * 
 * Usage:
 *   const config = new SupabaseConfig();
 *   
 *   // Get API keys (client-side, non-sensitive only)
 *   const stripePublishableKey = await config.getPublicConfig('STRIPE_PUBLISHABLE_KEY');
 *   
 *   // Get provider base URLs
 *   const baseUrl = await config.getConfig('amadeus_base_url');
 *   
 *   // Get all provider configurations
 *   const providerConfigs = await config.getAllProviderConfigs();
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface ConfigCache {
  [key: string]: any;
}

interface SecretCache {
  [key: string]: string;
}

interface ProviderConfig {
  [key: string]: any;
}

export class SupabaseConfig {
  private client: SupabaseClient;
  private environment: string;
  private configCache: ConfigCache = {};
  private secretCache: SecretCache = {};
  private cacheTimestamp: number = 0;
  private readonly cacheTTL: number = 300000; // 5 minutes in milliseconds

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
    this.environment = import.meta.env.VITE_ENVIRONMENT || 'development';
    
    console.log(`SupabaseConfig initialized for environment: ${this.environment}`);
  }

  private isCacheValid(): boolean {
    return (Date.now() - this.cacheTimestamp) < this.cacheTTL;
  }

  private async updateCache(): Promise<void> {
    try {
      await this.loadConfigs();
      await this.loadPublicSecrets();
      this.cacheTimestamp = Date.now();
      console.log('Configuration cache updated');
    } catch (error) {
      console.error('Failed to update cache:', error);
    }
  }

  private async loadConfigs(): Promise<void> {
    try {
      const { data, error } = await this.client
        .from('environment_configs')
        .select('*')
        .eq('environment', this.environment)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      this.configCache = {};
      data?.forEach((config: any) => {
        const key = config.config_key;
        let value = config.config_value;
        
        // Handle JSON values
        if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
          try {
            value = JSON.parse(value);
          } catch {
            // If JSON parsing fails, keep as string
          }
        }
        
        this.configCache[key] = value;
      });

      console.log(`Loaded ${Object.keys(this.configCache).length} configurations`);
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  }

  private async loadPublicSecrets(): Promise<void> {
    try {
      // Only load non-secret values (is_secret = false) for client-side
      const { data, error } = await this.client
        .from('environment')
        .select('*')
        .eq('environment', this.environment)
        .eq('is_active', true)
        .eq('is_secret', false); // Only public values

      if (error) {
        throw error;
      }

      this.secretCache = {};
      data?.forEach((secret: any) => {
        this.secretCache[secret.key] = secret.value;
      });

      console.log(`Loaded ${Object.keys(this.secretCache).length} public configurations`);
    } catch (error) {
      console.error('Failed to load public configurations:', error);
      // If secrets table doesn't exist yet, that's okay
    }
  }

  async getPublicConfig(key: string, defaultValue?: string): Promise<string | undefined> {
    """Get a public (non-secret) configuration value"""
    if (!this.isCacheValid()) {
      await this.updateCache();
    }
    
    const value = this.secretCache[key] || defaultValue;
    if (value && value.startsWith('your-')) {
      console.warn(`Configuration ${key} appears to be a placeholder value`);
    }
    return value;
  }

  async getConfig(key: string, defaultValue?: any): Promise<any> {
    """Get a configuration value by key"""
    if (!this.isCacheValid()) {
      await this.updateCache();
    }
    
    return this.configCache[key] || defaultValue;
  }

  async getProviderConfig(provider: string): Promise<ProviderConfig> {
    """Get configuration for a specific provider (public values only)"""
    const providerConfigs: { [key: string]: ProviderConfig } = {
      amadeus: {
        base_url: await this.getConfig('amadeus_base_url', 
          this.environment === 'development' 
            ? 'https://test.api.amadeus.com' 
            : 'https://api.amadeus.com')
      },
      sabre: {
        base_url: await this.getConfig('sabre_base_url',
          this.environment === 'development'
            ? 'https://api-crt.cert.havail.sabre.com'
            : 'https://api.havail.sabre.com')
      },
      viator: {
        base_url: this.environment === 'development'
          ? 'https://api.sandbox-viatorapi.com'
          : 'https://api.viatorapi.com'
      },
      duffle: {
        base_url: 'https://api.duffel.com'
      },
      ratehawk: {
        base_url: 'https://api.ratehawk.com'
      },
      expedia: {
        base_url: 'https://api.ean.com'
      },
      stripe: {
        publishable_key: await this.getPublicConfig('STRIPE_PUBLISHABLE_KEY'),
        mode: await this.getConfig('stripe_mode', 'test')
      }
    };

    return providerConfigs[provider] || {};
  }

  async getAllProviderConfigs(): Promise<{ [provider: string]: ProviderConfig }> {
    """Get configuration for all providers"""
    const providers = ['amadeus', 'sabre', 'viator', 'duffle', 'ratehawk', 'expedia', 'stripe'];
    const configs: { [provider: string]: ProviderConfig } = {};

    for (const provider of providers) {
      configs[provider] = await this.getProviderConfig(provider);
    }

    return configs;
  }

  async isProduction(): Promise<boolean> {
    """Check if running in production environment"""
    return this.environment === 'production';
  }

  getEnvironment(): string {
    """Get current environment"""
    return this.environment;
  }

  async validateConfiguration(): Promise<{
    valid: boolean;
    missing_configs: string[];
    missing_public_configs: string[];
    environment: string;
  }> {
    """Validate that all required configurations are present (public only)"""
    const validationResults = {
      valid: true,
      missing_configs: [] as string[],
      missing_public_configs: [] as string[],
      environment: this.environment
    };

    // Required configurations
    const requiredConfigs = [
      'amadeus_base_url',
      'sabre_base_url',
      'stripe_mode'
    ];

    // Required public configurations
    const requiredPublicConfigs = [
      'STRIPE_PUBLISHABLE_KEY',
      'FRONTEND_URL',
      'API_BASE_URL'
    ];

    // Check configurations
    for (const configKey of requiredConfigs) {
      const configValue = await this.getConfig(configKey);
      if (!configValue) {
        validationResults.missing_configs.push(configKey);
        validationResults.valid = false;
      }
    }

    // Check public configurations
    for (const publicConfigKey of requiredPublicConfigs) {
      const publicConfigValue = await this.getPublicConfig(publicConfigKey);
      if (!publicConfigValue || publicConfigValue.startsWith('your-')) {
        validationResults.missing_public_configs.push(publicConfigKey);
        validationResults.valid = false;
      }
    }

    return validationResults;
  }
}

// Global instance
let configInstance: SupabaseConfig | null = null;

export function getConfigInstance(): SupabaseConfig {
  """Get global configuration instance"""
  if (configInstance === null) {
    configInstance = new SupabaseConfig();
  }
  return configInstance;
}

// Convenience functions
export async function getPublicConfig(key: string, defaultValue?: string): Promise<string | undefined> {
  """Get a public configuration value"""
  const config = getConfigInstance();
  return await config.getPublicConfig(key, defaultValue);
}

export async function getConfig(key: string, defaultValue?: any): Promise<any> {
  """Get a configuration value"""
  const config = getConfigInstance();
  return await config.getConfig(key, defaultValue);
}

export async function getProviderConfig(provider: string): Promise<ProviderConfig> {
  """Get provider configuration"""
  const config = getConfigInstance();
  return await config.getProviderConfig(provider);
}

export async function getAllProviderConfigs(): Promise<{ [provider: string]: ProviderConfig }> {
  """Get all provider configurations"""
  const config = getConfigInstance();
  return await config.getAllProviderConfigs();
}

export async function validateConfiguration(): Promise<{
  valid: boolean;
  missing_configs: string[];
  missing_public_configs: string[];
  environment: string;
}> {
  """Validate configuration"""
  const config = getConfigInstance();
  return await config.validateConfiguration();
}

export default SupabaseConfig;