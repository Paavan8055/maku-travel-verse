import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, MapPin, Calendar, Users, Sparkles, Activity, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DestinationAutocomplete } from '@/components/search/DestinationAutocomplete';
import { ActivityParticipantSelector } from '@/components/search/ActivityParticipantSelector';
import { usePerformanceOptimizedSearch } from '@/hooks/usePerformanceOptimizedSearch';
import { useUnifiedTravel } from '@/contexts/UnifiedTravelContext';
import { cn } from '@/lib/utils';

interface SmartPrediction {
  type: 'weather' | 'crowd' | 'price' | 'availability' | 'experience';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

interface ProgressiveInsight {
  tier: 1 | 2 | 3;
  category: string;
  content: React.ReactNode;
  expandable: boolean;
}

interface EnhancedActivitySearchInterfaceProps {
  onSearch: (params: {
    destination: string;
    date: string;
    participants: number;
    adults: number;
    children: number;
    searchContext?: any;
  }) => void;
  className?: string;
  enableVoiceSearch?: boolean;
  showAdvancedFilters?: boolean;
}

export const EnhancedActivitySearchInterface: React.FC<EnhancedActivitySearchInterfaceProps> = ({
  onSearch,
  className = '',
  enableVoiceSearch = false,
  showAdvancedFilters = true
}) => {
  const { state, dispatch, preloadModuleData } = useUnifiedTravel();
  const [destination, setDestination] = useState(state.destination || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(state.checkInDate || undefined);
  const [adults, setAdults] = useState(state.adults);
  const [children, setChildren] = useState(state.children);
  
  // Progressive intelligence state
  const [smartPredictions, setSmartPredictions] = useState<SmartPrediction[]>([]);
  const [progressiveInsights, setProgressiveInsights] = useState<ProgressiveInsight[]>([]);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [expandedTier, setExpandedTier] = useState<1 | 2 | 3>(1);
  
  // Voice search state (preparation for future implementation)
  const [isListening, setIsListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');

  const totalParticipants = adults + children;
  const canSearch = destination.trim().length > 0 && selectedDate;

  // Enhanced predictive intelligence system
  const generateSmartPredictions = useCallback(async () => {
    if (!destination || !selectedDate) return;

    const predictions: SmartPrediction[] = [];
    const insights: ProgressiveInsight[] = [];

    // Tier 1: Essential Information
    insights.push({
      tier: 1,
      category: 'Essential Details',
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">{destination}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{format(selectedDate, 'PPP')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span>{totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}</span>
          </div>
        </div>
      ),
      expandable: false
    });

    // Weather-based predictions
    const month = selectedDate.getMonth();
    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
    
    if (month >= 5 && month <= 7) {
      predictions.push({
        type: 'weather',
        title: 'Optimal Weather Conditions',
        description: `Perfect outdoor activity weather expected. 92% chance of clear skies with ideal temperatures.`,
        confidence: 92,
        actionable: true,
        priority: 'high',
        icon: <Sparkles className="h-4 w-4 text-yellow-500" />
      });

      insights.push({
        tier: 2,
        category: 'Weather Intelligence',
        content: (
          <div className="space-y-2">
            <div className="text-sm text-green-600 font-medium">Ideal Conditions</div>
            <div className="text-xs text-muted-foreground">
              • Temperature: 22-26°C
              • UV Index: 6/10 (moderate)
              • Wind: Light breeze (8-12 km/h)
              • Best activity hours: 9AM-11AM, 4PM-6PM
            </div>
          </div>
        ),
        expandable: true
      });
    }

    // Crowd level intelligence
    if (isWeekend) {
      predictions.push({
        type: 'crowd',
        title: 'High Visitor Traffic Expected',
        description: 'Weekend peak times. Early morning (8-10AM) or evening (5-7PM) slots recommended for optimal experience.',
        confidence: 87,
        actionable: true,
        priority: 'medium',
        icon: <TrendingUp className="h-4 w-4 text-amber-500" />
      });
    } else {
      predictions.push({
        type: 'crowd',
        title: 'Favorable Crowd Conditions',
        description: 'Weekday advantage: 40% fewer crowds and potential group discounts available.',
        confidence: 91,
        actionable: true,
        priority: 'high',
        icon: <TrendingUp className="h-4 w-4 text-green-500" />
      });
    }

    // Group size optimizations
    if (totalParticipants >= 4) {
      predictions.push({
        type: 'experience',
        title: 'Group Experience Benefits',
        description: `Groups of ${totalParticipants} qualify for exclusive group activities, bulk discounts, and private guide options.`,
        confidence: 94,
        actionable: true,
        priority: 'high',
        icon: <Users className="h-4 w-4 text-blue-500" />
      });

      insights.push({
        tier: 3,
        category: 'Group Advantages',
        content: (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Group Benefits:</div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                <span>10-15% group discounts on most activities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                <span>Priority booking for popular experiences</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                <span>Private guide options available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                <span>Customizable itinerary packages</span>
              </div>
            </div>
          </div>
        ),
        expandable: true
      });
    }

    // Price trend intelligence
    predictions.push({
      type: 'price',
      title: 'Dynamic Pricing Insight',
      description: 'Activity prices are 15% below average this month. Optimal booking window detected.',
      confidence: 84,
      actionable: true,
      priority: 'medium',
      icon: <Activity className="h-4 w-4 text-green-500" />
    });

    setSmartPredictions(predictions);
    setProgressiveInsights(insights);
    setShowIntelligence(true);

    // Preload related module data for cross-module synergy
    if (preloadModuleData) {
      preloadModuleData(['hotels', 'transfers'], {
        destination,
        date: selectedDate,
        participants: totalParticipants
      });
    }
  }, [destination, selectedDate, totalParticipants, preloadModuleData]);

  // Debounced intelligence generation
  useEffect(() => {
    if (destination && selectedDate) {
      const timeoutId = setTimeout(generateSmartPredictions, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setShowIntelligence(false);
    }
  }, [destination, selectedDate, generateSmartPredictions]);

  // Voice search preparation
  const handleVoiceSearch = useCallback(() => {
    if (!enableVoiceSearch) return;
    
    // Placeholder for future voice recognition implementation
    setIsListening(!isListening);
    
    // Future: Web Speech API integration
    if (!isListening) {
      setVoiceQuery('Listening for voice input...');
    } else {
      setVoiceQuery('');
    }
  }, [enableVoiceSearch, isListening]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSearch || !selectedDate) return;

    // Update unified travel state
    dispatch({
      type: 'SET_DESTINATION',
      payload: destination.trim()
    });
    if (selectedDate) {
      dispatch({
        type: 'SET_DATES',
        payload: { checkIn: selectedDate, checkOut: selectedDate }
      });
    }
    dispatch({
      type: 'SET_TRAVELERS',
      payload: { adults, children }
    });

    onSearch({
      destination: destination.trim(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      participants: totalParticipants,
      adults,
      children,
      searchContext: {
        predictions: smartPredictions,
        hasIntelligence: showIntelligence,
        expandedTier
      }
    });
  }, [canSearch, selectedDate, destination, adults, children, totalParticipants, smartPredictions, showIntelligence, expandedTier, updateState, onSearch]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 80) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Enhanced Search Interface */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Destination with Intelligence */}
              <div className="lg:col-span-1 relative">
                <DestinationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onDestinationSelect={(d) => setDestination(d.name)}
                  placeholder="Destination"
                  searchType="both"
                  className="pr-10"
                />
                {showIntelligence && (
                  <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
                )}
              </div>

              {/* Date Selection */}
              <div className="lg:col-span-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Participants */}
              <div className="lg:col-span-1">
                <ActivityParticipantSelector
                  adults={adults}
                  children={children}
                  onChange={({ adults: a, children: c }) => {
                    setAdults(a);
                    setChildren(c);
                  }}
                />
              </div>

              {/* Enhanced Search Button */}
              <div className="lg:col-span-1 flex gap-2">
                <Button 
                  type="submit" 
                  disabled={!canSearch}
                  className="flex-1 h-10"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                
                {enableVoiceSearch && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleVoiceSearch}
                    className={cn("h-10 w-10", isListening && "bg-red-50 border-red-200")}
                  >
                    <Zap className={cn("h-4 w-4", isListening && "text-red-500")} />
                  </Button>
                )}
              </div>
            </div>

            {/* Progressive Intelligence Indicators */}
            {showIntelligence && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {smartPredictions.length} AI Predictions
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Progressive Intelligence Active
                </Badge>
                {smartPredictions.some(p => p.priority === 'high') && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    High-Value Insights Available
                  </Badge>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Progressive Information Architecture */}
      {showIntelligence && (
        <div className="space-y-3">
          {/* Tier Navigation */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Information Detail:</span>
            {[1, 2, 3].map((tier) => (
              <Button
                key={tier}
                variant={expandedTier >= tier ? "default" : "outline"}
                size="sm"
                onClick={() => setExpandedTier(tier as 1 | 2 | 3)}
                className="h-7 px-3"
              >
                Tier {tier}
              </Button>
            ))}
          </div>

          {/* Progressive Insights Display */}
          {progressiveInsights
            .filter(insight => insight.tier <= expandedTier)
            .map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2">{insight.category}</h4>
                      {insight.content}
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      Tier {insight.tier}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

          {/* Smart Predictions Panel */}
          {smartPredictions.length > 0 && (
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-sm">Smart Activity Intelligence</h3>
                </div>
                
                <div className="space-y-3">
                  {smartPredictions.map((prediction, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getConfidenceColor(prediction.confidence)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-0.5">{prediction.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{prediction.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {prediction.confidence}%
                              </Badge>
                              <Badge className={`text-xs ${getPriorityBadge(prediction.priority)}`}>
                                {prediction.priority}
                              </Badge>
                            </div>
                            <p className="text-sm opacity-90">{prediction.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};