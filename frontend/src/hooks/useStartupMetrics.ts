import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StartupMetrics {
  monthlyRevenue: number;
  activeUsers: number;
  totalBookings: number;
  conversionRate: number;
  revenueChange: number;
  usersChange: number;
  bookingsChange: number;
  conversionChange: number;
}

export const useStartupMetrics = () => {
  const [metrics, setMetrics] = useState<StartupMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('business-intelligence', {
        body: { action: 'kpi_dashboard' }
      });

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch startup metrics');
      }

      const businessData = data.data;
      
      setMetrics({
        monthlyRevenue: businessData.financial?.monthly_recurring_revenue || 0,
        activeUsers: businessData.operational?.total_active_users || 0,
        totalBookings: businessData.operational?.total_bookings || 0,
        conversionRate: businessData.operational?.booking_conversion_rate || 0,
        revenueChange: businessData.financial?.revenue_growth_rate || 0,
        usersChange: businessData.operational?.user_growth_rate || 0,
        bookingsChange: businessData.operational?.booking_growth_rate || 0,
        conversionChange: businessData.operational?.conversion_improvement_rate || 0
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch startup metrics';
      setError(errorMessage);
      console.error('Error fetching startup metrics:', err);
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