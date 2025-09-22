import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, DollarSign, TrendingUp, Users, Activity } from 'lucide-react';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-states';
import logger from '@/utils/logger';
import { AdminAIAssistant } from '@/features/admin/components/AdminAIAssistant';
import { AdminProblemDetector } from '@/features/admin/components/AdminProblemDetector';
import { AdminDataProvider } from '@/components/admin/RealTimeAdminData';
import AgentMonitorDashboard from '@/features/admin/components/AgentMonitorDashboard';
import ApiValidationDashboard from '@/components/admin/ApiValidationDashboard';
import AgentSystemTests from '@/components/admin/AgentSystemTests';
import SmartDreamManagement from '@/components/admin/SmartDreamManagement';
import NFTAdminDashboard from '@/components/admin/NFTAdminDashboard';
import AdminSystemHealthPanel from '@/components/admin/AdminSystemHealthPanel';

interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'outage';
  last_checked: string;
  response_time_ms: number;
  error_message?: string;
}

interface BookingActivity {
  id: string;
  booking_reference: string;
  booking_type: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  customer_email?: string;
}

interface CriticalAlert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  booking_id?: string;
  created_at: string;
  resolved: boolean;
}

export default function AdminDashboard() {
  const { metrics, loading: metricsLoading, error: metricsError } = useAdminMetrics();
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingActivity[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        setLoading(true);

        // Fetch provider health
        const { data: healthData, error: healthError } = await supabase
          .from('api_health_logs')
          .select('*')
          .order('checked_at', { ascending: false })
          .limit(10);

        if (!healthError && healthData) {
          // Group by provider and get latest status
          const healthMap = new Map();
          healthData.forEach((log: any) => {
            if (!healthMap.has(log.provider)) {
              healthMap.set(log.provider, {
                provider: log.provider,
                status: log.status === 'healthy' ? 'healthy' : 
                        log.status === 'degraded' ? 'degraded' : 'outage',
                last_checked: log.checked_at,
                response_time_ms: log.response_time_ms || 0,
                error_message: log.error_message
              });
            }
          });
          setProviderHealth(Array.from(healthMap.values()));
        }

        // Fetch recent bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, booking_reference, booking_type, status, total_amount, currency, created_at, booking_data')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!bookingsError && bookingsData) {
          const formattedBookings = bookingsData.map((booking: any) => ({
            ...booking,
            customer_email: booking.booking_data?.customerInfo?.email
          }));
          setRecentBookings(formattedBookings);
        }

        // Fetch critical alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from('critical_alerts')
          .select('*')
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!alertsError && alertsData) {
          setCriticalAlerts(alertsData);
        }

      } catch (error) {
        logger.error('Admin dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealTimeData();

    // Set up real-time subscriptions
    const healthChannel = supabase
      .channel('admin-health')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'api_health_logs' },
        () => fetchRealTimeData()
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchRealTimeData()
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('admin-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'critical_alerts' },
        () => fetchRealTimeData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(healthChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'outage': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      healthy: 'default',
      degraded: 'secondary', 
      outage: 'destructive',
      pending: 'outline',
      confirmed: 'default',
      cancelled: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Data
        </Button>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AUD {metrics.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {providerHealth.every(p => p.status === 'healthy') ? '✅' : '⚠️'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts ({criticalAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <div className="font-medium">{alert.alert_type}</div>
                    <div className="text-sm text-muted-foreground">{alert.message}</div>
                  </div>
                  <Badge variant="destructive">{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="smart-dreams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smart-dreams">Smart Dreams</TabsTrigger>
          <TabsTrigger value="nft-airdrop">NFT & Airdrop</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="agent-monitor">Agent Monitor</TabsTrigger>
          <TabsTrigger value="system-tests">System Tests</TabsTrigger>
          <TabsTrigger value="api-validation">API Validation</TabsTrigger>
          <TabsTrigger value="providers">Provider Health</TabsTrigger>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="smart-dreams" className="space-y-4">
          <SmartDreamManagement />
        </TabsContent>

        <TabsContent value="nft-airdrop" className="space-y-4">
          <NFTAdminDashboard />
        </TabsContent>

        <TabsContent value="ai-assistant" className="space-y-4">
          <AdminDataProvider>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminAIAssistant />
              <AdminProblemDetector />
            </div>
          </AdminDataProvider>
        </TabsContent>

        <TabsContent value="agent-monitor" className="space-y-4">
          <AgentMonitorDashboard />
        </TabsContent>

        <TabsContent value="system-tests" className="space-y-4">
          <AgentSystemTests />
        </TabsContent>

        <TabsContent value="api-validation" className="space-y-4">
          <ApiValidationDashboard />
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerHealth.map((provider) => (
                  <div key={provider.provider} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(provider.status)}
                      <div>
                        <div className="font-medium capitalize">{provider.provider}</div>
                        <div className="text-sm text-muted-foreground">
                          Response: {provider.response_time_ms}ms
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(provider.status)}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(provider.last_checked).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {providerHealth.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No provider health data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Booking Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{booking.booking_reference}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.booking_type} • {booking.customer_email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {booking.currency} {booking.total_amount.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentBookings.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No recent bookings
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.recentBookings && (
                <div className="space-y-4">
                  <div className="text-sm">
                    <strong>Last Updated:</strong> {metrics.lastUpdated}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Booking Success Rate</div>
                      <div className="text-2xl font-bold">
                        {metrics.totalBookings > 0 
                          ? ((metrics.recentBookings.filter((b: any) => b.status === 'confirmed').length / metrics.totalBookings) * 100).toFixed(1)
                          : '0'
                        }%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Average Booking Value</div>
                      <div className="text-2xl font-bold">
                        AUD {metrics.totalBookings > 0 
                          ? (metrics.totalRevenue / metrics.totalBookings).toFixed(2)
                          : '0.00'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}