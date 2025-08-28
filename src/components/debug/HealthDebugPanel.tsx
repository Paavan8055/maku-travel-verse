import { useState } from 'react';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Minimize2, Maximize2 } from 'lucide-react';

export const HealthDebugPanel = () => {
  const { health, loading, error, circuitBreakerState, resetCircuitBreaker } = useHealthMonitor();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development' || isDismissed) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 z-20 w-80 max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Health Debug</span>
            <CardDescription className="text-xs">Development only</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      {!isMinimized && (
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
      )}
    </Card>
  );
};