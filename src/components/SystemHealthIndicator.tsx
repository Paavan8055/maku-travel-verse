import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff, Shield, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    database: ServiceHealth;
    amadeus: ServiceHealth;
    stripe: ServiceHealth;
    supabase: ServiceHealth;
  };
  performance: {
    responseTime: number;
    memoryUsage?: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'slow';
  responseTime?: number;
  lastChecked: number;
  error?: string;
}

export const SystemHealthIndicator = () => {
  const { 
    health, 
    loading, 
    lastChecked, 
    error,
    checkHealth,
    isCircuitBreakerOpen,
    circuitBreakerState
  } = useHealthMonitor({
    checkInterval: 5 * 60 * 1000, // 5 minutes
    enableAutoCheck: true
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-500';
      case 'degraded':
      case 'slow':
        return 'text-yellow-500';
      case 'unhealthy':
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
      case 'slow':
        return <Clock className="h-4 w-4" />;
      case 'unhealthy':
      case 'down':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!health && !loading) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${health ? getStatusColor(health.status) : 'text-gray-500'}`}
        >
          {loading ? (
            <Wifi className="h-4 w-4 animate-pulse" />
          ) : (
            health && getStatusIcon(health.status)
          )}
          <span className="ml-1 text-xs font-medium">
            {loading ? 'Checking...' : health?.status || 'Unknown'}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">System Health</h4>
              <div className="flex items-center gap-2">
                {isCircuitBreakerOpen && (
                  <Shield className="h-4 w-4 text-orange-500" />
                )}
                <Badge variant={health ? getBadgeVariant(health.status) : 'outline'}>
                  {health?.status || 'Unknown'}
                </Badge>
              </div>
            </div>

            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {isCircuitBreakerOpen && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Health monitoring temporarily paused due to repeated failures. System will retry automatically.
                </AlertDescription>
              </Alert>
            )}

          {health && (
            <>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Services</h5>
                {Object.entries(health.services).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={getStatusColor(status.status)}>
                        {getStatusIcon(status.status)}
                      </div>
                      <span className="capitalize">{service}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {status.responseTime && `${Math.round(status.responseTime)}ms`}
                      {status.error && (
                        <div className="text-red-500 max-w-40 truncate">
                          {status.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Response Time</span>
                  <span>{Math.round(health.performance.responseTime)}ms</span>
                </div>
                {health.performance.memoryUsage && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Memory Usage</span>
                    <span>{health.performance.memoryUsage}MB</span>
                  </div>
                )}
                {lastChecked && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Last Checked</span>
                    <span>{lastChecked.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkHealth}
                  disabled={loading || isCircuitBreakerOpen}
                  className="flex-1"
                >
                  {loading ? 'Checking...' : 
                   isCircuitBreakerOpen ? 'Paused' : 
                   'Refresh Status'}
                </Button>
                {circuitBreakerState && (
                  <Badge variant="outline" className="text-xs">
                    {circuitBreakerState.toUpperCase()}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};