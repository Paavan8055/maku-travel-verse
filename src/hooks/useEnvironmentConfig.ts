import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface EnvironmentConfig {
  amadeus_base_url: string;
  sabre_base_url: string;
  hotelbeds_base_url: string;
  stripe_mode: 'test' | 'live';
}

export const useEnvironmentConfig = () => {
  const [config, setConfig] = useState<EnvironmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEnvironmentConfig();
  }, []);

  const loadEnvironmentConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine environment (default to development)
      const environment = import.meta.env.MODE === 'production' ? 'production' : 'development';
      
      const { data, error: configError } = await supabase
        .from('environment_configs')
        .select('config_key, config_value')
        .eq('environment', environment)
        .eq('is_active', true);

      if (configError) {
        throw new Error(`Failed to load environment config: ${configError.message}`);
      }

      if (!data || data.length === 0) {
        logger.warn('No environment configuration found, using defaults');
        // Use default configuration
        setConfig({
          amadeus_base_url: environment === 'production' 
            ? 'https://api.amadeus.com' 
            : 'https://test.api.amadeus.com',
          sabre_base_url: environment === 'production'
            ? 'https://api.havail.sabre.com'  
            : 'https://api-crt.cert.havail.sabre.com',
          hotelbeds_base_url: environment === 'production'
            ? 'https://api.hotelbeds.com'
            : 'https://api.test.hotelbeds.com',
          stripe_mode: environment === 'production' ? 'live' : 'test'
        });
        return;
      }

      // Transform data into config object
      const configMap = data.reduce((acc, item) => {
        acc[item.config_key] = typeof item.config_value === 'string' 
          ? JSON.parse(item.config_value) 
          : item.config_value;
        return acc;
      }, {} as Record<string, any>);

      setConfig(configMap as EnvironmentConfig);
      logger.info('Environment configuration loaded', { environment, config: configMap });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load environment configuration';
      logger.error('Environment config error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    loading,
    error,
    reload: loadEnvironmentConfig
  };
};