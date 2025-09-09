import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Filter,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMasterBotController, BotResult } from '@/hooks/useMasterBotController';
import { formatDistanceToNow } from 'date-fns';

interface BotResultsPanelProps {
  dashboardType: 'user' | 'partner' | 'admin';
  className?: string;
}

export const BotResultsPanel: React.FC<BotResultsPanelProps> = ({
  dashboardType,
  className = '',
}) => {
  const { botResults, isLoading, getResultsByType, getHighPriorityResults } = useMasterBotController(dashboardType);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedBotType, setSelectedBotType] = useState<string>('all');

  const getFilteredResults = (): BotResult[] => {
    let filtered = botResults;

    if (selectedFilter !== 'all') {
      if (selectedFilter === 'high-priority') {
        filtered = getHighPriorityResults();
      } else {
        filtered = filtered.filter(result => result.actionability_rating === selectedFilter);
      }
    }

    if (selectedBotType !== 'all') {
      filtered = filtered.filter(result => result.bot_type === selectedBotType);
    }

    return filtered;
  };

  const getActionabilityIcon = (rating?: string) => {
    switch (rating) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'medium':
        return <Activity className="h-4 w-4 text-primary" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionabilityColor = (rating?: string) => {
    switch (rating) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getBotTypeColor = (botType: string) => {
    switch (botType) {
      case 'agentic':
        return 'default';
      case 'gpt':
        return 'secondary';
      case 'master':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getResultPreview = (result: BotResult): string => {
    if (typeof result.result_data === 'string') {
      return result.result_data.substring(0, 100) + (result.result_data.length > 100 ? '...' : '');
    }
    
    if (result.result_data && typeof result.result_data === 'object') {
      if (result.result_data.summary) {
        return result.result_data.summary.substring(0, 100) + '...';
      }
      if (result.result_data.recommendation) {
        return result.result_data.recommendation.substring(0, 100) + '...';
      }
      return 'Complex result data available';
    }
    
    return 'No preview available';
  };

  const filteredResults = getFilteredResults();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading bot results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Bot Results
            <Badge variant="outline" className="ml-2">
              {filteredResults.length}
            </Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="high-priority">High Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedBotType} onValueChange={setSelectedBotType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Bot type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="agentic">Agentic</SelectItem>
                <SelectItem value="gpt">GPT</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No bot results found</p>
              <p className="text-sm">Results will appear here as bots complete tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((result) => (
                <Card key={result.id} className="border border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getActionabilityIcon(result.actionability_rating)}
                        <div>
                          <h4 className="font-medium text-sm">{result.result_type}</h4>
                          <p className="text-xs text-muted-foreground">{result.bot_id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getBotTypeColor(result.bot_type)} className="text-xs">
                          {result.bot_type}
                        </Badge>
                        
                        {result.actionability_rating && (
                          <Badge variant={getActionabilityColor(result.actionability_rating)} className="text-xs">
                            {result.actionability_rating}
                          </Badge>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Apply Result
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {getResultPreview(result)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                      </span>
                      
                      {result.confidence_score && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {Math.round(result.confidence_score * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};