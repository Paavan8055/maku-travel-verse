import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Zap } from 'lucide-react';

interface CleanupStatus {
  stuck_bookings: number;
  last_cleanup: string | null;
  automated_active: boolean;
  critical_alerts: number;
  github_actions_status: 'unknown' | 'active' | 'failed';
}

export function EmergencyCleanupDashboard() {
  const [status, setStatus] = useState<CleanupStatus>({
    stuck_bookings: 0,
    last_cleanup: null,
    automated_active: false,
    critical_alerts: 0,
    github_actions_status: 'unknown'
  });
  const [loading, setLoading] = useState(true);
  const [manualCleanupRunning, setManualCleanupRunning] = useState(false);

  const fetchStatus = async () => {
    try {
      // Get stuck bookings count
      const { data: stuckBookings, error: stuckError } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString());

      if (stuckError) throw stuckError;

      // Get last cleanup
      const { data: lastCleanup, error: cleanupError } = await supabase
        .from('cleanup_audit')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (cleanupError) throw cleanupError;

      // Get critical alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('critical_alerts')
        .select('id')
        .eq('resolved', false);

      if (alertsError) throw alertsError;

      setStatus({
        stuck_bookings: stuckBookings?.length || 0,
        last_cleanup: lastCleanup?.[0]?.created_at || null,
        automated_active: lastCleanup?.[0] ? 
          (Date.now() - new Date(lastCleanup[0].created_at).getTime()) < 5 * 60 * 1000 : false,
        critical_alerts: alerts?.length || 0,
        github_actions_status: 'unknown' // We can't directly check GitHub Actions status
      });
    } catch (error) {
      console.error('Error fetching cleanup status:', error);
      toast.error('Failed to fetch cleanup status');
    } finally {
      setLoading(false);
    }
  };

  const runManualCleanup = async () => {
    setManualCleanupRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-cleanup', {
        body: {
          trigger: 'manual_emergency',
          correlationId: crypto.randomUUID(),
          cleanupType: 'comprehensive'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Manual cleanup completed: ${data.results?.total_processed || 0} bookings processed`);
        await fetchStatus();
      } else {
        throw new Error(data?.error || 'Cleanup failed');
      }
    } catch (error) {
      console.error('Manual cleanup error:', error);
      toast.error('Manual cleanup failed: ' + (error as Error).message);
    } finally {
      setManualCleanupRunning(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getSystemStatus = () => {
    if (status.stuck_bookings > 0) return { status: 'critical', color: 'destructive' as const };
    if (!status.automated_active) return { status: 'warning', color: 'secondary' as const };
    return { status: 'healthy', color: 'default' as const };
  };

  const systemStatus = getSystemStatus();
  const lastCleanupTime = status.last_cleanup ? 
    new Date(status.last_cleanup).toLocaleString() : 'Never';

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading cleanup status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Emergency Cleanup System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {status.stuck_bookings}
              </div>
              <div className="text-sm text-muted-foreground">Stuck Bookings</div>
            </div>
            <div className="text-center">
              <Badge variant={status.automated_active ? 'default' : 'destructive'}>
                {status.automated_active ? 'Active' : 'Inactive'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Automated Cleanup</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {status.critical_alerts}
              </div>
              <div className="text-sm text-muted-foreground">Critical Alerts</div>
            </div>
            <div className="text-center">
              <Badge variant={systemStatus.color}>
                {systemStatus.status.toUpperCase()}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">System Health</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={runManualCleanup}
              disabled={manualCleanupRunning}
              variant={status.stuck_bookings > 0 ? 'destructive' : 'default'}
              className="flex-1"
            >
              {manualCleanupRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Running Cleanup...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Manual Cleanup ({status.stuck_bookings} bookings)
                </>
              )}
            </Button>
            
            <Button
              onClick={fetchStatus}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last cleanup: {lastCleanupTime}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {status.stuck_bookings > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">
                CRITICAL: {status.stuck_bookings} stuck bookings detected!
              </span>
            </div>
            <p className="text-sm mt-2">
              The system has detected bookings that have been pending for more than 2 minutes. 
              Run manual cleanup immediately to resolve these issues.
            </p>
          </CardContent>
        </Card>
      )}

      {!status.automated_active && (
        <Card className="border-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">
                WARNING: Automated cleanup appears inactive
              </span>
            </div>
            <p className="text-sm mt-2">
              No cleanup has run in the last 5 minutes. Check GitHub Actions status and 
              consider running manual cleanup.
            </p>
          </CardContent>
        </Card>
      )}

      {status.stuck_bookings === 0 && status.automated_active && (
        <Card className="border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                System Operating Normally
              </span>
            </div>
            <p className="text-sm mt-2">
              No stuck bookings detected and automated cleanup is running successfully.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}