import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Star,
  Lightbulb,
  Target,
  Filter,
  BarChart3
} from 'lucide-react';

interface SmartRecommendation {
  flight: any;
  type: 'best_value' | 'time_saver' | 'high_demand' | 'price_drop';
  reason: string;
  confidence: number;
  savings?: number;
  timeReduction?: number;
}

interface IntelligentSearchControlsProps {
  sortingMode: string;
  onSortingChange: (mode: string) => void;
  recommendations: SmartRecommendation[];
  isIntelligentMode: boolean;
  onIntelligentModeToggle: (enabled: boolean) => void;
  userContext?: {
    tripPurpose?: 'business' | 'leisure' | 'family';
    priceFlexibility?: 'budget' | 'moderate' | 'premium';
  };
  onContextUpdate?: (context: any) => void;
  resultsCount: number;
  loading?: boolean;
}

export const IntelligentSearchControls = ({
  sortingMode,
  onSortingChange,
  recommendations,
  isIntelligentMode,
  onIntelligentModeToggle,
  userContext,
  onContextUpdate,
  resultsCount,
  loading = false
}: IntelligentSearchControlsProps) => {
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [smartFiltersActive, setSmartFiltersActive] = useState(false);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'best_value': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'time_saver': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'high_demand': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'price_drop': return <Star className="h-4 w-4 text-purple-600" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'best_value': return 'bg-green-50 border-green-200 text-green-800';
      case 'time_saver': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'high_demand': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'price_drop': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Intelligent Controls Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Smart Flight Assistant
              <Badge variant="secondary" className="ml-2">
                {resultsCount} results
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">AI Powered</span>
                <Switch
                  checked={isIntelligentMode}
                  onCheckedChange={onIntelligentModeToggle}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Context-Aware Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Sort Strategy</label>
              <Select value={sortingMode} onValueChange={onSortingChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intelligent">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Intelligent Ranking
                    </div>
                  </SelectItem>
                  <SelectItem value="price">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Best Price
                    </div>
                  </SelectItem>
                  <SelectItem value="duration">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Shortest Duration
                    </div>
                  </SelectItem>
                  <SelectItem value="departure">Departure Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trip Context */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Trip Purpose</label>
              <Select 
                value={userContext?.tripPurpose || 'leisure'} 
                onValueChange={(purpose) => onContextUpdate?.({ ...userContext, tripPurpose: purpose })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Travel</SelectItem>
                  <SelectItem value="leisure">Leisure</SelectItem>
                  <SelectItem value="family">Family Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Flexibility */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Budget Flexibility</label>
              <Select 
                value={userContext?.priceFlexibility || 'moderate'} 
                onValueChange={(flexibility) => onContextUpdate?.({ ...userContext, priceFlexibility: flexibility })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget Conscious</SelectItem>
                  <SelectItem value="moderate">Balanced</SelectItem>
                  <SelectItem value="premium">Premium Options</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Smart Filters Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Auto-Apply Smart Filters</span>
              <Badge variant="outline" className="text-xs">Beta</Badge>
            </div>
            <Switch
              checked={smartFiltersActive}
              onCheckedChange={setSmartFiltersActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {isIntelligentMode && recommendations.length > 0 && showRecommendations && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Smart Recommendations
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRecommendations(false)}
                className="text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getRecommendationColor(rec.type)}`}
              >
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm capitalize">
                        {rec.type.replace('_', ' ')}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(rec.confidence * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rec.reason}
                    </p>
                    {(rec.savings || rec.timeReduction) && (
                      <div className="flex items-center gap-3 text-xs">
                        {rec.savings && (
                          <span className="text-green-600 font-medium">
                            Save ${rec.savings}
                          </span>
                        )}
                        {rec.timeReduction && (
                          <span className="text-blue-600 font-medium">
                            Save {rec.timeReduction}min
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      {isIntelligentMode && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Intelligent sorting optimized for your preferences
                </span>
              </div>
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">
                    Analyzing options...
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};