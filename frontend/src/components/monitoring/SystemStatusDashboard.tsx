import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Globe,
  CreditCard,
  Plane,
  RefreshCw,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { formatDistanceToNow } from 'date-fns';

export const SystemStatusDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const {
    health,
    loading,
    lastChecked,
    error,
    checkHealth,
    getOverallStatus,
    getServiceStatus,
    isServiceHealthy,
    getHealthScore,
    isCircuitBreakerOpen,
    circuitBreakerState
  } = useHealthMonitor({
    checkInterval: 5 * 60 * 1000, // 5 minutes
    enableAutoCheck: true
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkHealth();
    setRefreshing(false);
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'amadeus':
        return <Plane className="h-4 w-4" />;
      case 'stripe':
        return <CreditCard className="h-4 w-4" />;
      case 'supabase':
        return <Globe className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
      case 'healthy':
        return 'text-green-500';
      case 'slow':
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      up: 'bg-green-100 text-green-800',
      healthy: 'bg-green-100 text-green-800',
      slow: 'bg-yellow-100 text-yellow-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      down: 'bg-red-100 text-red-800',
      unhealthy: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    
    return variants[status as keyof typeof variants] || variants.unknown;
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const overallStatus = getOverallStatus();
  const healthScore = getHealthScore();

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
              <Badge className={getStatusBadge(overallStatus)}>
                {overallStatus}
              </Badge>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {lastChecked && (
            <p className="text-sm text-muted-foreground">
              Last updated {formatDistanceToNow(lastChecked)} ago
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{healthScore}%</div>
              <div className="text-sm text-muted-foreground">Health Score</div>
              <Progress value={healthScore} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {health?.performance.responseTime ? formatResponseTime(health.performance.responseTime) : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-1">
                {isCircuitBreakerOpen ? (
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                {circuitBreakerState}
              </div>
              <div className="text-sm text-muted-foreground">Circuit Breaker</div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">System Alert</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Service Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {health && Object.entries(health.services).map(([serviceName, service]) => (
              <div key={serviceName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(serviceName)}
                    <h3 className="font-medium capitalize">{serviceName}</h3>
                  </div>
                  <Badge className={getStatusBadge(service.status)}>
                    {service.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Time:</span>
                    <span>{formatResponseTime(service.responseTime)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Check:</span>
                    <span>
                      {formatDistanceToNow(new Date(service.lastChecked))} ago
                    </span>
                  </div>
                  
                  {service.error && (
                    <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
                      {service.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold">
                {health ? Object.values(health.services).filter(s => s.status === 'up').length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Services Online</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold">
                {health ? Object.values(health.services).filter(s => s.status === 'slow').length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Services Slow</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold">
                {health ? Object.values(health.services).filter(s => s.status === 'down').length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Services Down</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                {health?.performance.responseTime ? (health.performance.responseTime < 1000 ? '✓' : '⚠') : '?'}
              </div>
              <div className="text-sm text-muted-foreground">Performance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};