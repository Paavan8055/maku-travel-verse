import { useState, useEffect } from 'react';

export interface PartnerProvider {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'activity';
  api_endpoint: string;
  status: 'active' | 'inactive' | 'testing';
  health_status: 'healthy' | 'degraded' | 'offline';
  performance_score: number;
  auto_discovered: boolean;
  integration_priority: number;
  supported_companions: string[];
  rate_limit: number;
  cost_per_request: number;
  last_health_check: string;
  metadata: {
    region: string;
    specialties: string[];
    established: string;
    features?: string[];
    demo_label?: string;
    api_version?: string;
    [key: string]: any;
  };
}

export interface PartnerAnalytics {
  summary: {
    total_providers: number;
    active_providers: number;
    healthy_providers: number;
    auto_discovered_providers: number;
    avg_performance_score: number;
    total_requests_24h: number;
    success_rate_24h: number;
    demo_data_disclaimer?: string;
  };
  performance_by_type: {
    [key: string]: {
      count: number;
      avg_score: number;
      success_rate: number;
      providers?: string[];
    };
  };
  top_performers: Array<{
    name: string;
    score: number;
    type: string;
    demo?: boolean;
    specialty?: string;
  }>;
  partner_spotlight?: {
    key_partners: Array<{
      name: string;
      type: string;
      status: string;
      performance: number;
      specialties: string[];
      integration_date: string;
      demo_label?: string;
    }>;
  };
}

export const usePartnerProviders = () => {
  const [providers, setProviders] = useState<PartnerProvider[]>([]);
  const [analytics, setAnalytics] = useState<PartnerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      // Fetch all providers
      const providersResponse = await fetch(`${backendUrl}/api/smart-dreams/providers`);
      if (!providersResponse.ok) {
        throw new Error(`Failed to fetch providers: ${providersResponse.status}`);
      }
      const providersData = await providersResponse.json();
      
      // Fetch analytics 
      const analyticsResponse = await fetch(`${backendUrl}/api/smart-dreams/providers/analytics`);
      if (!analyticsResponse.ok) {
        throw new Error(`Failed to fetch analytics: ${analyticsResponse.status}`);
      }
      const analyticsData = await analyticsResponse.json();

      setProviders(providersData.providers || []);
      setAnalytics(analyticsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching partner providers:', err);
      
      // Set fallback data in case of error
      setProviders([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProviders = () => {
    fetchProviders();
  };

  const getProvidersByType = (type: string) => {
    return providers.filter(provider => provider.type === type);
  };

  const getActiveProviders = () => {
    return providers.filter(provider => provider.status === 'active');
  };

  const getHealthyProviders = () => {
    return providers.filter(provider => provider.health_status === 'healthy');
  };

  const getDemoProviders = () => {
    return providers.filter(provider => provider.metadata.demo_label);
  };

  const getProductionProviders = () => {
    return providers.filter(provider => !provider.metadata.demo_label);
  };

  const getTopPerformers = (limit: number = 5) => {
    return [...providers]
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, limit);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return {
    providers,
    analytics,
    loading,
    error,
    refreshProviders,
    getProvidersByType,
    getActiveProviders,
    getHealthyProviders,
    getDemoProviders,
    getProductionProviders,
    getTopPerformers
  };
};

export default usePartnerProviders;