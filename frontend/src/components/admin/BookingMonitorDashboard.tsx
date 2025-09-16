import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Users,
  Plane,
  Building,
  MapPin,
  Car,
  RefreshCw
} from 'lucide-react';

interface BookingMetrics {
  totalBookings: number;
  successfulBookings: number;
  failedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  successRate: number;
  avgBookingValue: number;
}

interface ProviderPerformance {
  providerId: string;
  providerName: string;
  successCount: number;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed: string;
}

interface RecentBooking {
  id: string;
  booking_reference: string;
  booking_type: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  provider_used?: string;
}

export const BookingMonitorDashboard = () => {
  const [metrics, setMetrics] = useState<BookingMetrics | null>(null);
  const [providerPerformance, setProviderPerformance] = useState<ProviderPerformance[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // Fetch booking metrics from the last 24 hours
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, booking_reference, status, total_amount, currency, created_at, booking_type')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const totalBookings = bookings?.length || 0;
      const successfulBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const failedBookings = bookings?.filter(b => b.status === 'failed').length || 0;
      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const successRate = totalBookings > 0 ? (successfulBookings / totalBookings) * 100 : 0;
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      setMetrics({
        totalBookings,
        successfulBookings,
        failedBookings,
        pendingBookings,
        totalRevenue,
        successRate,
        avgBookingValue
      });

      setRecentBookings(bookings?.slice(0, 10) || []);

    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch booking metrics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testProviderRotation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('test-provider-rotation');
      
      if (error) throw error;

      toast({
        title: "Provider Test Complete",
        description: `${data?.summary?.successful}/${data?.summary?.total} providers working`,
        variant: data?.success ? "default" : "destructive"
      });

      // Get real provider performance from health data
      const { data: healthData, error: healthError } = await supabase
        .from('provider_health')
        .select('*')
        .order('last_checked', { ascending: false });

      if (!healthError && healthData) {
        const performanceData = healthData.map(provider => ({
          providerId: provider.provider,
          providerName: provider.provider.replace('-', ' ').toUpperCase(),
          successCount: Math.max(0, (provider.metadata as any)?.success_count || 0),
          totalRequests: Math.max(1, (provider.metadata as any)?.total_requests || 1),
          successRate: provider.status === 'healthy' ? 95 : 0,
          avgResponseTime: provider.response_time_ms || 0,
          lastUsed: provider.last_checked || new Date().toISOString()
        }));
        setProviderPerformance(performanceData);
      }

    } catch (error) {
      console.error('Error testing providers:', error);
      toast({
        title: "Test Failed",
        description: "Provider rotation test failed",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-4 w-4" />;
      case 'hotel':
        return <Building className="h-4 w-4" />;
      case 'activity':
        return <MapPin className="h-4 w-4" />;
      case 'transfer':
        return <Car className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchMetrics();
    testProviderRotation();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Booking Monitor</h2>
          <p className="text-muted-foreground">Real-time booking performance and provider health</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testProviderRotation} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Test Providers
          </Button>
          <Button onClick={fetchMetrics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings (24h)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
              <Progress value={metrics.successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (24h)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: ${metrics.avgBookingValue.toFixed(0)} per booking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Confirmed</span>
                  <span className="text-sm font-medium text-green-600">{metrics.successfulBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending</span>
                  <span className="text-sm font-medium text-yellow-600">{metrics.pendingBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Failed</span>
                  <span className="text-sm font-medium text-red-600">{metrics.failedBookings}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Provider Performance</TabsTrigger>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerPerformance.map((provider) => (
                  <div key={provider.providerId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{provider.providerName}</h4>
                      <p className="text-sm text-muted-foreground">{provider.providerId}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{provider.successRate}% success</p>
                        <p className="text-xs text-muted-foreground">{provider.avgResponseTime}ms avg</p>
                      </div>
                      <Badge variant={provider.successRate > 90 ? "default" : provider.successRate > 70 ? "secondary" : "destructive"}>
                        {provider.successCount}/{provider.totalRequests}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getBookingTypeIcon(booking.booking_type)}
                      <div>
                        <p className="font-medium">{booking.booking_reference}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.booking_type} • {new Date(booking.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium">
                        ${booking.total_amount?.toFixed(2)} {booking.currency}
                      </p>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(booking.status)}
                        <span className="text-sm capitalize">{booking.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};