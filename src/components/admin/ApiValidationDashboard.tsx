import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ServiceStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'outage';
  response_time: number;
  error?: string;
  details?: any;
}

interface HealthReport {
  overall_status: 'healthy' | 'degraded' | 'outage';
  timestamp: string;
  services: ServiceStatus[];
  api_endpoints: ServiceStatus[];
  booking_flow_status: 'operational' | 'impaired' | 'down';
}

interface BookingFlowTest {
  test_name: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  details: any;
  error?: string;
}

interface BookingFlowReport {
  overall_status: 'operational' | 'impaired' | 'down';
  timestamp: string;
  tests: BookingFlowTest[];
  success_rate: number;
}

const ApiValidationDashboard: React.FC = () => {
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [bookingReport, setBookingReport] = useState<BookingFlowReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
      case 'warning':
      case 'impaired':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'outage':
      case 'failed':
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
      case 'operational':
        return 'secondary' as const;
      case 'degraded':
      case 'warning':
      case 'impaired':
        return 'outline' as const;
      case 'outage':
      case 'failed':
      case 'down':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('health-check-comprehensive');
      
      if (error) throw error;
      
      setHealthReport(data);
      toast.success('Health check completed');
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Health check failed: ' + error.message);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const runBookingFlowTest = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-booking-flow');
      
      if (error) throw error;
      
      setBookingReport(data);
      toast.success('Booking flow test completed');
    } catch (error) {
      console.error('Booking flow test failed:', error);
      toast.error('Booking flow test failed: ' + error.message);
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  const runAllTests = async () => {
    await Promise.all([runHealthCheck(), runBookingFlowTest()]);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Validation Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor system health and validate booking flows across all providers
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runHealthCheck} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Health Check
          </Button>
          <Button onClick={runBookingFlowTest} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Booking Test
          </Button>
          <Button onClick={runAllTests} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Run All Tests
          </Button>
        </div>
      </div>

      {lastRefresh && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastRefresh.toLocaleString()}
        </div>
      )}

      {/* Overall Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {healthReport && getStatusIcon(healthReport.overall_status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthReport ? healthReport.overall_status.toUpperCase() : 'CHECKING...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall system status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Flow</CardTitle>
            {bookingReport && getStatusIcon(bookingReport.overall_status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookingReport ? bookingReport.overall_status.toUpperCase() : 'TESTING...'}
            </div>
            <p className="text-xs text-muted-foreground">
              End-to-end booking capability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookingReport ? `${Math.round(bookingReport.success_rate)}%` : '--'}
            </div>
            <Progress 
              value={bookingReport?.success_rate || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Service Health Details */}
      {healthReport && (
        <Card>
          <CardHeader>
            <CardTitle>Service Health Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-2">Travel Providers</h4>
                <div className="grid gap-2">
                  {healthReport.services.map((service) => (
                    <div key={service.service} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <div className="font-medium">{service.service}</div>
                          {service.error && (
                            <div className="text-sm text-red-600">{service.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(service.status)}>
                          {service.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {service.response_time}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">API Endpoints</h4>
                <div className="grid gap-2">
                  {healthReport.api_endpoints.map((endpoint) => (
                    <div key={endpoint.service} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(endpoint.status)}
                        <div>
                          <div className="font-medium">{endpoint.service}</div>
                          {endpoint.error && (
                            <div className="text-sm text-red-600">{endpoint.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {endpoint.response_time}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Flow Test Results */}
      {bookingReport && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Flow Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {bookingReport.tests.map((test) => (
                <div key={test.test_name} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.test_name}</div>
                      {test.error && (
                        <div className="text-sm text-red-600">{test.error}</div>
                      )}
                      {test.details && (
                        <div className="text-sm text-muted-foreground">
                          {JSON.stringify(test.details, null, 1).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(test.status)}>
                      {test.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {test.duration}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApiValidationDashboard;