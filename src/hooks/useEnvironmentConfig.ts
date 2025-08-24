import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnvironmentConfig {
  isProduction: boolean;
  hotelbeds: {
    baseUrl: string;
    mtlsUrl: string;
    cacheApiUrl: string;
  };
  amadeus: {
    baseUrl: string;
    tokenUrl: string;
  };
  sabre: {
    baseUrl: string;
    tokenUrl: string;
  };
}

export const useEnvironmentConfig = () => {
  const [config, setConfig] = useState<EnvironmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      console.log('🔧 Fetching environment configuration...');
      
      const { data, error } = await supabase.functions.invoke('environment-config', {
        body: { action: 'get_config' }
      });

      if (error) {
        throw error;
      }

      console.log('🔧 Environment config received:', data);
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch environment config:', error);
      
      // Fallback to test configuration
      const fallbackConfig: EnvironmentConfig = {
        isProduction: false,
        hotelbeds: {
          baseUrl: 'https://api.test.hotelbeds.com',
          mtlsUrl: 'https://api.test.hotelbeds.com',
          cacheApiUrl: 'https://api.test.hotelbeds.com/cache-api/1.0'
        },
        amadeus: {
          baseUrl: 'https://test.api.amadeus.com',
          tokenUrl: 'https://test.api.amadeus.com/v1/security/oauth2/token'
        },
        sabre: {
          baseUrl: 'https://api-crt.cert.havail.sabre.com',
          tokenUrl: 'https://api-crt.cert.havail.sabre.com/v2/auth/token'
        }
      };
      
      console.log('🔧 Using fallback test configuration');
      setConfig(fallbackConfig);
      
      toast({
        title: "Configuration Warning",
        description: "Using test environment configuration",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const switchEnvironment = async (toProduction: boolean) => {
    try {
      console.log(`🔧 Switching to ${toProduction ? 'production' : 'test'} environment...`);
      
      const { data, error } = await supabase.functions.invoke('environment-config', {
        body: { 
          action: 'switch_environment',
          environment: toProduction ? 'production' : 'test'
        }
      });

      if (error) {
        throw error;
      }

      setConfig(data);
      
      toast({
        title: "Environment Switched",
        description: `Now using ${toProduction ? 'production' : 'test'} environment`,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to switch environment:', error);
      toast({
        title: "Switch Failed",
        description: "Failed to switch environment configuration",
        variant: "destructive"
      });
    }
  };

  const validateProductionReadiness = async () => {
    try {
      console.log('🔧 Validating production readiness...');
      
      const { data, error } = await supabase.functions.invoke('production-readiness', {
        body: { action: 'validate' }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to validate production readiness:', error);
      return { ready: false, issues: ['Failed to validate configuration'] };
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    switchEnvironment,
    validateProductionReadiness,
    refresh: fetchConfig
  };
};