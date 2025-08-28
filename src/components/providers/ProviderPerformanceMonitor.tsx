import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertTriangle, CheckCircle, Clock, DollarSign, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderMetrics {
  providerId: string;
  providerName: string;
  healthScore: number;
  successRate: number;
  averageResponseTime: number;
  quotaUsage: number;
  costPerRequest: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  lastUpdated: string;
}

export const ProviderPerformanceMonitor: React.FC = () => {
  const [providers, setProviders] = useState<ProviderMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchProviderMetrics();
    const interval = setInterval(fetchProviderMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchProviderMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-health-monitor');
      
      if (error) throw error;
      
      if (data?.providers) {
        setProviders(data.providers);
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch provider metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadgeVariant = (healthScore: number) => {
    if (healthScore >= 80) return 'default';
    if (healthScore >= 60) return 'secondary';
    return 'destructive';
  };

  const getCircuitBreakerIcon = (state: string) => {
    switch (state) {
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'half-open':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'open':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Provider Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading provider metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Provider Performance Monitor
        </CardTitle>
        <CardDescription>
          Real-time monitoring of provider health, performance, and circuit breaker status
          <span className="block text-xs text-muted-foreground mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.providerId} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {provider.providerName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getCircuitBreakerIcon(provider.circuitBreakerState)}
                    <Badge variant={getHealthBadgeVariant(provider.healthScore)}>
                      {provider.healthScore}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Health Score */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Health Score</span>
                    <span className="font-medium">{provider.healthScore}%</span>
                  </div>
                  <Progress value={provider.healthScore} className="h-1.5" />
                </div>

                {/* Success Rate */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Success Rate</span>
                    <span className="font-medium">{provider.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={provider.successRate} className="h-1.5" />
                </div>

                {/* Quota Usage */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Quota Usage</span>
                    <span className="font-medium">{provider.quotaUsage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={provider.quotaUsage} 
                    className="h-1.5"
                  />
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{provider.averageResponseTime}ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>${provider.costPerRequest.toFixed(3)}</span>
                  </div>
                </div>

                {/* Circuit Breaker Status */}
                <div className="flex items-center justify-between text-xs">
                  <span>Circuit Breaker</span>
                  <div className="flex items-center gap-1">
                    {getCircuitBreakerIcon(provider.circuitBreakerState)}
                    <span className="capitalize">{provider.circuitBreakerState}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {providers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No provider metrics available
          </div>
        )}
      </CardContent>
    </Card>
  );
};