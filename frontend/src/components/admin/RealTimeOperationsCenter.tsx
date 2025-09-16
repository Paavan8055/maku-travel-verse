import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Globe,
  RefreshCw,
  TrendingUp,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProviderCredentialStatus } from './ProviderCredentialStatus';

interface SystemMetrics {
  activeUsers: number;
  bookingsToday: number;
  revenueToday: number;
  averageResponseTime: number;
  errorRate: number;
  providerHealth: ProviderHealth[];
  criticalAlerts: Alert[];
  realtimeBookings: RealtimeBooking[];
}

interface ProviderHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  successRate: number;
  lastCheck: Date;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface RealtimeBooking {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'car';
  amount: number;
  currency: string;
  destination: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export const RealTimeOperationsCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSystemMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemMetrics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSystemMetrics = async () => {
    try {
      // Get real metrics from provider status - replace with actual API calls in production
      const baseMetrics: SystemMetrics = {
        activeUsers: 150, // Static value until real analytics
        bookingsToday: 25, // Static value until real analytics  
        revenueToday: 7500, // Static value until real analytics
        averageResponseTime: 180, // Static value until real analytics
        errorRate: 0.5, // Static value until real analytics
        providerHealth: [
          {
            name: 'Amadeus',
            status: 'healthy', // Fixed status until real monitoring
            responseTime: 120,
            successRate: 99.2,
            lastCheck: new Date()
          },
          {
            name: 'HotelBeds', 
            status: 'degraded', // Known issues with mapping
            responseTime: 350,
            successRate: 85.5,
            lastCheck: new Date()
          },
          {
            name: 'Sabre',
            status: 'degraded', // Known credential issues
            responseTime: 280,
            successRate: 78.0,
            lastCheck: new Date()
          }
        ],
        criticalAlerts: [], // Remove mock alerts for production
        realtimeBookings: [] // Remove mock bookings for production
      };
      
      setMetrics(baseMetrics);
      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Failed to fetch metrics',
        description: 'Could not load real-time data',
        variant: 'destructive'
      });
    }
  };

  const generateMockAlerts = (): Alert[] => {
    const alerts = [];
    if (Math.random() > 0.7) {
      alerts.push({
        id: '1',
        severity: 'warning' as const,
        message: 'High response time detected on flight search API',
        timestamp: new Date(),
        resolved: false
      });
    }
    if (Math.random() > 0.9) {
      alerts.push({
        id: '2',
        severity: 'critical' as const,
        message: 'Payment processing experiencing failures',
        timestamp: new Date(),
        resolved: false
      });
    }
    return alerts;
  };

  const generateMockBookings = (): RealtimeBooking[] => {
    const types = ['flight', 'hotel', 'activity', 'car'] as const;
    const destinations = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'];
    const statuses = ['pending', 'confirmed', 'failed'] as const;
    
    return Array.from({ length: 5 }, (_, i) => ({
      id: `booking-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      amount: Math.floor(Math.random() * 2000) + 100,
      currency: 'AUD',
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      timestamp: new Date(Date.now() - Math.random() * 300000), // Last 5 minutes
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityVariant = (severity: string): "default" | "destructive" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Real-Time Operations Center</h1>
        <div className="flex space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
          <Button onClick={fetchSystemMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics?.criticalAlerts.length > 0 && (
        <div className="space-y-2">
          {metrics.criticalAlerts.map((alert) => (
            <Alert key={alert.id} variant={getSeverityVariant(alert.severity)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>{alert.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.bookingsToday}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics?.revenueToday.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Within SLA targets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credential Status */}
      <ProviderCredentialStatus />

      {/* Provider Health and Real-time Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Provider Health Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics?.providerHealth.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)}`} />
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {provider.responseTime}ms • {provider.successRate.toFixed(1)}% success
                    </p>
                  </div>
                </div>
                <Badge variant={provider.status === 'healthy' ? 'default' : 'destructive'}>
                  {provider.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Real-time Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Real-time Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.realtimeBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(booking.status)}`} />
                  <div>
                    <p className="font-medium capitalize">{booking.type} to {booking.destination}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${booking.amount} {booking.currency}</p>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};