import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { correlationId } from '@/utils/correlationId';

interface AnalyticsQuery {
  type: 'performance' | 'health' | 'correlation' | 'predictions';
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  providers?: string[];
  metrics?: string[];
}

interface AnalyticsResult {
  success: boolean;
  data: any;
  correlationId: string;
  generatedAt: string;
  summary?: {
    [key: string]: any;
  };
}

export const useAdvancedAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AnalyticsResult | null>(null);

  const generateAnalytics = useCallback(async (query: AnalyticsQuery): Promise<AnalyticsResult | null> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: query,
        headers: correlationId.getHeaders()
      });

      if (error) throw error;

      const result: AnalyticsResult = data;
      setLastResult(result);
      
      return result;
    } catch (error) {
      console.error('Analytics generation failed:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPerformanceAnalytics = useCallback((timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h') => {
    return generateAnalytics({
      type: 'performance',
      timeRange
    });
  }, [generateAnalytics]);

  const getHealthAnalytics = useCallback((timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h') => {
    return generateAnalytics({
      type: 'health',
      timeRange
    });
  }, [generateAnalytics]);

  const getCorrelationAnalytics = useCallback((timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h') => {
    return generateAnalytics({
      type: 'correlation',
      timeRange
    });
  }, [generateAnalytics]);

  const getPredictiveAnalytics = useCallback((timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '7d') => {
    return generateAnalytics({
      type: 'predictions',
      timeRange
    });
  }, [generateAnalytics]);

  return {
    loading,
    lastResult,
    generateAnalytics,
    getPerformanceAnalytics,
    getHealthAnalytics,
    getCorrelationAnalytics,
    getPredictiveAnalytics
  };
};