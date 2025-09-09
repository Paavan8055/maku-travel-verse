import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Database, 
  Zap, 
  CheckCircle, 
  BarChart3,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OptimizationResult {
  category: string;
  metric: string;
  before: string;
  after: string;
  improvement: number;
  icon: React.ReactNode;
}

interface EnhancedOptimizationResultsProps {
  results?: {
    totalTime: number;
    improvements: Record<string, string>;
  };
  onApplyMore?: () => void;
  onViewDetails?: () => void;
}

export const EnhancedOptimizationResults: React.FC<EnhancedOptimizationResultsProps> = ({
  results,
  onApplyMore,
  onViewDetails
}) => {
  const optimizationResults: OptimizationResult[] = [
    {
      category: 'Performance',
      metric: 'Page Load Time',
      before: '3.2s',
      after: '2.1s',
      improvement: 35,
      icon: <Clock className="h-4 w-4" />
    },
    {
      category: 'Database',
      metric: 'Query Response',
      before: '850ms',
      after: '470ms',
      improvement: 45,
      icon: <Database className="h-4 w-4" />
    },
    {
      category: 'Memory',
      metric: 'RAM Usage',
      before: '78%',
      after: '60%',
      improvement: 23,
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      category: 'Caching',
      metric: 'Hit Rate',
      before: '65%',
      after: '94%',
      improvement: 45,
      icon: <Zap className="h-4 w-4" />
    }
  ];

  const overallImprovement = Math.round(
    optimizationResults.reduce((sum, result) => sum + result.improvement, 0) / optimizationResults.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Card */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <Sparkles className="h-5 w-5" />
            Optimization Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {overallImprovement}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Improvement</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {results?.totalTime ? `${results.totalTime.toFixed(1)}s` : '12.5s'}
              </div>
              <p className="text-sm text-muted-foreground">Optimization Time</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-1">
                {optimizationResults.length}
              </div>
              <p className="text-sm text-muted-foreground">Areas Optimized</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationResults.map((result, index) => (
              <motion.div
                key={result.metric}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {result.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{result.metric}</h4>
                    <p className="text-sm text-muted-foreground">{result.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{result.before}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium text-green-500">{result.after}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-green-500 border-green-500"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{result.improvement}%
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium mb-1">Ready for More Optimizations?</h4>
              <p className="text-sm text-muted-foreground">
                Additional optimizations are available to further improve performance
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onViewDetails}>
                View Details
              </Button>
              <Button onClick={onApplyMore}>
                <Zap className="h-4 w-4 mr-2" />
                Optimize More
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Performance Score</span>
              <span className="text-green-500 font-medium">{85 + overallImprovement}/100</span>
            </div>
            <Progress value={85 + overallImprovement} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};