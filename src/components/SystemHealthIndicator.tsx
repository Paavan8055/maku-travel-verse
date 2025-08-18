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

  // Real health monitoring connected to Amadeus API
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('https://iomeddeasarntjhqzndu.supabase.co/functions/v1/amadeus-health', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbWVkZGVhc2FybnRqaHF6bmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODk0NjksImV4cCI6MjA2OTk2NTQ2OX0.tZ50J9PPa6ZqDdPF0-WPYwoLO-aGBIf6Qtjr7dgYrDI'
          },
          body: JSON.stringify({ healthCheck: true })
        });
        
        setLastCheck(new Date());
        
        if (response.ok) {
          const data = await response.json();
          if (data.healthy) {
            setHealthStatus('healthy');
          } else {
            setHealthStatus('degraded');
          }
        } else {
          setHealthStatus('unavailable');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setHealthStatus('unavailable');
        setLastCheck(new Date());
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