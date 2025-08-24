import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const HealthDebugPanel = () => {
  const { health, loading, error, circuitBreakerState, resetCircuitBreaker } = useHealthMonitor();

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Health Debug</CardTitle>
        <CardDescription className="text-xs">Development only</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs">Circuit Breaker:</span>
          <Badge variant={circuitBreakerState === 'closed' ? 'default' : 'destructive'}>
            {circuitBreakerState}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs">Loading:</span>
          <Badge variant={loading ? 'secondary' : 'outline'}>
            {loading ? 'Checking' : 'Idle'}
          </Badge>
        </div>

        {error && (
          <div className="text-xs text-destructive">
            Error: {error}
          </div>
        )}

        <Button 
          onClick={resetCircuitBreaker} 
          size="sm" 
          variant="outline" 
          className="w-full text-xs"
        >
          Reset Circuit Breaker
        </Button>
      </CardContent>
    </Card>
  );
};