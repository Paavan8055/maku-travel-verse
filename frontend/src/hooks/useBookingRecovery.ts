import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

interface BookingRecoveryResult {
  booking_id: string;
  booking_reference: string;
  status: string;
  reason?: string;
}

interface BookingHealthMetrics {
  summary: {
    total_bookings_7d: number;
    total_payments_7d: number;
    bookings_24h: number;
    payments_24h: number;
    booking_success_rate: number;
    payment_success_rate: number;
    total_revenue_7d: number;
    revenue_24h: number;
  };
  health_score: {
    score: number;
    status: string;
    color: string;
  };
  critical_issues: Array<{
    severity: string;
    type: string;
    message: string;
    recommendation: string;
  }>;
}

export const useBookingRecovery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<BookingHealthMetrics | null>(null);
  const { toast } = useToast();

  const fixStuckBookings = async (): Promise<BookingRecoveryResult[]> => {
    setIsLoading(true);
    try {
      logger.info('Fixing stuck bookings...');
      
      const { data, error } = await supabase.functions.invoke('fix-stuck-bookings');

      if (error) {
        logger.error('Error fixing stuck bookings:', error);
        throw error;
      }

      if (data?.success) {
        const { summary, results } = data;
        
        toast({
          title: 'Booking Recovery Complete',
          description: `Processed ${summary.total_processed} bookings. ${summary.recovered + summary.confirmed} recovered successfully.`
        });

        logger.info('Stuck bookings fixed successfully:', summary);
        return results || [];
      } else {
        throw new Error(data?.error || 'Failed to fix stuck bookings');
      }
    } catch (error: any) {
      logger.error('Failed to fix stuck bookings:', error);
      toast({
        title: 'Recovery Failed',
        description: error.message || 'Failed to fix stuck bookings',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getBookingHealthMetrics = async (): Promise<BookingHealthMetrics> => {
    setIsLoading(true);
    try {
      logger.info('Fetching booking health metrics...');
      
      const { data, error } = await supabase.functions.invoke('booking-health-monitor');

      if (error) {
        logger.error('Error fetching booking health metrics:', error);
        throw error;
      }

      if (data?.success) {
        const metrics = data.metrics as BookingHealthMetrics;
        setHealthMetrics(metrics);
        logger.info('Booking health metrics fetched successfully');
        return metrics;
      } else {
        throw new Error(data?.error || 'Failed to fetch booking health metrics');
      }
    } catch (error: any) {
      logger.error('Failed to fetch booking health metrics:', error);
      toast({
        title: 'Health Check Failed',
        description: error.message || 'Failed to fetch booking health metrics',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const runFullRecovery = async () => {
    try {
      // First get health metrics
      const metrics = await getBookingHealthMetrics();
      
      // If there are critical issues, run stuck booking fix
      if (metrics.critical_issues && metrics.critical_issues.length > 0) {
        const recoveryResults = await fixStuckBookings();
        
        // Get updated health metrics after recovery
        const updatedMetrics = await getBookingHealthMetrics();
        
        return {
          initialMetrics: metrics,
          recoveryResults,
          finalMetrics: updatedMetrics
        };
      } else {
        toast({
          title: 'System Healthy',
          description: 'No critical issues found. System is operating normally.'
        });
        
        return {
          initialMetrics: metrics,
          recoveryResults: [],
          finalMetrics: metrics
        };
      }
    } catch (error: any) {
      logger.error('Full recovery failed:', error);
      throw error;
    }
  };

  return {
    isLoading,
    healthMetrics,
    fixStuckBookings,
    getBookingHealthMetrics,
    runFullRecovery
  };
};