import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface ProviderStatus {
  id: string;
  name: string;
  type: 'hotel' | 'flight' | 'activity';
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  successRate: number;
  lastChecked: string;
}

interface CoverageMetrics {
  searchType: 'hotel' | 'flight' | 'activity';
  totalProviders: number;
  healthyProviders: number;
  degradedProviders: number;
  unhealthyProviders: number;
  overallCoverage: number;
  targetCoverage: 98;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export const ProviderCoverageValidator: React.FC = () => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [coverage, setCoverage] = useState<CoverageMetrics[]>([
    {
      searchType: 'hotel',
      totalProviders: 2,
      healthyProviders: 0,
      degradedProviders: 0,
      unhealthyProviders: 0,
      overallCoverage: 0,
      targetCoverage: 98,
      status: 'critical'
    },
    {
      searchType: 'flight',
      totalProviders: 2,
      healthyProviders: 0,
      degradedProviders: 0,
      unhealthyProviders: 0,
      overallCoverage: 0,
      targetCoverage: 98,
      status: 'critical'
    },
    {
      searchType: 'activity',
      totalProviders: 3,
      healthyProviders: 0,
      degradedProviders: 0,
      unhealthyProviders: 0,
      overallCoverage: 0,
      targetCoverage: 98,
      status: 'critical'
    }
  ]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const checkProviderHealth = async (): Promise<void> => {
    setIsChecking(true);
    
    try {
      // Check each search type independently
      const searchTypes = ['hotel', 'flight', 'activity'] as const;
      const allProviders: ProviderStatus[] = [];
      const newCoverage: CoverageMetrics[] = [];

      for (const searchType of searchTypes) {
        const { data } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType,
            healthCheckOnly: true,
            includeMetrics: true
          }
        });

        if (data?.providers) {
          const typeProviders = data.providers.map((p: any) => ({
            id: p.id,
            name: p.name,
            type: searchType,
            status: p.health?.status || 'unhealthy',
            responseTime: p.health?.responseTime || 9999,
            successRate: p.health?.successRate || 0,
            lastChecked: p.health?.lastChecked || new Date().toISOString()
          }));
          
          allProviders.push(...typeProviders);

          // Calculate coverage metrics
          const healthy = typeProviders.filter(p => p.status === 'healthy').length;
          const degraded = typeProviders.filter(p => p.status === 'degraded').length;
          const unhealthy = typeProviders.filter(p => p.status === 'unhealthy').length;
          const total = typeProviders.length;
          
          // Coverage calculation: healthy providers + 50% of degraded providers
          const effectiveCoverage = ((healthy + (degraded * 0.5)) / total) * 100;
          
          let status: CoverageMetrics['status'] = 'critical';
          if (effectiveCoverage >= 98) status = 'excellent';
          else if (effectiveCoverage >= 90) status = 'good';
          else if (effectiveCoverage >= 70) status = 'warning';

          newCoverage.push({
            searchType,
            totalProviders: total,
            healthyProviders: healthy,
            degradedProviders: degraded,
            unhealthyProviders: unhealthy,
            overallCoverage: effectiveCoverage,
            targetCoverage: 98,
            status
          });
        }
      }

      setProviders(allProviders);
      setCoverage(newCoverage);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Provider health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Auto-check on component mount
    checkProviderHealth();
    
    // Set up periodic checks every 5 minutes
    const interval = setInterval(checkProviderHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'excellent':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
      case 'good':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'excellent':
        return 'text-green-500';
      case 'degraded':
      case 'good':
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 98) return 'text-green-500';
    if (coverage >= 90) return 'text-blue-500';
    if (coverage >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const overallCoverage = coverage.length > 0 
    ? coverage.reduce((acc, c) => acc + c.overallCoverage, 0) / coverage.length 
    : 0;

  const criticalIssues = coverage.filter(c => c.status === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Provider Coverage Validator
          </CardTitle>
          
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-3xl font-bold ${getCoverageColor(overallCoverage)}`}>
                {overallCoverage.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">
                Overall Coverage (Target: 98%)
              </p>
            </div>
            
            <div className="text-right">
              <Button 
                onClick={checkProviderHealth}
                disabled={isChecking}
                className="mb-2"
              >
                {isChecking ? 'Checking...' : 'Check Now'}
              </Button>
              {lastUpdate && (
                <p className="text-xs text-muted-foreground">
                  Last checked: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {criticalIssues > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                {criticalIssues} service{criticalIssues !== 1 ? 's' : ''} below coverage target
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Coverage by Service Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coverage.map((metric) => (
          <Card key={metric.searchType}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="capitalize">{metric.searchType}</span>
                {getStatusIcon(metric.status)}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className={`text-2xl font-bold ${getCoverageColor(metric.overallCoverage)}`}>
                    {metric.overallCoverage.toFixed(1)}%
                  </div>
                  <Progress 
                    value={metric.overallCoverage} 
                    className="h-2 mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-green-500">
                      {metric.healthyProviders}
                    </div>
                    <div className="text-muted-foreground">Healthy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-yellow-500">
                      {metric.degradedProviders}
                    </div>
                    <div className="text-muted-foreground">Degraded</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-500">
                      {metric.unhealthyProviders}
                    </div>
                    <div className="text-muted-foreground">Unhealthy</div>
                  </div>
                </div>

                <Badge 
                  variant={metric.status === 'excellent' ? 'default' : 'destructive'}
                  className="w-full justify-center"
                >
                  {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Individual Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Provider Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={`${provider.type}-${provider.id}`}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(provider.status)}
                  <div>
                    <h4 className="font-medium">{provider.name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {provider.type} • Last checked: {new Date(provider.lastChecked).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{provider.responseTime}ms</div>
                    <div className="text-muted-foreground">Response</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{provider.successRate.toFixed(1)}%</div>
                    <div className="text-muted-foreground">Success</div>
                  </div>
                  <Badge 
                    variant={provider.status === 'healthy' ? 'default' : 'destructive'}
                  >
                    {provider.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Success Metrics Achievement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-border rounded-lg">
              <div className={`text-2xl font-bold ${overallCoverage >= 98 ? 'text-green-500' : 'text-red-500'}`}>
                {overallCoverage >= 98 ? '✓' : '✗'}
              </div>
              <div className="text-sm font-medium">98% Coverage</div>
              <div className="text-xs text-muted-foreground">Target achieved</div>
            </div>
            
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {providers.filter(p => p.responseTime < 3000).length}
              </div>
              <div className="text-sm font-medium">&lt;3s Response</div>
              <div className="text-xs text-muted-foreground">Providers under target</div>
            </div>
            
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {coverage.filter(c => c.status === 'excellent').length}/3
              </div>
              <div className="text-sm font-medium">Services</div>
              <div className="text-xs text-muted-foreground">At excellent level</div>
            </div>
            
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {Math.round(overallCoverage >= 98 ? 25 : (overallCoverage / 98) * 25)}%
              </div>
              <div className="text-sm font-medium">Est. Conversion</div>
              <div className="text-xs text-muted-foreground">Improvement potential</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};