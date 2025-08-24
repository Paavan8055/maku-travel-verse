import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Database,
  CreditCard,
  Plane,
  Building,
  MapPin
} from 'lucide-react';

interface HealthStatus {
  overall_status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  providers: {
    [key: string]: {
      overall_status: string;
      [endpoint: string]: any;
    };
  };
}

interface ApiHealthRecord {
  id: string;
  provider: string;
  endpoint: string;
  status: string;
  response_time_ms: number;
  error_message: string | null;
  checked_at: string;
}

interface BookingStatusRecord {
  id: string;
  booking_id: string;
  previous_status: string;
  new_status: string;
  reason: string;
  changed_at: string;
  metadata: any;
}

export const ProductionDashboard = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [apiHealth, setApiHealth] = useState<ApiHealthRecord[]>([]);
  const [bookingHistory, setBookingHistory] = useState<BookingStatusRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'amadeus':
        return <Plane className="h-4 w-4" />;
      case 'hotelbeds':
        return <Building className="h-4 w-4" />;
      case 'stripe':
        return <CreditCard className="h-4 w-4" />;
      case 'supabase':
        return <Database className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const fetchHealthStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('production-monitoring', {
        body: { providers: ['amadeus', 'stripe', 'hotelbeds'] }
      });

      if (error) throw error;

      setHealthStatus(data.results);
      toast({
        title: "Health check completed",
        description: `System status: ${data.results.overall_status}`,
      });
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Health check failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiHealthHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('api_health_monitoring')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setApiHealth(data || []);
    } catch (error) {
      console.error('Failed to fetch API health history:', error);
    }
  };

  const fetchBookingStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_status_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBookingHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch booking status history:', error);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
    fetchApiHealthHistory();
    fetchBookingStatusHistory();

    // Set up real-time subscriptions
    const healthSubscription = supabase
      .channel('api-health-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'api_health_monitoring'
      }, () => {
        fetchApiHealthHistory();
      })
      .subscribe();

    const bookingSubscription = supabase
      .channel('booking-status-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_status_history'
      }, () => {
        fetchBookingStatusHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(healthSubscription);
      supabase.removeChannel(bookingSubscription);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system health, API status, and booking operations
          </p>
        </div>
        <Button onClick={fetchHealthStatus} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Overall System Status */}
      {healthStatus && (
        <Alert className={`${
          healthStatus.overall_status === 'healthy' ? 'border-green-200 bg-green-50' :
          healthStatus.overall_status === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center gap-2">
            {getStatusIcon(healthStatus.overall_status)}
            <AlertDescription className="flex-1">
              <strong>System Status: {healthStatus.overall_status.toUpperCase()}</strong>
              <span className="ml-2 text-sm text-muted-foreground">
                Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
              </span>
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api-health">API Health</TabsTrigger>
          <TabsTrigger value="bookings">Booking Status</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Provider Status Cards */}
          {healthStatus && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(healthStatus.providers).map(([provider, data]) => (
                <Card key={provider}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getProviderIcon(provider)}
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </CardTitle>
                    <Badge className={getStatusColor(data.overall_status)}>
                      {data.overall_status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(data).map(([endpoint, details]) => {
                        if (endpoint === 'overall_status' || typeof details !== 'object') return null;
                        const endpointData = details as any;
                        return (
                          <div key={endpoint} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{endpoint}</span>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(endpointData.status)}
                              {endpointData.responseTime && (
                                <span className="text-xs text-muted-foreground">
                                  {endpointData.responseTime}ms
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="api-health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Health History</CardTitle>
              <CardDescription>Recent API endpoint health checks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiHealth.map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(record.provider)}
                      <div>
                        <p className="font-medium">{record.provider} - {record.endpoint}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.checked_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {record.response_time_ms}ms
                      </span>
                      {record.error_message && (
                        <span className="text-sm text-red-500 max-w-xs truncate">
                          {record.error_message}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {apiHealth.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No API health records found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Status Changes</CardTitle>
              <CardDescription>Recent booking status transitions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookingHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">
                        Booking {record.metadata?.booking_reference || record.booking_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.changed_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{record.previous_status}</Badge>
                      <span>→</span>
                      <Badge className={
                        record.new_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        record.new_status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {record.new_status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {bookingHistory.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No booking status changes found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Processing</CardTitle>
              <CardDescription>Webhook event processing status and logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Webhook monitoring will be displayed here once webhook events are processed.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure Stripe webhooks to point to: /production-webhook-handler
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};