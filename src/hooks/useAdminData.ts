import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AdminDataState {
  metrics: any;
  providerHealth: any[];
  criticalAlerts: any[];
  systemLogs: any[];
  bookings: any[];
  users: any[];
  isLoading: boolean;
  lastUpdated: Date | null;
}

export const useAdminData = () => {
  const [state, setState] = useState<AdminDataState>({
    metrics: null,
    providerHealth: [],
    criticalAlerts: [],
    systemLogs: [],
    bookings: [],
    users: [],
    isLoading: true,
    lastUpdated: null
  });

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const fetchAllData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Fetch metrics
      const { data: metricsData } = await supabase.functions.invoke('admin-metrics');

      // Fetch provider health
      const { data: providerHealthData } = await supabase
        .from('provider_health')
        .select('*')
        .order('last_checked', { ascending: false });

      // Fetch critical alerts
      const { data: alertsData } = await supabase
        .from('critical_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent system logs
      const { data: logsData } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch recent bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setState(prev => ({
        ...prev,
        metrics: metricsData,
        providerHealth: providerHealthData || [],
        criticalAlerts: alertsData || [],
        systemLogs: logsData || [],
        bookings: bookingsData || [],
        isLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const setupRealtimeSubscriptions = () => {
    const newChannel = supabase.channel('admin-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'provider_health'
      }, (payload) => {
        setState(prev => ({
          ...prev,
          providerHealth: prev.providerHealth.map(item => 
            item.id === (payload.new as any)?.id ? payload.new : item
          ),
          lastUpdated: new Date()
        }));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'critical_alerts'
      }, (payload) => {
        setState(prev => ({
          ...prev,
          criticalAlerts: [payload.new, ...prev.criticalAlerts.slice(0, 9)],
          lastUpdated: new Date()
        }));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'system_logs'
      }, (payload) => {
        setState(prev => ({
          ...prev,
          systemLogs: [payload.new, ...prev.systemLogs.slice(0, 49)],
          lastUpdated: new Date()
        }));
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        setState(prev => {
          if (payload.eventType === 'INSERT') {
            return {
              ...prev,
              bookings: [payload.new, ...prev.bookings.slice(0, 19)],
              lastUpdated: new Date()
            };
          } else if (payload.eventType === 'UPDATE') {
            return {
              ...prev,
              bookings: prev.bookings.map(booking => 
                booking.id === payload.new?.id ? payload.new : booking
              ),
              lastUpdated: new Date()
            };
          }
          return prev;
        });
      })
      .subscribe();

    setChannel(newChannel);
  };

  const refreshData = () => {
    fetchAllData();
  };

  const getHealthStatus = () => {
    const totalProviders = state.providerHealth.length;
    const healthyProviders = state.providerHealth.filter(p => p.status === 'healthy').length;
    const criticalAlertsCount = state.criticalAlerts.length;

    if (criticalAlertsCount > 5) return 'critical';
    if (healthyProviders / totalProviders < 0.8) return 'warning';
    return 'healthy';
  };

  const getMetricsSummary = () => {
    return {
      totalBookings: state.bookings.length,
      totalAlerts: state.criticalAlerts.length,
      healthyProviders: state.providerHealth.filter(p => p.status === 'healthy').length,
      totalProviders: state.providerHealth.length,
      recentErrors: state.systemLogs.filter(log => log.log_level === 'error').length
    };
  };

  useEffect(() => {
    fetchAllData();
    setupRealtimeSubscriptions();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchAllData, 30000);

    return () => {
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return {
    ...state,
    refreshData,
    getHealthStatus,
    getMetricsSummary
  };
};