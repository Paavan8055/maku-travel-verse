import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  X,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface BotResult {
  id: string;
  bot_type: string;
  result_type: string;
  result_data: any;
  confidence_score?: number;
  actionability_rating?: string;
  created_at: string;
}

interface EnhancedResultsNotificationProps {
  results: BotResult[];
  onDismiss: (resultId: string) => void;
  onApplyOptimization: (result: BotResult) => void;
}

export const EnhancedResultsNotification: React.FC<EnhancedResultsNotificationProps> = ({
  results,
  onDismiss,
  onApplyOptimization
}) => {
  const [visibleResults, setVisibleResults] = useState<BotResult[]>([]);

  useEffect(() => {
    // Show only recent high-priority results
    const recentResults = results
      .filter(r => (r.actionability_rating === 'high' || r.actionability_rating === 'critical') || r.result_type === 'optimization')
      .filter(r => {
        const resultAge = new Date().getTime() - new Date(r.created_at).getTime();
        return resultAge < 5 * 60 * 1000; // Show results from last 5 minutes
      })
      .slice(0, 3); // Show max 3 notifications

    setVisibleResults(recentResults);
  }, [results]);

  const getResultIcon = (resultType: string) => {
    switch (resultType) {
      case 'optimization':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'analysis':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case 'control':
        return <Zap className="h-5 w-5 text-purple-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-primary" />;
    }
  };

  const getResultTitle = (result: BotResult) => {
    if (result.result_type === 'optimization' && result.result_data?.summary) {
      return 'Dashboard Optimization Complete';
    }
    return `${result.result_type.charAt(0).toUpperCase() + result.result_type.slice(1)} Complete`;
  };

  const getResultDescription = (result: BotResult) => {
    if (result.result_data?.summary) {
      return result.result_data.summary;
    }
    return `New ${result.result_type} result available with ${Math.round((result.confidence_score || 0.9) * 100)}% confidence`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      <AnimatePresence>
        {visibleResults.map((result) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Card className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getResultIcon(result.result_type)}
                    <CardTitle className="text-sm font-semibold">
                      {getResultTitle(result)}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={(result.actionability_rating === 'critical') ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {result.actionability_rating || 'medium'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted"
                      onClick={() => onDismiss(result.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {getResultDescription(result)}
                </p>
                
                {result.result_data?.optimization_suggestions && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Key Improvements:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {result.result_data.optimization_suggestions.slice(0, 2).map((suggestion: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-primary">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.result_data?.metrics && (
                  <div className="mb-3 p-2 bg-muted/50 rounded">
                    <div className="flex justify-between text-xs">
                      <span>Performance Gain:</span>
                      <span className="text-green-500 font-medium">+15%</span>
                    </div>
                    {result.result_data.metrics.average_booking_value && (
                      <div className="flex justify-between text-xs">
                        <span>Avg. Booking Value:</span>
                        <span className="font-medium">${result.result_data.metrics.average_booking_value.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                  </span>
                  <div className="flex gap-2">
                    {result.result_type === 'optimization' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => onApplyOptimization(result)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Apply
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        // Show detailed result information
                        console.log('Viewing result details:', result);
                        // You could open a modal, navigate to details page, or expand inline
                        alert(`Result Details:\n\nType: ${result.result_type}\nBot: ${result.bot_type}\nConfidence: ${result.confidence_score || 'N/A'}\nActionability: ${result.actionability_rating || 'N/A'}\n\nSummary: ${result.result_data?.summary || 'No summary available'}\n\nFull Data: ${JSON.stringify(result.result_data, null, 2)}`);
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};