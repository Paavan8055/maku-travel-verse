import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Users, 
  Target,
  BarChart3,
  Activity
} from 'lucide-react';

interface BusinessMetrics {
  revenueAtRisk: number;
  conversionRate: number;
  avgBookingValue: number;
  providerPerformance: Record<string, { success: number; total: number; avgResponse: number }>;
  bookingsByType: Record<string, number>;
  customerImpact: {
    vipAffected: number;
    totalAffected: number;
    highValueBookings: number;
  };
  performanceMetrics: {
    successRate: number;
    avgProcessingTime: number;
    peakHours: string[];
  };
}

export const BusinessIntelligenceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low' }>>([]);

  useEffect(() => {
    fetchBusinessMetrics();
    const interval = setInterval(fetchBusinessMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBusinessMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch correlation data with business context
      const { data: correlations, error } = await supabase
        .from('correlation_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Process business metrics
      const processedMetrics = await processBusinessIntelligence(correlations || []);
      setMetrics(processedMetrics);
      
      // Generate alerts
      const generatedAlerts = generateBusinessAlerts(processedMetrics);
      setAlerts(generatedAlerts);
      
    } catch (error) {
      console.error('Failed to fetch business metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processBusinessIntelligence = async (correlations: any[]): Promise<BusinessMetrics> => {
    const last24Hours = correlations.filter(c => 
      new Date(c.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const failedBookings = last24Hours.filter(c => 
      c.status === 'failed' && c.request_type.includes('booking')
    );

    const completedBookings = last24Hours.filter(c => 
      c.status === 'completed' && c.request_type.includes('booking')
    );

    // Calculate revenue at risk
    const revenueAtRisk = failedBookings.reduce((sum, booking) => {
      const amount = booking.request_data?.amount || booking.response_data?.amount || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);

    // Calculate conversion rate
    const totalBookingAttempts = last24Hours.filter(c => c.request_type.includes('booking')).length;
    const conversionRate = totalBookingAttempts > 0 ? (completedBookings.length / totalBookingAttempts) * 100 : 0;

    // Calculate average booking value
    const avgBookingValue = completedBookings.length > 0 
      ? completedBookings.reduce((sum, booking) => {
          const amount = booking.request_data?.amount || booking.response_data?.amount || 0;
          return sum + (typeof amount === 'number' ? amount : 0);
        }, 0) / completedBookings.length
      : 0;

    // Provider performance analysis
    const providerPerformance: Record<string, { success: number; total: number; avgResponse: number }> = {};
    
    last24Hours.forEach(c => {
      const provider = c.request_data?.service_name || c.request_data?.provider || 'unknown';
      if (!providerPerformance[provider]) {
        providerPerformance[provider] = { success: 0, total: 0, avgResponse: 0 };
      }
      providerPerformance[provider].total++;
      if (c.status === 'completed') {
        providerPerformance[provider].success++;
      }
      if (c.duration_ms) {
        providerPerformance[provider].avgResponse += c.duration_ms;
      }
    });

    // Calculate average response times
    Object.keys(providerPerformance).forEach(provider => {
      const perf = providerPerformance[provider];
      perf.avgResponse = perf.total > 0 ? perf.avgResponse / perf.total : 0;
    });

    // Bookings by type
    const bookingsByType: Record<string, number> = {};
    completedBookings.forEach(booking => {
      const type = booking.request_data?.booking_type || 
                  booking.request_data?.type || 
                  booking.request_type.replace('_booking', '');
      bookingsByType[type] = (bookingsByType[type] || 0) + 1;
    });

    // Customer impact analysis
    const vipCustomers = last24Hours.filter(c => 
      c.request_data?.customer_tier === 'vip' || 
      c.request_data?.customer_type === 'premium'
    );
    
    const highValueBookings = last24Hours.filter(c => {
      const amount = c.request_data?.amount || c.response_data?.amount || 0;
      return amount > 1000; // High value threshold
    });

    return {
      revenueAtRisk,
      conversionRate,
      avgBookingValue,
      providerPerformance,
      bookingsByType,
      customerImpact: {
        vipAffected: vipCustomers.filter(c => c.status === 'failed').length,
        totalAffected: failedBookings.length,
        highValueBookings: highValueBookings.filter(c => c.status === 'failed').length
      },
      performanceMetrics: {
        successRate: conversionRate,
        avgProcessingTime: last24Hours.reduce((sum, c) => sum + (c.duration_ms || 0), 0) / last24Hours.length,
        peakHours: calculatePeakHours(last24Hours)
      }
    };
  };

  const calculatePeakHours = (correlations: any[]): string[] => {
    const hourCounts: Record<string, number> = {};
    correlations.forEach(c => {
      const hour = new Date(c.created_at).getHours();
      const hourStr = `${hour}:00`;
      hourCounts[hourStr] = (hourCounts[hourStr] || 0) + 1;
    });
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);
  };

  const generateBusinessAlerts = (metrics: BusinessMetrics) => {
    const alerts = [];
    
    if (metrics.revenueAtRisk > 10000) {
      alerts.push({
        type: 'revenue',
        message: `High revenue at risk: $${metrics.revenueAtRisk.toLocaleString()}`,
        severity: 'high' as const
      });
    }
    
    if (metrics.conversionRate < 85) {
      alerts.push({
        type: 'conversion',
        message: `Low conversion rate: ${metrics.conversionRate.toFixed(1)}%`,
        severity: 'medium' as const
      });
    }
    
    if (metrics.customerImpact.vipAffected > 0) {
      alerts.push({
        type: 'vip',
        message: `${metrics.customerImpact.vipAffected} VIP customers affected`,
        severity: 'high' as const
      });
    }

    Object.entries(metrics.providerPerformance).forEach(([provider, perf]) => {
      const successRate = perf.total > 0 ? (perf.success / perf.total) * 100 : 0;
      if (successRate < 90 && perf.total > 10) {
        alerts.push({
          type: 'provider',
          message: `${provider} performance degraded: ${successRate.toFixed(1)}% success rate`,
          severity: 'medium' as const
        });
      }
    });
    
    return alerts;
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading business intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} className={alert.severity === 'high' ? 'border-destructive' : 'border-warning'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue at Risk</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.revenueAtRisk.toLocaleString()}</div>
            <Badge variant={metrics.revenueAtRisk > 10000 ? 'destructive' : 'secondary'} className="mt-1">
              Last 24h
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <Progress value={metrics.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.avgBookingValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per successful booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Impact</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customerImpact.totalAffected}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.customerImpact.vipAffected} VIP affected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Provider Performance</TabsTrigger>
          <TabsTrigger value="bookings">Booking Analysis</TabsTrigger>
          <TabsTrigger value="operational">Operational Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.providerPerformance).map(([provider, perf]) => {
                  const successRate = perf.total > 0 ? (perf.success / perf.total) * 100 : 0;
                  return (
                    <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{provider}</h4>
                        <p className="text-sm text-muted-foreground">
                          {perf.success}/{perf.total} successful • Avg: {perf.avgResponse.toFixed(0)}ms
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{successRate.toFixed(1)}%</div>
                        <Badge variant={successRate > 95 ? 'default' : successRate > 85 ? 'secondary' : 'destructive'}>
                          {successRate > 95 ? 'Excellent' : successRate > 85 ? 'Good' : 'Poor'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.bookingsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(count / Math.max(...Object.values(metrics.bookingsByType))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Success Rate</span>
                  <span className="font-bold">{metrics.performanceMetrics.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Processing Time</span>
                  <span className="font-bold">{metrics.performanceMetrics.avgProcessingTime.toFixed(0)}ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.performanceMetrics.peakHours.map((hour, index) => (
                    <div key={hour} className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span>{hour}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};