import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PartnerMetrics {
  activePartners: number;
  partnerRevenue: number;
  globalReach: number;
  partnerSatisfaction: number;
  partnersChange: number;
  revenueChange: number;
  reachChange: number;
  satisfactionChange: number;
}

interface TopPartner {
  name: string;
  revenue: number;
  growth: number;
  status: string;
}

export const usePartnerMetrics = () => {
  const [metrics, setMetrics] = useState<PartnerMetrics | null>(null);
  const [topPartners, setTopPartners] = useState<TopPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch partner analytics from business intelligence
      const { data: biData, error: biError } = await supabase.functions.invoke('business-intelligence', {
        body: { action: 'partner_performance_analysis' }
      });

      if (biError) throw biError;

      // Fetch partner analytics data from database
      const { data: partnerData, error: partnerError } = await supabase
        .from('partner_analytics')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1);

      if (partnerError) throw partnerError;

      // Fetch partner profiles count
      const { count: partnersCount, error: countError } = await supabase
        .from('partner_profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      const businessData = biData?.data || {};
      const latestPartnerData = partnerData?.[0];

      setMetrics({
        activePartners: partnersCount || 0,
        partnerRevenue: latestPartnerData?.total_revenue || 0,
        globalReach: businessData.partner_reach?.countries_covered || 0,
        partnerSatisfaction: businessData.partner_satisfaction?.average_rating || 95,
        partnersChange: businessData.partner_growth?.partner_growth_rate || 15,
        revenueChange: businessData.revenue_growth?.partner_revenue_growth || 25,
        reachChange: businessData.partner_reach?.expansion_rate || 12,
        satisfactionChange: businessData.partner_satisfaction?.satisfaction_trend || 5
      });

      // Set mock top partners for now (would be replaced with real data query)
      setTopPartners([
        { name: 'Amadeus', revenue: 240000, growth: 25.3, status: 'Growing' },
        { name: 'Hotelbeds', revenue: 185000, growth: 18.7, status: 'Stable' },
        { name: 'Local Hotels Co.', revenue: 95000, growth: 42.1, status: 'Growing' }
      ]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch partner metrics';
      setError(errorMessage);
      console.error('Error fetching partner metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    topPartners,
    loading,
    error,
    refetch: fetchMetrics
  };
};