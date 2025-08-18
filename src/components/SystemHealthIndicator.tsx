import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SystemHealthIndicatorProps {
  className?: string;
}

// PHASE 5: System health monitoring component
export const SystemHealthIndicator = ({ className }: SystemHealthIndicatorProps) => {
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unavailable'>('healthy');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // This would be connected to real health monitoring in production
  useEffect(() => {
    // Mock health check - in production this would ping actual services
    const checkHealth = () => {
      // Simulate periodic health checks
      setLastCheck(new Date());
      
      // In production, this would check actual service endpoints
      const isHealthy = Math.random() > 0.1; // 90% uptime simulation
      
      if (isHealthy) {
        setHealthStatus('healthy');
      } else {
        setHealthStatus('degraded');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (healthStatus) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'All systems operational',
          description: 'Hotel search and booking services are running normally'
        };
      case 'degraded':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Limited service',
          description: 'Some hotel search features may be slower than usual'
        };
      case 'unavailable':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Service disruption',
          description: 'Hotel search is temporarily unavailable. We are working to restore service.'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`${className} ${config.bgColor} ${config.borderColor} border`}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {lastCheck.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};