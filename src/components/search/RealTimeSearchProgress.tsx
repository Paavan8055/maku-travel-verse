import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock, Zap, TrendingUp } from 'lucide-react';
import { useHealthStatus } from '@/hooks/useHealthStatus';

export interface ProviderStatus {
  providerId: string;
  providerName: string;
  status: 'pending' | 'searching' | 'completed' | 'failed' | 'timeout';
  progress: number;
  responseTime?: number;
  resultCount?: number;
  error?: string;
  quality?: number;
  mlScore?: number;
}

export interface SearchProgressProps {
  searchType: 'flight' | 'hotel' | 'activity';
  isActive: boolean;
  providers: ProviderStatus[];
  overallProgress: number;
  estimatedTimeRemaining?: number;
  onProviderRetry?: (providerId: string) => void;
  showDetailedMetrics?: boolean;
  className?: string;
}

export const RealTimeSearchProgress: React.FC<SearchProgressProps> = ({
  searchType,
  isActive,
  providers,
  overallProgress,
  estimatedTimeRemaining,
  onProviderRetry,
  showDetailedMetrics = false,
  className = ""
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const { healthStatus } = useHealthStatus();

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  const getStatusIcon = (status: ProviderStatus['status'], quality?: number) => {
    switch (status) {
      case 'completed':
        if (quality && quality >= 80) {
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        } else if (quality && quality >= 60) {
          return <CheckCircle className="w-4 h-4 text-yellow-500" />;
        }
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'timeout':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'searching':
        return (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />;
    }
  };

  const getStatusBadge = (provider: ProviderStatus) => {
    const { status, responseTime, resultCount, quality, mlScore } = provider;
    
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {resultCount || 0} results
            </Badge>
            {responseTime && (
              <Badge variant="outline" className="text-xs">
                {responseTime}ms
              </Badge>
            )}
            {quality && (
              <Badge 
                variant={quality >= 80 ? "default" : quality >= 60 ? "secondary" : "destructive"} 
                className="text-xs"
              >
                Q: {quality}%
              </Badge>
            )}
          </div>
        );
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case 'timeout':
        return <Badge variant="destructive" className="text-xs">Timeout</Badge>;
      case 'searching':
        return (
          <Badge variant="outline" className="text-xs animate-pulse">
            Searching...
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">Pending</Badge>;
    }
  };

  const completedProviders = providers.filter(p => p.status === 'completed').length;
  const failedProviders = providers.filter(p => p.status === 'failed' || p.status === 'timeout').length;
  const successRate = providers.length > 0 ? (completedProviders / providers.length) * 100 : 0;

  const getSearchTypeEmoji = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      default: return '🔍';
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSearchTypeEmoji(searchType)}</span>
            <h3 className="font-medium capitalize">
              {searchType} Search Progress
            </h3>
            {isActive && (
              <Badge variant="outline" className="animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {estimatedTimeRemaining && isActive && (
              <span>~{Math.ceil(estimatedTimeRemaining / 1000)}s remaining</span>
            )}
            <span>{completedProviders}/{providers.length} providers</span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-2"
            style={{
              background: isActive 
                ? `linear-gradient(90deg, hsl(var(--primary)) ${overallProgress}%, hsl(var(--muted)) ${overallProgress}%)`
                : undefined
            }}
          />
        </div>

        {/* Provider Status List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Provider Status</span>
            {showDetailedMetrics && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Success Rate: {Math.round(successRate)}%</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {providers.map((provider) => (
              <div
                key={provider.providerId}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1">
                  {getStatusIcon(provider.status, provider.quality)}
                  <span className="text-sm font-medium">
                    {provider.providerName}
                  </span>
                  {provider.mlScore && showDetailedMetrics && (
                    <Badge variant="outline" className="text-xs">
                      ML: {Math.round(provider.mlScore * 100)}%
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {provider.status === 'searching' && (
                    <div className="w-20">
                      <Progress value={provider.progress} className="h-1" />
                    </div>
                  )}
                  
                  {getStatusBadge(provider)}
                  
                  {provider.status === 'failed' && onProviderRetry && (
                    <button
                      onClick={() => onProviderRetry(provider.providerId)}
                      className="text-xs text-primary hover:underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Indicator */}
        {healthStatus && healthStatus.status !== 'healthy' && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Some services are experiencing issues. Search results may be limited.
            </span>
          </div>
        )}

        {/* Detailed Metrics */}
        {showDetailedMetrics && !isActive && providers.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {completedProviders}
              </div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {failedProviders}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {providers.reduce((sum, p) => sum + (p.responseTime || 0), 0) / providers.length | 0}ms
              </div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {failedProviders > 0 && !isActive && (
          <div className="space-y-1">
            <span className="text-sm font-medium text-destructive">
              Failed Providers:
            </span>
            {providers
              .filter(p => p.status === 'failed' || p.status === 'timeout')
              .map(provider => (
                <div key={provider.providerId} className="text-xs text-muted-foreground ml-2">
                  • {provider.providerName}: {provider.error || 'Unknown error'}
                </div>
              ))
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};