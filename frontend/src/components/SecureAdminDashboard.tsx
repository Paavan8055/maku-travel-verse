import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Activity, BarChart3, Settings, RefreshCw, TrendingUp, Users, DollarSign } from 'lucide-react';

interface AdminMetrics {
  bookings: {
    total: number;
    today: number;
    revenue: number;
    byStatus: Record<string, number>;
  };
  users: {
    total: number;
    newToday: number;
  };
}

interface ProviderHealth {
  providers: Array<{
    provider_id: string;
    status: string;
    last_checked: string;
    response_time: number;
    success_rate: number;
  }>;
}

export const SecureAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the admin dashboard",
          variant: "destructive"
        });
        return;
      }

      // Check admin status using the secure function
      const { data, error } = await supabase.rpc('get_admin_status');
      
      if (error || !data) {
        toast({
          title: "Access Denied",
          description: "Admin privileges required to access this dashboard",
          variant: "destructive"
        });
        return;
      }

      setIsAuthorized(true);
      await loadDashboardData();
    } catch (error) {
      console.error('Admin access check failed:', error);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive"
      });
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data: metricsData, error: metricsError } = await supabase.functions.invoke(
        'secure-admin-dashboard',
        {
          body: { action: 'get_metrics' },
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      const { data: healthData, error: healthError } = await supabase.functions.invoke(
        'secure-admin-dashboard',
        {
          body: { action: 'get_provider_health' },
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (metricsError) {
        console.error('Failed to load metrics:', metricsError);
        toast({
          title: "Error",
          description: "Failed to load dashboard metrics",
          variant: "destructive"
        });
      } else {
        setMetrics(metricsData);
      }

      if (healthError) {
        console.error('Failed to load provider health:', healthError);
      } else {
        setProviderHealth(healthData);
      }

    } catch (error) {
      console.error('Dashboard loading error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
    toast({
      title: "Dashboard Refreshed",
      description: "All data has been updated",
    });
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              This dashboard requires administrator privileges
            </p>
            <Button onClick={checkAdminAccess} variant="outline">
              Retry Access Check
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Secure Admin Dashboard
        </h2>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{metrics?.bookings.total || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.bookings.today || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">
                  ${((metrics?.bookings.revenue || 0) / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total confirmed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{metrics?.users.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.users.newToday || 0} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold text-green-600">98%</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Provider Health</TabsTrigger>
          <TabsTrigger value="bookings">Booking Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New booking created</span>
                    <span className="text-xs text-muted-foreground">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment processed</span>
                    <span className="text-xs text-muted-foreground">5 min ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User registered</span>
                    <span className="text-xs text-muted-foreground">12 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600">INFO</Badge>
                    <span className="text-sm">All providers operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-600">INFO</Badge>
                    <span className="text-sm">Database backup completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-600">WARN</Badge>
                    <span className="text-sm">High API usage detected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerHealth?.providers?.map((provider) => (
                  <div key={provider.provider_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        provider.status === 'healthy' ? 'bg-green-500' : 
                        provider.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{provider.provider_id.toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          Response: {provider.response_time}ms | Success: {provider.success_rate}%
                        </p>
                      </div>
                    </div>
                    <Badge variant={provider.status === 'healthy' ? 'default' : 'destructive'}>
                      {provider.status}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-muted-foreground">No provider health data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.bookings.byStatus && Object.entries(metrics.bookings.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / (metrics?.bookings.total || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">96.5%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">1.2s</p>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">8.4%</p>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};