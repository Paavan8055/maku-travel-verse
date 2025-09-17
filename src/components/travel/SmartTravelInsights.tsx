import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, MapPin, Clock, DollarSign, Users, ChevronRight } from 'lucide-react';
import { crossModuleContextManager } from '@/services/core/CrossModuleContextManager';
import { unifiedApiClient } from '@/services/core/UnifiedApiClient';

interface SmartInsight {
  type: 'weather' | 'crowd' | 'price' | 'availability' | 'cross_module' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SmartTravelInsightsProps {
  currentModule: 'flight' | 'hotel' | 'activity';
  destination?: string;
  searchParams?: any;
  className?: string;
}

export const SmartTravelInsights: React.FC<SmartTravelInsightsProps> = ({
  currentModule,
  destination,
  searchParams,
  className = ''
}) => {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [crossModuleData, setCrossModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadSmartInsights();
  }, [currentModule, destination, searchParams]);

  const loadSmartInsights = async () => {
    if (!destination) return;
    
    setLoading(true);
    try {
      // Get cross-module context
      const contextData = await crossModuleContextManager.getModuleContext(currentModule);
      setCrossModuleData(contextData);

      // Get smart suggestions
      const suggestions = await unifiedApiClient.getCrossModuleSuggestions(currentModule);
      
      // Generate insights based on current context and suggestions
      const generatedInsights = await generateIntelligentInsights(
        currentModule,
        destination,
        searchParams,
        contextData,
        suggestions
      );
      
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Failed to load smart insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateIntelligentInsights = async (
    module: 'flight' | 'hotel' | 'activity',
    dest: string,
    params: any,
    context: any,
    suggestions: any[]
  ): Promise<SmartInsight[]> => {
    const insights: SmartInsight[] = [];

    // Cross-module insights based on context
    if (context && context.modules.length > 1) {
      const otherModules = context.modules.filter((m: any) => m.moduleType !== module);
      
      insights.push({
        type: 'cross_module',
        title: 'Smart Package Opportunity',
        description: `You've searched for ${otherModules.map((m: any) => m.moduleType).join(' and ')}. Bundle deals available for ${dest}.`,
        confidence: 85,
        actionable: true,
        priority: 'high',
        icon: <Sparkles className="h-4 w-4 text-purple-500" />,
        action: {
          label: 'View Packages',
          onClick: () => console.log('Navigate to package deals')
        }
      });
    }

    // Seasonal insights
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 5 && currentMonth <= 8) { // Summer months
      insights.push({
        type: 'weather',
        title: 'Peak Season Advantage',
        description: 'Perfect weather conditions for outdoor activities. Book early for best availability.',
        confidence: 92,
        actionable: true,
        priority: 'high',
        icon: <TrendingUp className="h-4 w-4 text-yellow-500" />
      });
    }

    // Price intelligence
    insights.push({
      type: 'price',
      title: 'Dynamic Pricing Alert',
      description: `${module.charAt(0).toUpperCase() + module.slice(1)} prices for ${dest} are 12% below average this month.`,
      confidence: 78,
      actionable: true,
      priority: 'medium',
      icon: <DollarSign className="h-4 w-4 text-green-500" />
    });

    // Location-specific insights
    if (dest.toLowerCase().includes('sydney') || dest.toLowerCase().includes('melbourne')) {
      insights.push({
        type: 'availability',
        title: 'Local Event Impact',
        description: 'Major events in the area may affect availability. Consider booking flexible options.',
        confidence: 70,
        actionable: true,
        priority: 'medium',
        icon: <MapPin className="h-4 w-4 text-blue-500" />
      });
    }

    // Time-based insights
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      insights.push({
        type: 'recommendation',
        title: 'Optimal Booking Time',
        description: 'Business hours booking often provides better customer service response times.',
        confidence: 65,
        actionable: false,
        priority: 'low',
        icon: <Clock className="h-4 w-4 text-gray-500" />
      });
    }

    // Module-specific insights
    switch (module) {
      case 'activity':
        if (params?.participants > 4) {
          insights.push({
            type: 'recommendation',
            title: 'Group Booking Benefits',
            description: `Groups of ${params.participants} often qualify for discounts and private guide options.`,
            confidence: 88,
            actionable: true,
            priority: 'high',
            icon: <Users className="h-4 w-4 text-blue-500" />
          });
        }
        break;
      
      case 'hotel':
        if (context?.context?.dates) {
          const nights = Math.ceil(
            (new Date(context.context.dates.checkOut).getTime() - 
             new Date(context.context.dates.checkIn).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (nights >= 7) {
            insights.push({
              type: 'recommendation',
              title: 'Extended Stay Discounts',
              description: `${nights}-night stays often qualify for weekly discounts and complimentary services.`,
              confidence: 82,
              actionable: true,
              priority: 'medium',
              icon: <Clock className="h-4 w-4 text-purple-500" />
            });
          }
        }
        break;
      
      case 'flight':
        if (params?.returnDate) {
          const tripLength = Math.ceil(
            (new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (tripLength >= 14) {
            insights.push({
              type: 'recommendation',
              title: 'Long-haul Trip Optimization',
              description: 'Consider mid-week departures and flexible dates for better prices on extended trips.',
              confidence: 75,
              actionable: true,
              priority: 'medium',
              icon: <TrendingUp className="h-4 w-4 text-indigo-500" />
            });
          }
        }
        break;
    }

    // Add suggestion-based insights
    suggestions.forEach(suggestion => {
      insights.push({
        type: 'recommendation',
        title: suggestion.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: suggestion.suggestion,
        confidence: Math.round(suggestion.confidence * 100),
        actionable: true,
        priority: suggestion.confidence > 0.8 ? 'high' : 'medium',
        icon: <Sparkles className="h-4 w-4 text-purple-500" />
      });
    });

    // Sort by priority and confidence
    return insights
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.confidence - a.confidence;
      })
      .slice(0, expanded ? 8 : 3);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className={`${className} border-l-4 border-l-purple-500`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Smart Travel Insights
          <Badge variant="outline" className="text-xs ml-2">
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getConfidenceColor(insight.confidence)} transition-all hover:shadow-sm`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5 opacity-80">
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-sm truncate">
                      {insight.title}
                    </h4>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {insight.confidence}%
                    </Badge>
                    <Badge className={`text-xs shrink-0 ${getPriorityColor(insight.priority)}`}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                  
                  {insight.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insight.action.onClick}
                      className="mt-2 h-6 px-2 text-xs"
                    >
                      {insight.action.label}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {!expanded && insights.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="w-full mt-2 text-xs"
          >
            Show More Insights
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}

        {/* Cross-module context summary */}
        {crossModuleData && crossModuleData.modules.length > 1 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" />
              <span>Connected Search Context</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {crossModuleData.modules.map((module: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {module.moduleType}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartTravelInsights;