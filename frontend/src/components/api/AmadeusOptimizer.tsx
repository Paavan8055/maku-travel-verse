import React, { useEffect, useState } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface AmadeusOptimizerProps {
  onApiStatusChange?: (status: 'healthy' | 'degraded' | 'down') => void;
}

interface ApiHealth {
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: number;
  errorRate: number;
}

export const AmadeusOptimizer: React.FC<AmadeusOptimizerProps> = ({ 
  onApiStatusChange 
}) => {
  const [apiHealth, setApiHealth] = useState<ApiHealth>({
    status: 'healthy',
    responseTime: 0,
    lastChecked: Date.now(),
    errorRate: 0
  });

  const [cacheHitRate, setCacheHitRate] = useState(85);
  const [retryAttempts, setRetryAttempts] = useState(0);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const startTime = Date.now();
        const response = await fetch('/api/health/amadeus');
        const responseTime = Date.now() - startTime;
        
        const isHealthy = response.ok && responseTime < 2000;
        const isDegraded = response.ok && responseTime >= 2000;
        const status = isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'down';
        
        setApiHealth({
          status,
          responseTime,
          lastChecked: Date.now(),
          errorRate: response.ok ? 0 : 100
        });
        
        onApiStatusChange?.(status);
        
        // Simulate cache performance
        setCacheHitRate(Math.random() * 20 + 75); // 75-95%
      } catch (error) {
        setApiHealth(prev => ({
          ...prev,
          status: 'down',
          errorRate: 100,
          lastChecked: Date.now()
        }));
        onApiStatusChange?.('down');
      }
    };

    // Initial check
    checkApiHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    
    return () => clearInterval(interval);
  }, [onApiStatusChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-success text-success-foreground';
      case 'degraded': return 'bg-warning text-warning-foreground';
      case 'down': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Wifi className="h-3 w-3" />;
      case 'degraded': return <AlertTriangle className="h-3 w-3" />;
      case 'down': return <WifiOff className="h-3 w-3" />;
      default: return <WifiOff className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {apiHealth.status !== 'healthy' && (
        <Alert variant={apiHealth.status === 'down' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {apiHealth.status === 'down' 
              ? 'Hotel search is temporarily unavailable. Please try again in a few minutes.'
              : 'Hotel search is experiencing slower response times. Results may take longer to load.'
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge className={getStatusColor(apiHealth.status)}>
          {getStatusIcon(apiHealth.status)}
          API {apiHealth.status}
        </Badge>
        
        <Badge variant="outline">
          {apiHealth.responseTime}ms response
        </Badge>
        
        <Badge variant="outline">
          {cacheHitRate.toFixed(0)}% cache hit
        </Badge>
        
        {retryAttempts > 0 && (
          <Badge variant="secondary">
            {retryAttempts} retries
          </Badge>
        )}
      </div>
    </div>
  );
};

export default AmadeusOptimizer;