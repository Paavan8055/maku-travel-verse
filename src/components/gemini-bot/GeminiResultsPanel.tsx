import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GeminiResponse } from '@/lib/gemini';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Bot
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GeminiResult extends GeminiResponse {
  id: string;
  timestamp: Date;
  query: string;
  type?: 'travel_search' | 'recommendation' | 'itinerary' | 'general';
}

interface GeminiResultsPanelProps {
  results: GeminiResult[];
  onApplyResult?: (result: GeminiResult) => void;
  onDismissResult?: (resultId: string) => void;
  className?: string;
}

export const GeminiResultsPanel: React.FC<GeminiResultsPanelProps> = ({
  results,
  onApplyResult,
  onDismissResult,
  className = ""
}) => {
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'travel_search':
        return <TrendingUp className="h-4 w-4" />;
      case 'recommendation':
      case 'itinerary':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="default" className="bg-green-500">High Confidence</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge variant="secondary">Medium Confidence</Badge>;
    } else {
      return <Badge variant="outline">Low Confidence</Badge>;
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-destructive" />
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Gemini AI Results
          <Badge variant="outline" className="ml-auto">
            {results.length} results
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No AI results yet</p>
                <p className="text-sm">Interact with the Gemini assistant to see results here</p>
              </div>
            ) : (
              results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.success)}
                      {getTypeIcon(result.type)}
                      <span className="font-medium text-sm">
                        {result.type?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getConfidenceBadge(result.confidence)}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Query: </span>
                      <span className="italic">{result.query}</span>
                    </div>
                    
                    <div className="text-sm bg-muted p-3 rounded">
                      {result.message}
                    </div>

                    {result.suggestions && result.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Suggestions:</span>
                        <div className="flex flex-wrap gap-1">
                          {result.suggestions.map((suggestion, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.data && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Data: </span>
                        <code className="bg-muted px-1 rounded">
                          {JSON.stringify(result.data).slice(0, 100)}...
                        </code>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {onApplyResult && result.success && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplyResult(result)}
                      >
                        Apply Result
                      </Button>
                    )}
                    {onDismissResult && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDismissResult(result.id)}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};