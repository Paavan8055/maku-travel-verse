import { useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GracefulDegradationProps {
  isOnline?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  serviceStatus?: 'up' | 'down' | 'degraded';
  fallbackContent?: React.ReactNode;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export const GracefulDegradation = ({
  isOnline = true,
  hasError = false,
  errorMessage,
  serviceStatus = 'up',
  fallbackContent,
  onRetry,
  children
}: GracefulDegradationProps) => {
  const [showFallback, setShowFallback] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'up': return 'All systems operational';
      case 'degraded': return 'Some services experiencing issues';
      case 'down': return 'Service temporarily unavailable';
      default: return 'Status unknown';
    }
  };

  // Show fallback for offline, errors, or degraded service
  const shouldShowFallback = !isOnline || hasError || serviceStatus === 'down' || showFallback;

  if (shouldShowFallback && fallbackContent) {
    return (
      <div className="space-y-4">
        <Alert variant={serviceStatus === 'down' ? 'destructive' : 'default'}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className={`h-4 w-4 ${getStatusColor(serviceStatus)}`} />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <AlertCircle className="h-4 w-4" />
          </div>
          <AlertDescription>
            {!isOnline 
              ? "You're currently offline. Showing cached content."
              : errorMessage || getStatusText(serviceStatus)
            }
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Demo Content</CardTitle>
              <Badge variant="outline" className="text-xs">
                {!isOnline ? 'Offline' : 'Demo Data'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fallbackContent}
              
              {onRetry && isOnline && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => {
                      setShowFallback(false);
                      onRetry();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Try Live Data Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show normal content with optional service status indicator
  return (
    <div className="space-y-2">
      {serviceStatus === 'degraded' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Service is running with limited functionality.</span>
            {fallbackContent && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFallback(true)}
              >
                Use Demo Data
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {children}
    </div>
  );
};

export default GracefulDegradation;