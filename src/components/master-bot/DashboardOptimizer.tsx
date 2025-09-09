import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Settings, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OptimizationMetric {
  label: string;
  current: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

interface DashboardOptimizerProps {
  onOptimize: (optimizationType: string) => void;
  isOptimizing: boolean;
  lastOptimization?: Date;
}

export const DashboardOptimizer: React.FC<DashboardOptimizerProps> = ({
  onOptimize,
  isOptimizing,
  lastOptimization
}) => {
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null);

  const optimizationMetrics: OptimizationMetric[] = [
    {
      label: 'Response Time',
      current: 1.2,
      target: 0.8,
      unit: 's',
      status: 'warning'
    },
    {
      label: 'Success Rate',
      current: 94.2,
      target: 98.0,
      unit: '%',
      status: 'warning'
    },
    {
      label: 'Resource Usage',
      current: 76,
      target: 60,
      unit: '%',
      status: 'critical'
    },
    {
      label: 'User Satisfaction',
      current: 4.2,
      target: 4.8,
      unit: '/5',
      status: 'good'
    }
  ];

  const optimizationTypes = [
    {
      id: 'performance',
      label: 'Performance Optimization',
      description: 'Optimize dashboard loading times and response rates',
      icon: <Zap className="h-5 w-5" />,
      duration: '2-3 minutes',
      impact: 'high'
    },
    {
      id: 'layout',
      label: 'Layout Optimization',
      description: 'Reorganize dashboard components for better UX',
      icon: <Settings className="h-5 w-5" />,
      duration: '1-2 minutes',
      impact: 'medium'
    },
    {
      id: 'analytics',
      label: 'Analytics Enhancement',
      description: 'Improve data visualization and insights',
      icon: <BarChart3 className="h-5 w-5" />,
      duration: '3-4 minutes',
      impact: 'high'
    },
    {
      id: 'automation',
      label: 'Automation Rules',
      description: 'Set up smart automation triggers and workflows',
      icon: <Target className="h-5 w-5" />,
      duration: '2-3 minutes',
      impact: 'very high'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  const handleOptimize = (type: string) => {
    setSelectedOptimization(type);
    onOptimize(`Optimize dashboard ${type} - improve performance metrics, enhance user experience, and implement best practices for ${type}`);
  };

  return (
    <div className="space-y-6">
      {/* Current Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dashboard Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optimizationMetrics.map((metric, index) => (
              <div key={metric.label} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{metric.label}</span>
                  {getStatusIcon(metric.status)}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold">
                    {metric.current}{metric.unit}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {metric.target}{metric.unit}
                  </span>
                </div>
                <Progress 
                  value={(metric.current / metric.target) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Available Optimizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optimizationTypes.map((optimization) => (
              <motion.div
                key={optimization.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedOptimization === optimization.id ? 'ring-2 ring-primary' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {optimization.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">
                          {optimization.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          {optimization.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={optimization.impact === 'very high' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {optimization.impact} impact
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {optimization.duration}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={selectedOptimization === optimization.id ? 'default' : 'outline'}
                            onClick={() => handleOptimize(optimization.id)}
                            disabled={isOptimizing}
                            className="h-7 text-xs"
                          >
                            {isOptimizing && selectedOptimization === optimization.id ? (
                              <>
                                <Clock className="h-3 w-3 mr-1 animate-spin" />
                                Optimizing...
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3 mr-1" />
                                Optimize
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Optimization Info */}
      {lastOptimization && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Last optimization completed {new Date(lastOptimization).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};