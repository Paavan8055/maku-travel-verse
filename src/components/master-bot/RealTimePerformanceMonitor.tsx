import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Monitor,
  Database,
  Wifi
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PerformanceMetric {
  label: string;
  value: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

interface RealTimePerformanceMonitorProps {
  onPerformanceChange?: (metrics: PerformanceMetric[]) => void;
}

export const RealTimePerformanceMonitor: React.FC<RealTimePerformanceMonitorProps> = ({
  onPerformanceChange
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      label: 'Page Load Time',
      value: 2.3,
      target: 2.0,
      unit: 's',
      status: 'warning',
      trend: 'stable',
      icon: <Clock className="h-4 w-4" />
    },
    {
      label: 'API Response Time',
      value: 450,
      target: 500,
      unit: 'ms',
      status: 'good',
      trend: 'down',
      icon: <Database className="h-4 w-4" />
    },
    {
      label: 'Memory Usage',
      value: 68,
      target: 80,
      unit: '%',
      status: 'good',
      trend: 'up',
      icon: <Monitor className="h-4 w-4" />
    },
    {
      label: 'Network Latency',
      value: 120,
      target: 100,
      unit: 'ms',
      status: 'warning',
      trend: 'stable',
      icon: <Wifi className="h-4 w-4" />
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        // Simulate real-time updates
        const variation = (Math.random() - 0.5) * 0.2;
        let newValue = metric.value + (metric.value * variation);
        
        // Keep values within reasonable bounds
        if (metric.unit === '%') {
          newValue = Math.max(0, Math.min(100, newValue));
        } else if (metric.unit === 'ms') {
          newValue = Math.max(50, Math.min(2000, newValue));
        } else if (metric.unit === 's') {
          newValue = Math.max(0.5, Math.min(10, newValue));
        }

        const status: 'good' | 'warning' | 'critical' = 
          newValue <= metric.target ? 'good' :
          newValue <= metric.target * 1.2 ? 'warning' : 'critical';

        const trend: 'up' | 'down' | 'stable' = 
          newValue > metric.value * 1.05 ? 'up' :
          newValue < metric.value * 0.95 ? 'down' : 'stable';

        return {
          ...metric,
          value: Number(newValue.toFixed(metric.unit === 's' ? 1 : 0)),
          status,
          trend
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    onPerformanceChange?.(metrics);
  }, [metrics, onPerformanceChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getTrendIcon = (trend: string, status: string) => {
    const colorClass = getStatusColor(status);
    if (trend === 'up') return <TrendingUp className={`h-3 w-3 ${colorClass}`} />;
    if (trend === 'down') return <TrendingDown className={`h-3 w-3 ${colorClass}`} />;
    return <Activity className={`h-3 w-3 ${colorClass}`} />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Real-Time Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-muted/50 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(metric.trend, metric.status)}
                  <Badge variant={metric.status === 'good' ? 'default' : 'destructive'}>
                    {metric.status}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={getStatusColor(metric.status)}>
                    {metric.value}{metric.unit}
                  </span>
                  <span className="text-muted-foreground">
                    Target: {metric.target}{metric.unit}
                  </span>
                </div>
                
                <div className="relative">
                  <Progress 
                    value={Math.min((metric.value / (metric.target * 1.5)) * 100, 100)} 
                    className="h-2"
                  />
                  <div 
                    className={`absolute top-0 h-2 rounded-full transition-all duration-300 ${getProgressColor(metric.status)}`}
                    style={{ 
                      width: `${Math.min((metric.value / (metric.target * 1.5)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
