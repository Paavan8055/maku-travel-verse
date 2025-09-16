import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface AdminMetrics {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  activeProperties: number;
  recentBookings: any[];
  lastUpdated: string;
}

export const useAdminMetrics = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('admin-metrics');

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch admin metrics');
      }

      setMetrics(data.data);
      logger.info('Admin metrics loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch admin metrics';
      setError(errorMessage);
      logger.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  };
};