import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  RefreshCw,
  Server
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logger from '@/utils/logger';

interface HealthMetric {
  provider: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'outage';
  responseTime: number;
  lastChecked: string;
  errorRate: number;
}

interface BookingMetric {
  date: string;
  searchCount: number;
  bookingCount: number;
  cancelCount: number;
  totalRevenue: number;
  averageResponseTime: number;
  successRate: number;
}

export const HotelBedsMonitoringDashboard = () => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [bookingMetrics, setBookingMetrics] = useState<BookingMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('hotelbeds-monitoring', {
        body: { action: 'getHealth' }
      });

      if (error) throw error;

      if (data?.success && data.metrics) {
        setHealthMetrics(data.metrics);
      }
    } catch (error) {
      logger.error('Failed to fetch health metrics:', error);
      toast.error('Failed to load health metrics');
    }
  };

  const fetchBookingMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('hotelbeds-monitoring', {
        body: { action: 'getAnalytics', timeRange: '7d' }
      });

      if (error) throw error;

      if (data?.success && data.analytics) {
        setBookingMetrics(data.analytics);
      }
    } catch (error) {
      logger.error('Failed to fetch booking metrics:', error);
      toast.error('Failed to load booking analytics');
    }
  };

  const fetchAllMetrics = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchHealthMetrics(), fetchBookingMetrics()]);
      setLastUpdated(new Date());
    } catch (error) {
      logger.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'outage': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'outage': return <Server className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatResponseTime = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const calculateAverageMetric = (metrics: BookingMetric[], field: keyof BookingMetric) => {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => {
      const value = metric[field];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    return Math.round(sum / metrics.length);
  };

  const overallSuccessRate = calculateAverageMetric(bookingMetrics, 'successRate');
  const averageResponseTime = calculateAverageMetric(bookingMetrics, 'averageResponseTime');
  const totalRevenue = bookingMetrics.reduce((acc, metric) => acc + metric.totalRevenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">HotelBeds Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time health and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Health</p>
                <p className="text-2xl font-bold">
                  {healthMetrics.length > 0 
                    ? Math.round((healthMetrics.filter(m => m.status === 'healthy').length / healthMetrics.length) * 100)
                    : 0}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{overallSuccessRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{formatResponseTime(averageResponseTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">7d Revenue</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-AU', {
                    style: 'currency',
                    currency: 'AUD',
                    minimumFractionDigits: 0
                  }).format(totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Endpoint Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthMetrics.length > 0 ? (
            <div className="space-y-3">
              {healthMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <p className="font-medium">{metric.endpoint}</p>
                      <p className="text-sm text-muted-foreground">{metric.provider}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={metric.status === 'healthy' ? 'default' : 'destructive'}
                      className={getStatusColor(metric.status)}
                    >
                      {metric.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatResponseTime(metric.responseTime)} • {metric.errorRate.toFixed(1)}% errors
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? 'Loading health metrics...' : 'No health data available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Booking Analytics (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingMetrics.length > 0 ? (
            <div className="space-y-4">
              {bookingMetrics.map((metric, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{metric.date}</h3>
                    <Badge variant="outline">
                      {metric.successRate.toFixed(1)}% success
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Searches</p>
                      <p className="font-medium">{metric.searchCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bookings</p>
                      <p className="font-medium">{metric.bookingCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('en-AU', {
                          style: 'currency',
                          currency: 'AUD',
                          minimumFractionDigits: 0
                        }).format(metric.totalRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Response</p>
                      <p className="font-medium">{formatResponseTime(metric.averageResponseTime)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={metric.successRate} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? 'Loading booking analytics...' : 'No booking data available'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};