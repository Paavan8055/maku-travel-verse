import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { cn } from '@/lib/utils';

interface ProviderHealthBadgesProps {
  className?: string;
  compact?: boolean;
}

export const ProviderHealthBadges: React.FC<ProviderHealthBadgesProps> = ({ 
  className,
  compact = false 
}) => {
  const { health, loading, lastChecked } = useHealthMonitor({
    enableAutoCheck: true,
    checkInterval: 30000 // Check every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-3 w-3" />;
      case 'degraded':
        return <AlertTriangle className="h-3 w-3" />;
      case 'unhealthy':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProviderStatus = (services: any, type: string) => {
    // Mock provider status based on service health
    if (!services) return 'unknown';
    
    const serviceKeys = Object.keys(services);
    const healthyCount = serviceKeys.filter(key => services[key]?.status === 'up').length;
    const totalCount = serviceKeys.length;
    
    if (healthyCount === totalCount) return 'healthy';
    if (healthyCount > totalCount / 2) return 'degraded';
    return 'unhealthy';
  };

  const providerTypes = [
    { key: 'flight', label: 'Flights', providers: ['Amadeus', 'Sabre'] },
    { key: 'hotel', label: 'Hotels', providers: ['HotelBeds', 'Sabre'] },
    { key: 'activity', label: 'Activities', providers: ['HotelBeds', 'Amadeus', 'Sabre'] }
  ];

  if (loading || !health?.services) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Activity className="h-4 w-4 animate-pulse text-muted-foreground" />
        {!compact && <span className="text-sm text-muted-foreground">Checking...</span>}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center space-x-2", className)}>
        {providerTypes.map((type) => {
          const status = getProviderStatus(health.services, type.key);
          const mockProviders = type.providers.map(name => ({
            id: name.toLowerCase(),
            name,
            status: health.services.amadeus?.status === 'up' ? 'healthy' : 'degraded'
          }));
          
          return (
            <Tooltip key={type.key}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "flex items-center space-x-1 text-xs",
                    status === 'healthy' && "border-green-500 text-green-700",
                    status === 'degraded' && "border-yellow-500 text-yellow-700",
                    status === 'unhealthy' && "border-red-500 text-red-700"
                  )}
                >
                  {getStatusIcon(status)}
                  {!compact && <span>{type.label}</span>}
                  <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2">
                  <div className="font-semibold">{type.label} Providers</div>
                  {mockProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between space-x-2">
                      <span className="text-sm">{provider.name}</span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(provider.status)}
                        <span className="text-xs capitalize">{provider.status}</span>
                      </div>
                    </div>
                  ))}
                  {lastChecked && (
                    <div className="text-xs text-muted-foreground border-t pt-1">
                      Last checked: {new Date(lastChecked).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {/* Overall System Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline"
              className={cn(
                "flex items-center space-x-1",
                health.status === 'healthy' && "border-green-500 text-green-700",
                health.status === 'degraded' && "border-yellow-500 text-yellow-700",
                health.status === 'unhealthy' && "border-red-500 text-red-700"
              )}
            >
              <Activity className="h-3 w-3" />
              {!compact && <span>System</span>}
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(health.status))} />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-semibold">System Health</div>
              <div className="text-sm capitalize">{health.status}</div>
              <div className="text-xs text-muted-foreground">
                {Object.values(health.services).filter(s => s.status === 'up').length} of {Object.keys(health.services).length} services healthy
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};