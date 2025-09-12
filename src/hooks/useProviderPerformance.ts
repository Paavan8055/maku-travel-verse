import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProviderMetrics {
  provider_id: string;
  provider_name: string;
  success_rate: number;
  avg_response_time: number;
  total_bookings: number;
  revenue_generated: number;
  cost_per_booking: number;
  roi_percentage: number;
  market_share: number;
  customer_satisfaction: number;
  last_updated: string;
}

export interface ProviderAlert {
  id: string;
  provider_id: string;
  alert_type: 'performance_drop' | 'high_cost' | 'low_roi' | 'outage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold_value: number;
  current_value: number;
  created_at: string;
}

export const useProviderPerformance = () => {
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [alerts, setAlerts] = useState<ProviderAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const fetchProviderMetrics = async () => {
    setLoading(true);
    try {
      // Simulate comprehensive provider metrics - in production this would come from aggregated data
      const mockMetrics: ProviderMetrics[] = [
        {
          provider_id: 'amadeus',
          provider_name: 'Amadeus',
          success_rate: 94.2,
          avg_response_time: 1240,
          total_bookings: 1847,
          revenue_generated: 142350.80,
          cost_per_booking: 12.45,
          roi_percentage: 156.3,
          market_share: 45.2,
          customer_satisfaction: 4.3,
          last_updated: new Date().toISOString()
        },
        {
          provider_id: 'sabre',
          provider_name: 'Sabre',
          success_rate: 87.8,
          avg_response_time: 2100,
          total_bookings: 934,
          revenue_generated: 78920.45,
          cost_per_booking: 18.20,
          roi_percentage: 134.7,
          market_share: 28.7,
          customer_satisfaction: 3.9,
          last_updated: new Date().toISOString()
        },
        {
          provider_id: 'hotelbeds',
          provider_name: 'HotelBeds',
          success_rate: 91.5,
          avg_response_time: 980,
          total_bookings: 2156,
          revenue_generated: 198760.30,
          cost_per_booking: 8.90,
          roi_percentage: 178.9,
          market_share: 67.8,
          customer_satisfaction: 4.5,
          last_updated: new Date().toISOString()
        },
        {
          provider_id: 'viator',
          provider_name: 'Viator',
          success_rate: 96.1,
          avg_response_time: 750,
          total_bookings: 567,
          revenue_generated: 34280.20,
          cost_per_booking: 6.75,
          roi_percentage: 189.4,
          market_share: 78.9,
          customer_satisfaction: 4.7,
          last_updated: new Date().toISOString()
        }
      ];

      // Generate intelligent alerts based on metrics
      const generatedAlerts: ProviderAlert[] = [];
      
      mockMetrics.forEach((metric) => {
        if (metric.success_rate < 90) {
          generatedAlerts.push({
            id: `alert_${metric.provider_id}_success`,
            provider_id: metric.provider_id,
            alert_type: 'performance_drop',
            severity: metric.success_rate < 85 ? 'critical' : 'high',
            message: `${metric.provider_name} success rate (${metric.success_rate}%) below threshold`,
            threshold_value: 90,
            current_value: metric.success_rate,
            created_at: new Date().toISOString()
          });
        }

        if (metric.roi_percentage < 140) {
          generatedAlerts.push({
            id: `alert_${metric.provider_id}_roi`,
            provider_id: metric.provider_id,
            alert_type: 'low_roi',
            severity: 'medium',
            message: `${metric.provider_name} ROI (${metric.roi_percentage}%) trending downward`,
            threshold_value: 140,
            current_value: metric.roi_percentage,
            created_at: new Date().toISOString()
          });
        }

        if (metric.avg_response_time > 2000) {
          generatedAlerts.push({
            id: `alert_${metric.provider_id}_latency`,
            provider_id: metric.provider_id,
            alert_type: 'performance_drop',
            severity: 'medium',
            message: `${metric.provider_name} response time (${metric.avg_response_time}ms) exceeds target`,
            threshold_value: 2000,
            current_value: metric.avg_response_time,
            created_at: new Date().toISOString()
          });
        }
      });

      setMetrics(mockMetrics);
      setAlerts(generatedAlerts);

      // Log performance data to correlation tracking
      await supabase.functions.invoke('correlation-data-collector', {
        body: {
          correlation_id: `provider_metrics_${Date.now()}`,
          request_type: 'provider_performance_analysis',
          status: 'completed',
          service_name: 'provider_intelligence',
          metadata: {
            providers_analyzed: mockMetrics.length,
            alerts_generated: generatedAlerts.length,
            total_revenue: mockMetrics.reduce((sum, m) => sum + m.revenue_generated, 0),
            avg_roi: mockMetrics.reduce((sum, m) => sum + m.roi_percentage, 0) / mockMetrics.length
          }
        }
      });

    } catch (error) {
      console.error('Error fetching provider metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProviderRanking = () => {
    return metrics
      .map(metric => ({
        ...metric,
        composite_score: (
          metric.success_rate * 0.3 +
          metric.roi_percentage * 0.25 +
          metric.customer_satisfaction * 20 +
          (metric.market_share * 0.1) +
          (2000 - metric.avg_response_time) / 20
        )
      }))
      .sort((a, b) => b.composite_score - a.composite_score);
  };

  const getRevenueAtRisk = () => {
    return alerts
      .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
      .reduce((total, alert) => {
        const metric = metrics.find(m => m.provider_id === alert.provider_id);
        return total + (metric?.revenue_generated || 0) * 0.15; // 15% risk factor
      }, 0);
  };

  useEffect(() => {
    fetchProviderMetrics();

    // Set up real-time subscription for provider performance
    const channel = supabase
      .channel('provider-performance')
      .on('broadcast', { event: 'metric_update' }, (payload) => {
        console.log('Provider performance update:', payload);
        fetchProviderMetrics();
        setRealtimeConnected(true);
      })
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProviderMetrics, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return {
    metrics,
    alerts,
    loading,
    realtimeConnected,
    calculateProviderRanking,
    getRevenueAtRisk,
    refetch: fetchProviderMetrics
  };
};