import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { correlationId } from '@/utils/correlationId';

export interface BookingIntelligence {
  booking_id: string;
  correlation_id: string;
  customer_tier: 'premium' | 'standard' | 'budget';
  booking_value: number;
  provider_performance: {
    provider_id: string;
    response_time: number;
    success_rate: number;
    cost_efficiency: number;
  };
  risk_factors: {
    payment_timeout_risk: number;
    provider_failure_risk: number;
    customer_abandonment_risk: number;
  };
  optimization_suggestions: string[];
  predicted_completion_time: number;
  revenue_protection_status: 'safe' | 'warning' | 'critical';
}

export interface RealtimeBookingEvent {
  event_type: 'booking_started' | 'provider_selected' | 'payment_initiated' | 'booking_completed' | 'booking_failed';
  booking_id: string;
  timestamp: string;
  metadata: any;
}

export const useBookingIntelligence = () => {
  const [activeBookings, setActiveBookings] = useState<BookingIntelligence[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeBookingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRevenueAtRisk, setTotalRevenueAtRisk] = useState(0);

  const integrateWithBookingFlow = async (bookingData: any) => {
    try {
      const intelligence = await analyzeBookingInRealTime(bookingData);
      
      // Log to correlation tracking with enhanced metadata
      await supabase.functions.invoke('correlation-data-collector', {
        body: {
          correlation_id: correlationId.getCurrentId(),
          request_type: 'booking_intelligence_analysis',
          status: 'in_progress',
          service_name: 'booking_intelligence_engine',
          provider_id: bookingData.provider,
          booking_value: bookingData.total_amount,
          customer_tier: intelligence.customer_tier,
          session_id: bookingData.session_id,
          booking_type: bookingData.booking_type,
          metadata: {
            risk_score: calculateOverallRiskScore(intelligence.risk_factors),
            provider_performance: intelligence.provider_performance,
            optimization_count: intelligence.optimization_suggestions.length,
            revenue_protection_status: intelligence.revenue_protection_status
          }
        }
      });

      return intelligence;
    } catch (error) {
      console.error('Error integrating booking intelligence:', error);
      throw error;
    }
  };

  const analyzeBookingInRealTime = async (bookingData: any): Promise<BookingIntelligence> => {
    // Simulate real-time ML analysis - in production this would use actual ML models
    const customerTier = determineCustomerTier(bookingData.total_amount);
    const providerPerformance = await getProviderPerformance(bookingData.provider);
    const riskFactors = calculateRiskFactors(bookingData);
    const optimizations = generateOptimizationSuggestions(bookingData, riskFactors);
    
    return {
      booking_id: bookingData.booking_id || `booking_${Date.now()}`,
      correlation_id: correlationId.getCurrentId(),
      customer_tier: customerTier,
      booking_value: bookingData.total_amount,
      provider_performance: providerPerformance,
      risk_factors: riskFactors,
      optimization_suggestions: optimizations,
      predicted_completion_time: calculatePredictedCompletionTime(riskFactors),
      revenue_protection_status: determineRevenueProtectionStatus(riskFactors, bookingData.total_amount)
    };
  };

  const determineCustomerTier = (bookingValue: number): 'premium' | 'standard' | 'budget' => {
    if (bookingValue > 2000) return 'premium';
    if (bookingValue > 500) return 'standard';
    return 'budget';
  };

  const getProviderPerformance = async (providerId: string) => {
    // Simulate provider performance lookup
    const performanceMap: Record<string, any> = {
      'amadeus': { provider_id: 'amadeus', response_time: 1240, success_rate: 94.2, cost_efficiency: 87.5 },
      'sabre': { provider_id: 'sabre', response_time: 2100, success_rate: 87.8, cost_efficiency: 72.3 },
      'hotelbeds': { provider_id: 'hotelbeds', response_time: 980, success_rate: 91.5, cost_efficiency: 92.1 },
      'viator': { provider_id: 'viator', response_time: 750, success_rate: 96.1, cost_efficiency: 94.8 }
    };
    
    return performanceMap[providerId] || { provider_id: providerId, response_time: 1500, success_rate: 90, cost_efficiency: 80 };
  };

  const calculateRiskFactors = (bookingData: any) => {
    const baseTimeoutRisk = bookingData.total_amount > 1000 ? 0.15 : 0.25;
    const providerFailureRisk = bookingData.provider === 'sabre' ? 0.12 : 0.05;
    const abandonmentRisk = bookingData.booking_type === 'flight' ? 0.18 : 0.10;

    return {
      payment_timeout_risk: Math.min(baseTimeoutRisk + (Math.random() * 0.1), 0.4),
      provider_failure_risk: Math.min(providerFailureRisk + (Math.random() * 0.05), 0.2),
      customer_abandonment_risk: Math.min(abandonmentRisk + (Math.random() * 0.1), 0.3)
    };
  };

  const generateOptimizationSuggestions = (bookingData: any, riskFactors: any): string[] => {
    const suggestions: string[] = [];

    if (riskFactors.payment_timeout_risk > 0.2) {
      suggestions.push('Extend payment timeout window for high-value bookings');
      suggestions.push('Send proactive timeout warnings via SMS');
    }

    if (riskFactors.provider_failure_risk > 0.1) {
      suggestions.push('Prepare fallback provider for seamless failover');
      suggestions.push('Pre-validate provider availability before payment');
    }

    if (riskFactors.customer_abandonment_risk > 0.15) {
      suggestions.push('Implement exit-intent detection with retention offers');
      suggestions.push('Show progress indicators to reduce abandonment anxiety');
    }

    if (bookingData.total_amount > 1500) {
      suggestions.push('Assign premium customer success manager');
      suggestions.push('Enable priority processing queue');
    }

    return suggestions;
  };

  const calculatePredictedCompletionTime = (riskFactors: Record<string, number>): number => {
    const baseTime = 180; // 3 minutes baseline
    const riskMultiplier = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0);
    return Math.round(baseTime * (1 + riskMultiplier));
  };

  const determineRevenueProtectionStatus = (riskFactors: Record<string, number>, bookingValue: number): 'safe' | 'warning' | 'critical' => {
    const overallRisk = calculateOverallRiskScore(riskFactors);
    
    if (overallRisk > 0.3 && bookingValue > 1000) return 'critical';
    if (overallRisk > 0.2 || bookingValue > 2000) return 'warning';
    return 'safe';
  };

  const calculateOverallRiskScore = (riskFactors: Record<string, number>): number => {
    const values = Object.values(riskFactors);
    return values.reduce((sum, risk) => sum + risk, 0) / values.length;
  };

  const fetchActiveBookingIntelligence = async () => {
    setLoading(true);
    try {
      // Simulate active booking intelligence data
      const mockActiveBookings: BookingIntelligence[] = [
        {
          booking_id: 'booking_001',
          correlation_id: 'corr_001',
          customer_tier: 'premium',
          booking_value: 2450.00,
          provider_performance: {
            provider_id: 'amadeus',
            response_time: 1240,
            success_rate: 94.2,
            cost_efficiency: 87.5
          },
          risk_factors: {
            payment_timeout_risk: 0.12,
            provider_failure_risk: 0.05,
            customer_abandonment_risk: 0.08
          },
          optimization_suggestions: [
            'Assign premium customer success manager',
            'Enable priority processing queue'
          ],
          predicted_completion_time: 195,
          revenue_protection_status: 'warning'
        },
        {
          booking_id: 'booking_002',
          correlation_id: 'corr_002',
          customer_tier: 'standard',
          booking_value: 780.00,
          provider_performance: {
            provider_id: 'hotelbeds',
            response_time: 980,
            success_rate: 91.5,
            cost_efficiency: 92.1
          },
          risk_factors: {
            payment_timeout_risk: 0.25,
            provider_failure_risk: 0.03,
            customer_abandonment_risk: 0.15
          },
          optimization_suggestions: [
            'Extend payment timeout window',
            'Show progress indicators'
          ],
          predicted_completion_time: 210,
          revenue_protection_status: 'safe'
        }
      ];

      setActiveBookings(mockActiveBookings);
      
      // Calculate total revenue at risk
      const revenueAtRisk = mockActiveBookings
        .filter(booking => booking.revenue_protection_status !== 'safe')
        .reduce((total, booking) => {
          const riskMultiplier = booking.revenue_protection_status === 'critical' ? 0.4 : 0.15;
          return total + (booking.booking_value * riskMultiplier);
        }, 0);
      
      setTotalRevenueAtRisk(revenueAtRisk);

    } catch (error) {
      console.error('Error fetching booking intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for booking events
  useEffect(() => {
    fetchActiveBookingIntelligence();

    const channel = supabase
      .channel('booking-intelligence')
      .on('broadcast', { event: 'booking_event' }, (payload) => {
        const newEvent: RealtimeBookingEvent = {
          event_type: payload.event_type,
          booking_id: payload.booking_id,
          timestamp: new Date().toISOString(),
          metadata: payload.metadata
        };
        
        setRealtimeEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
        fetchActiveBookingIntelligence(); // Refresh data on new events
      })
      .subscribe();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchActiveBookingIntelligence, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return {
    activeBookings,
    realtimeEvents,
    loading,
    totalRevenueAtRisk,
    integrateWithBookingFlow,
    analyzeBookingInRealTime,
    refetch: fetchActiveBookingIntelligence
  };
};