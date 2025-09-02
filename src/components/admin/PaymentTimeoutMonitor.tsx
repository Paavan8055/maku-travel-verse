import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, AlertTriangle, RefreshCw, TrendingUp, Activity } from 'lucide-react';
import logger from '@/utils/logger';

interface PaymentMetrics {
  active_sessions: number;
  expiring_soon: number;
  expired_today: number;
  average_completion_time: number;
  timeout_rate: number;
  recent_timeouts: Array<{
    booking_reference: string;
    created_at: string;
    amount: number;
    currency: string;
  }>;
}

export const PaymentTimeoutMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Get active payment sessions (pending bookings < 10 minutes old)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const { data: activeSessions } = await supabase
        .from('bookings')
        .select('id, booking_reference, total_amount, currency, created_at')
        .eq('status', 'pending')
        .gte('created_at', tenMinutesAgo.toISOString());

      // Get sessions expiring in next 2 minutes
      const eightMinutesAgo = new Date(Date.now() - 8 * 60 * 1000);
      const { data: expiringSoon } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'pending')
        .gte('created_at', eightMinutesAgo.toISOString())
        .lt('created_at', tenMinutesAgo.toISOString());

      // Get expired sessions today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: expiredToday } = await supabase
        .from('bookings')
        .select('id, booking_reference, total_amount, currency, created_at')
        .eq('status', 'expired')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate timeout metrics
      const totalSessions = (activeSessions?.length || 0) + (expiredToday?.length || 0);
      const timeoutRate = totalSessions > 0 ? (expiredToday?.length || 0) / totalSessions * 100 : 0;

      // Calculate average completion time from recent confirmed bookings
      const { data: completedBookings } = await supabase
        .from('bookings')
        .select('created_at, updated_at')
        .eq('status', 'confirmed')
        .gte('created_at', todayStart.toISOString())
        .limit(50);

      let avgCompletionTime = 0;
      if (completedBookings && completedBookings.length > 0) {
        const totalTime = completedBookings.reduce((sum, booking) => {
          const created = new Date(booking.created_at);
          const updated = new Date(booking.updated_at);
          return sum + (updated.getTime() - created.getTime());
        }, 0);
        avgCompletionTime = Math.round(totalTime / completedBookings.length / 1000 / 60); // minutes
      }

      setMetrics({
        active_sessions: activeSessions?.length || 0,
        expiring_soon: expiringSoon?.length || 0,
        expired_today: expiredToday?.length || 0,
        average_completion_time: avgCompletionTime,
        timeout_rate: Math.round(timeoutRate * 10) / 10,
        recent_timeouts: expiredToday?.slice(0, 3).map(booking => ({
          booking_reference: booking.booking_reference,
          created_at: booking.created_at,
          amount: booking.total_amount,
          currency: booking.currency
        })) || []
      });

      setLastRefresh(new Date());
      
    } catch (error) {
      logger.error('Failed to fetch payment metrics:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to fetch payment timeout metrics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCleanup = async () => {
    try {
      toast({
        title: "Cleanup Triggered",
        description: "Running stuck booking cleanup...",
      });

      await supabase.functions.invoke('fix-stuck-bookings', {
        body: { automated: true, timeout_minutes: 2 }
      });

      toast({
        title: "Cleanup Complete",
        description: "Stuck booking cleanup completed successfully",
      });

      // Refresh metrics after cleanup
      setTimeout(fetchMetrics, 2000);
    } catch (error) {
      logger.error('Cleanup trigger failed:', error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to trigger stuck booking cleanup",
        variant: "destructive"
      });
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payment Timeout Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Payment Timeout Monitor
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Updated: {lastRefresh.toLocaleTimeString()}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{metrics?.active_sessions || 0}</div>
            <div className="text-sm text-muted-foreground">Active Sessions</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${(metrics?.expiring_soon || 0) > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {metrics?.expiring_soon || 0}
            </div>
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{metrics?.expired_today || 0}</div>
            <div className="text-sm text-muted-foreground">Expired Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{metrics?.timeout_rate || 0}%</div>
            <div className="text-sm text-muted-foreground">Timeout Rate</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Avg. Completion Time</span>
          </div>
          <Badge variant="outline">
            {metrics?.average_completion_time || 0} minutes
          </Badge>
        </div>

        {/* Recent Timeouts */}
        {metrics?.recent_timeouts && metrics.recent_timeouts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h4 className="text-sm font-medium">Recent Timeouts</h4>
            </div>
            <div className="space-y-2">
              {metrics.recent_timeouts.map((timeout, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded">
                  <div>
                    <div className="font-mono text-sm">{timeout.booking_reference}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(timeout.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {timeout.amount} {timeout.currency}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={triggerCleanup}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Run Manual Cleanup
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('/admin/operations/bookings', '_blank')}
          >
            View All Bookings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};