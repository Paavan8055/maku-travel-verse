import React, { useState, useEffect, useMemo } from 'react';
import { Brain, TrendingUp, Clock, Users, MapPin, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUnifiedTravel } from '@/contexts/UnifiedTravelContext';

interface SearchInsight {
  id: string;
  type: 'price_trend' | 'demand' | 'weather' | 'events' | 'optimization' | 'bundle';
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: any;
}

interface EnhancedSearchIntelligenceProps {
  module: 'flights' | 'hotels' | 'activities' | 'transfers';
  destination?: string;
  dates?: { checkIn: Date; checkOut: Date };
  searchResults?: any[];
  className?: string;
}

export const EnhancedSearchIntelligence: React.FC<EnhancedSearchIntelligenceProps> = ({
  module,
  destination,
  dates,
  searchResults = [],
  className = ''
}) => {
  const { state, navigateToModule, createBundledSearch } = useUnifiedTravel();
  const [insights, setInsights] = useState<SearchInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate intelligent insights based on context
  const generateInsights = useMemo(() => {
    if (!destination || !dates) return [];

    const insights: SearchInsight[] = [];
    const now = new Date();
    const tripStart = dates.checkIn;
    const daysUntilTrip = Math.ceil((tripStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Price trend analysis
    if (module === 'flights' && daysUntilTrip > 14) {
      insights.push({
        id: 'price-trend-1',
        type: 'price_trend',
        priority: 'high',
        confidence: 87,
        title: 'Price Drop Expected',
        description: `Flight prices to ${destination} typically drop 15-20% about 8 weeks before departure.`,
        action: {
          label: 'Set Price Alert',
          onClick: () => console.log('Setting price alert...')
        }
      });
    }

    // Demand analysis
    if (searchResults.length > 0) {
      const avgPrice = searchResults.reduce((sum, item) => sum + (item.price || 0), 0) / searchResults.length;
      const highDemand = searchResults.length < 10;
      
      if (highDemand) {
        insights.push({
          id: 'demand-1',
          type: 'demand',
          priority: 'high',
          confidence: 92,
          title: 'High Demand Period',
          description: `Limited availability detected. Book soon to secure your preferred ${module}.`,
          action: {
            label: 'View Top Options',
            onClick: () => console.log('Showing top options...')
          }
        });
      }
    }

    // Weather impact
    if (state.weatherData) {
      const hasRain = state.weatherData.forecast.some(day => 
        day.condition.toLowerCase().includes('rain')
      );
      
      if (hasRain && module === 'activities') {
        insights.push({
          id: 'weather-1',
          type: 'weather',
          priority: 'medium',
          confidence: 75,
          title: 'Weather Considerations',
          description: 'Rain expected during your visit. Consider indoor activities or flexible cancellation policies.',
          action: {
            label: 'Show Indoor Options',
            onClick: () => console.log('Filtering indoor activities...')
          }
        });
      }
    }

    // Bundle optimization
    if (!state.bundlePreferences.includeFlights && module !== 'flights') {
      insights.push({
        id: 'bundle-1',
        type: 'bundle',
        priority: 'medium',
        confidence: 80,
        title: 'Bundle & Save',
        description: 'Save up to 25% by bundling flights with your hotel booking.',
        action: {
          label: 'Create Bundle',
          onClick: createBundledSearch
        }
      });
    }

    // Local events impact
    if (state.localEvents && state.localEvents.length > 0) {
      const highImpactEvents = state.localEvents.filter(event => event.impact === 'high');
      
      if (highImpactEvents.length > 0) {
        insights.push({
          id: 'events-1',
          type: 'events',
          priority: 'high',
          confidence: 95,
          title: 'Major Event Detected',
          description: `${highImpactEvents[0].name} is happening during your visit. Expect higher prices and crowds.`,
          action: {
            label: 'See Event Details',
            onClick: () => console.log('Showing event details...')
          }
        });
      }
    }

    // Cross-module suggestions
    if (module === 'hotels' && daysUntilTrip > 30) {
      insights.push({
        id: 'optimization-1',
        type: 'optimization',
        priority: 'low',
        confidence: 65,
        title: 'Flexible Dates',
        description: 'Shifting your dates by 1-2 days could save up to 30% on accommodation.',
        action: {
          label: 'Explore Dates',
          onClick: () => console.log('Opening date picker...')
        }
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence;
    });
  }, [destination, dates, searchResults, module, state]);

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      setInsights(generateInsights);
      setIsAnalyzing(false);
    }, 1200); // Simulate analysis time

    return () => clearTimeout(timer);
  }, [generateInsights]);

  const getInsightIcon = (type: SearchInsight['type']) => {
    switch (type) {
      case 'price_trend': return <TrendingUp className="h-4 w-4" />;
      case 'demand': return <Users className="h-4 w-4" />;
      case 'weather': return <MapPin className="h-4 w-4" />;
      case 'events': return <MapPin className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      case 'bundle': return <Brain className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: SearchInsight['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Analyzing Travel Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={33} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Processing market data, weather patterns, and demand trends...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Travel Intelligence
          <Badge variant="secondary" className="ml-auto">
            {insights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.slice(0, 3).map((insight) => (
            <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(insight.priority)}`} />
                      <span className="text-xs text-muted-foreground">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
              {insight.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={insight.action.onClick}
                  className="flex-shrink-0"
                >
                  {insight.action.label}
                </Button>
              )}
            </div>
          ))}
          
          {insights.length > 3 && (
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => console.log('Showing all insights...')}
            >
              View All {insights.length} Insights
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};