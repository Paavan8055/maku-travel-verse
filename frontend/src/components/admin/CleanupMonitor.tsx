import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock, Activity, RefreshCw } from 'lucide-react';

interface CleanupStats {
  total_cleanups_24h: number;
  bookings_cleaned_24h: number;
  current_pending: number;
  last_cleanup: string;
}

interface CleanupMonitoring {
  system_health: {
    cron_jobs_active: number;
    pending_bookings_1h: number;
    pending_bookings_24h: number;
  };
  cleanup_performance: {
    avg_execution_time_ms: number;
    success_rate: number;
    last_error: any;
  };
}

export default function CleanupMonitor() {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [monitoring, setMonitoring] = useState<CleanupMonitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get cleanup stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_cleanup_stats');
      
      if (statsError) throw statsError;
      
      // Get monitoring data
      const { data: monitoringData, error: monitoringError } = await supabase
        .rpc('get_cleanup_monitoring');
      
      if (monitoringError) throw monitoringError;
      
      setStats(statsData as unknown as CleanupStats);
      setMonitoring(monitoringData as unknown as CleanupMonitoring);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runManualCleanup = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fix-stuck-bookings', {
        body: { automated: false, timeout_minutes: 60 }
      });

      if (error) throw error;

      toast({
        title: 'Manual Cleanup Complete',
        description: `Processed ${data.summary.total_processed} bookings. ${data.summary.expired || data.summary.failed} expired.`
      });

      // Refresh stats after cleanup
      setTimeout(fetchStats, 1000);
    } catch (error: any) {
      toast({
        title: 'Cleanup Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Cleanup System Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const systemHealthy = monitoring?.system_health.cron_jobs_active > 0 && 
                      monitoring?.system_health.pending_bookings_1h === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Cleanup System Monitor
            <Badge variant={systemHealthy ? "secondary" : "destructive"}>
              {systemHealthy ? "Healthy" : "Alert"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              onClick={fetchStats} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button 
              onClick={runManualCleanup}
              variant="secondary"
              size="sm"
            >
              Run Manual Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {stats?.current_pending || 0}
              </div>
              {(stats?.current_pending || 0) === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bookings pending &gt; 60 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cleanups (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_cleanups_24h || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Automated runs executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cleaned (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.bookings_cleaned_24h || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bookings expired/failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitoring?.cleanup_performance.success_rate?.toFixed(1) || '100'}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cleanup execution success
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">System Health Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Cron Jobs Active</span>
            <Badge variant={monitoring?.system_health.cron_jobs_active && monitoring.system_health.cron_jobs_active > 0 ? "secondary" : "destructive"}>
              {monitoring?.system_health.cron_jobs_active || 0}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Avg Execution Time</span>
            <span className="text-sm font-medium">
              {monitoring?.cleanup_performance.avg_execution_time_ms ? 
                `${Math.round(monitoring.cleanup_performance.avg_execution_time_ms)}ms` : 
                'N/A'
              }
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Last Cleanup</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {stats?.last_cleanup ? 
                  new Date(stats.last_cleanup).toLocaleTimeString() : 
                  'Never'
                }
              </span>
            </div>
          </div>

          {monitoring?.cleanup_performance.last_error && (
            <div className="p-3 bg-destructive/10 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Last Error</span>
              </div>
              <pre className="text-xs text-muted-foreground overflow-x-auto">
                {JSON.stringify(monitoring.cleanup_performance.last_error, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}