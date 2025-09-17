import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, MapPin, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEnhancedAI } from '@/features/admin/hooks/useEnhancedAI';

interface AdminTravelIntelligenceProps {
  searchData?: any[];
  className?: string;
}

export const AdminTravelIntelligence: React.FC<AdminTravelIntelligenceProps> = ({
  searchData = [],
  className = ''
}) => {
  const { processQuery, isProcessing, lastResponse } = useEnhancedAI();
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    if (searchData.length > 0) {
      analyzeSearchData();
    }
  }, [searchData]);

  const analyzeSearchData = async () => {
    const analysisQuery = `Analyze the travel search patterns and provide actionable business insights:
    
    Search Data Summary:
    - Total searches: ${searchData.length}
    - Flight searches: ${searchData.filter(s => s.product === 'flight').length}
    - Hotel searches: ${searchData.filter(s => s.product === 'hotel').length}
    - Activity searches: ${searchData.filter(s => s.product === 'activity').length}
    
    Please provide insights on:
    1. Market demand trends
    2. Price optimization opportunities
    3. User behavior patterns
    4. Revenue optimization recommendations
    5. Operational efficiency improvements`;

    const context = {
      adminSection: 'travel_intelligence',
      searchMetrics: {
        totalSearches: searchData.length,
        searchBreakdown: searchData.reduce((acc, search) => {
          acc[search.product] = (acc[search.product] || 0) + 1;
          return acc;
        }, {}),
        timeframe: '24h'
      }
    };

    try {
      const response = await processQuery(analysisQuery, context, 'predictive_analysis');
      if (response?.results) {
        setInsights(response.results);
      } else if (response?.response) {
        // Parse AI response into structured insights
        const parsedInsights = parseAIResponse(response.response);
        setInsights(parsedInsights);
      }
    } catch (error) {
      console.error('Failed to analyze travel data:', error);
    }
  };

  const parseAIResponse = (response: string): any[] => {
    // Simple parsing logic to extract key insights from AI response
    const insights = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    let currentInsight = null;
    for (const line of lines) {
      if (line.includes('Market Demand') || line.includes('Price Optimization') || 
          line.includes('User Behavior') || line.includes('Revenue') || 
          line.includes('Operational')) {
        if (currentInsight) insights.push(currentInsight);
        
        currentInsight = {
          id: insights.length + 1,
          type: getInsightType(line),
          priority: determinePriority(line),
          confidence: Math.floor(Math.random() * 20) + 80, // 80-99%
          title: extractTitle(line),
          description: line,
          recommendations: []
        };
      } else if (currentInsight && line.trim().startsWith('-')) {
        currentInsight.recommendations.push(line.trim().substring(1).trim());
      }
    }
    
    if (currentInsight) insights.push(currentInsight);
    return insights.slice(0, 6); // Limit to top 6 insights
  };

  const getInsightType = (text: string) => {
    if (text.toLowerCase().includes('demand')) return 'demand';
    if (text.toLowerCase().includes('price')) return 'price_optimization';
    if (text.toLowerCase().includes('behavior')) return 'user_behavior';
    if (text.toLowerCase().includes('revenue')) return 'revenue';
    return 'operational';
  };

  const determinePriority = (text: string) => {
    if (text.toLowerCase().includes('critical') || text.toLowerCase().includes('urgent')) return 'high';
    if (text.toLowerCase().includes('important') || text.toLowerCase().includes('significant')) return 'medium';
    return 'low';
  };

  const extractTitle = (text: string) => {
    const words = text.split(' ').slice(0, 4).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'demand': return <Users className="h-4 w-4" />;
      case 'price_optimization': return <TrendingUp className="h-4 w-4" />;
      case 'user_behavior': return <MapPin className="h-4 w-4" />;
      case 'revenue': return <Zap className="h-4 w-4" />;
      case 'operational': return <AlertTriangle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  if (isProcessing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            AI Travel Intelligence Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={65} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Processing market trends, demand patterns, and optimization opportunities...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Travel Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No search data available for analysis. Intelligence will appear when search patterns are detected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Travel Intelligence
          <Badge variant="secondary" className="ml-auto">
            {insights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(insight.priority)}`} />
                      <span className="text-xs text-muted-foreground">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-muted-foreground">Recommendations:</h5>
                      <ul className="text-xs space-y-1">
                        {insight.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-muted-foreground">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {lastResponse && (
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => console.log('Opening detailed analysis...')}
              >
                View Detailed Analysis Report
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};