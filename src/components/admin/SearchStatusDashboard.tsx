import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plane, 
  Building, 
  MapPin,
  Wifi,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'outage';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export const SearchStatusDashboard: React.FC = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const checkServiceHealth = async () => {
    setLoading(true);
    const results: ServiceStatus[] = [];

    // Test each service
    const servicesToTest = [
      { 
        name: 'Flight Search', 
        function: 'amadeus-flight-search',
        testParams: { origin: 'LAX', destination: 'SYD', departureDate: '2025-08-24', passengers: 1 }
      },
      { 
        name: 'Hotel Search', 
        function: 'amadeus-hotel-search',
        testParams: { cityIata: 'SYD', checkIn: '2025-08-24', checkOut: '2025-08-25', adults: 1 }
      },
      { 
        name: 'Activity Search', 
        function: 'amadeus-activity-search',
        testParams: { cityIata: 'SYD', from: '2025-08-24', to: '2025-08-25' }
      },
      {
        name: 'Provider Rotation',
        function: 'provider-rotation',
        testParams: { searchType: 'flight', params: { origin: 'LAX', destination: 'SYD', departureDate: '2025-08-24', passengers: 1 } }
      }
    ];

    for (const service of servicesToTest) {
      try {
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke(service.function, {
          body: service.testParams
        });
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
          results.push({
            name: service.name,
            status: 'outage',
            lastCheck: new Date().toISOString(),
            error: error.message,
            responseTime
          });
        } else if (data) {
          // Check if we got expected data structure
          const hasValidData = data.success !== false && (
            data.flights?.length >= 0 || 
            data.hotels?.length >= 0 || 
            data.activities?.length >= 0 ||
            data.data?.flights?.length >= 0 ||
            data.data?.hotels?.length >= 0 ||
            data.data?.activities?.length >= 0
          );
          
          results.push({
            name: service.name,
            status: hasValidData ? 'healthy' : 'degraded',
            lastCheck: new Date().toISOString(),
            responseTime
          });
        } else {
          results.push({
            name: service.name,
            status: 'degraded',
            lastCheck: new Date().toISOString(),
            error: 'No data returned',
            responseTime
          });
        }
      } catch (error) {
        results.push({
          name: service.name,
          status: 'outage',
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setServices(results);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkServiceHealth();
    
    // Set up periodic health checks every 5 minutes
    const interval = setInterval(checkServiceHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-500">Degraded</Badge>;
      case 'outage':
        return <Badge variant="destructive">Outage</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('Flight')) return <Plane className="h-4 w-4" />;
    if (serviceName.includes('Hotel')) return <Building className="h-4 w-4" />;
    if (serviceName.includes('Activity')) return <MapPin className="h-4 w-4" />;
    if (serviceName.includes('Provider')) return <Wifi className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const overallStatus = services.every(s => s.status === 'healthy') 
    ? 'healthy' 
    : services.some(s => s.status === 'outage') 
    ? 'outage' 
    : 'degraded';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              MAKU.Travel Search Services
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkServiceHealth}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {services.filter(s => s.status === 'healthy').length} / {services.length}
              </p>
              <p className="text-muted-foreground">Services Operational</p>
            </div>
            {getStatusBadge(overallStatus)}
          </div>
          {lastUpdate && (
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Individual Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getServiceIcon(service.name)}
                  <span className="font-medium">{service.name}</span>
                </div>
                {getStatusIcon(service.status)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(service.status)}
                </div>
                
                {service.responseTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className="text-sm font-medium">{service.responseTime}ms</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Check</span>
                  <span className="text-sm font-medium">
                    {new Date(service.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
                
                {service.error && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                    {service.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Completed Features
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ Flight Search Function</li>
                  <li>✅ Provider Rotation System</li>
                  <li>✅ Error Boundaries</li>
                  <li>✅ Input Validation</li>
                  <li>✅ Search Components</li>
                  <li>✅ Status Dashboard</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  In Progress
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>🔄 Flight Booking Flow</li>
                  <li>🔄 Hotel Search Enhancement</li>
                  <li>🔄 Activity Search Enhancement</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Next Steps
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>📋 Payment Integration</li>
                  <li>📋 Booking Management</li>
                  <li>📋 User Authentication</li>
                  <li>📋 Analytics Dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};