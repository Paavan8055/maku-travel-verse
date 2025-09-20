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

  // Check for bypass mode
  const urlParams = new URLSearchParams(window.location.search);
  const hasAdminBypass = urlParams.get('bypass') === 'admin';
  const isPreviewEnvironment = window.location.hostname.includes('preview.emergentagent.com');
  const isInBypassMode = hasAdminBypass && isPreviewEnvironment;

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // If in bypass mode, provide mock data
      if (isInBypassMode) {
        logger.info('Admin bypass mode: Using mock admin metrics');
        const mockMetrics: AdminMetrics = {
          totalBookings: 1247,
          totalRevenue: 89650.50,
          totalUsers: 2834,
          activeProperties: 156,
          recentBookings: [
            {
              id: 'bk_001',
              booking_reference: 'MK-2024-001',
              booking_type: 'Hotel',
              customer_email: 'demo@example.com',
              amount: 299.99,
              created_at: new Date().toISOString()
            },
            {
              id: 'bk_002', 
              booking_reference: 'MK-2024-002',
              booking_type: 'Flight',
              customer_email: 'test@example.com',
              amount: 599.99,
              created_at: new Date(Date.now() - 86400000).toISOString()
            }
          ],
          lastUpdated: new Date().toISOString()
        };
        
        setMetrics(mockMetrics);
        logger.info('Mock admin metrics loaded successfully');
        return;
      }

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