import React, { useState, useEffect } from 'react';
import { Calendar, Users, Search, Sparkles, Activity, TrendingUp, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DestinationAutocomplete } from '@/components/search/DestinationAutocomplete';
import { ActivityParticipantSelector } from '@/components/search/ActivityParticipantSelector';
import { cn } from '@/lib/utils';

interface ActivityPrediction {
  type: 'weather_optimal' | 'crowd_forecast' | 'seasonal_activity' | 'group_recommendation';
  message: string;
  confidence: number;
  actionable?: boolean;
}

interface SmartActivitySuggestion {
  category: string;
  activities: string[];
  reason: string;
}

interface IntelligentActivitySearchFormProps {
  onSearch: (params: {
    destination: string;
    date: string;
    participants: number;
    adults: number;
    children: number;
  }) => void;
  className?: string;
}

export const IntelligentActivitySearchForm: React.FC<IntelligentActivitySearchFormProps> = ({
  onSearch,
  className = ''
}) => {
  const [destination, setDestination] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [predictions, setPredictions] = useState<ActivityPrediction[]>([]);
  const [suggestions, setSuggestions] = useState<SmartActivitySuggestion[]>([]);
  const [showIntelligence, setShowIntelligence] = useState(false);

  const totalParticipants = adults + children;
  const canSearch = destination.trim().length > 0 && selectedDate;

  // Generate intelligent predictions and suggestions
  useEffect(() => {
    if (destination && selectedDate) {
      const generateIntelligence = async () => {
        // Simulate AI-powered activity intelligence
        const newPredictions: ActivityPrediction[] = [];
        const newSuggestions: SmartActivitySuggestion[] = [];

        // Weather-based predictions
        const month = selectedDate.getMonth();
        if (month >= 5 && month <= 7) { // Summer months
          newPredictions.push({
            type: 'weather_optimal',
            message: 'Perfect weather for outdoor adventures! 85% chance of clear skies.',
            confidence: 89,
            actionable: true
          });

          newSuggestions.push({
            category: 'Water Activities',
            activities: ['Snorkeling', 'Kayaking', 'Beach Volleyball', 'Surfing Lessons'],
            reason: 'Ideal summer conditions for water sports'
          });
        } else if (month >= 2 && month <= 4) { // Spring
          newPredictions.push({
            type: 'seasonal_activity',
            message: 'Spring season offers perfect hiking weather and blooming landscapes.',
            confidence: 92,
            actionable: true
          });
        }

        // Crowd predictions
        const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
        if (isWeekend) {
          newPredictions.push({
            type: 'crowd_forecast',
            message: 'Weekend crowds expected. Book early morning slots for better experience.',
            confidence: 87,
            actionable: true
          });
        } else {
          newPredictions.push({
            type: 'crowd_forecast',
            message: 'Weekday advantage: 40% fewer crowds and potential discounts available.',
            confidence: 91,
            actionable: true
          });
        }

        // Group size recommendations
        if (totalParticipants >= 4) {
          newPredictions.push({
            type: 'group_recommendation',
            message: `Group of ${totalParticipants} qualifies for group discounts and exclusive experiences.`,
            confidence: 94,
            actionable: true
          });

          newSuggestions.push({
            category: 'Group Adventures',
            activities: ['Team Building Challenges', 'Group Cooking Classes', 'Private Tours', 'Adventure Racing'],
            reason: 'Optimized for groups of 4+ participants'
          });
        }

        if (children > 0) {
          newSuggestions.push({
            category: 'Family-Friendly',
            activities: ['Zoo Experiences', 'Interactive Museums', 'Easy Nature Walks', 'Hands-on Workshops'],
            reason: 'Safe and engaging for children'
          });
        }

        // Destination-specific intelligence
        if (destination.toLowerCase().includes('sydney') || destination.toLowerCase().includes('beach')) {
          newSuggestions.push({
            category: 'Coastal Adventures',
            activities: ['Harbour Bridge Climb', 'Whale Watching', 'Coastal Walks', 'Ferry Tours'],
            reason: 'Unique coastal location experiences'
          });
        }

        setPredictions(newPredictions);
        setSuggestions(newSuggestions);
        setShowIntelligence(true);
      };

      const timeoutId = setTimeout(generateIntelligence, 600);
      return () => clearTimeout(timeoutId);
    } else {
      setShowIntelligence(false);
    }
  }, [destination, selectedDate, totalParticipants, children]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSearch || !selectedDate) return;

    onSearch({
      destination: destination.trim(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      participants: totalParticipants,
      adults,
      children
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 80) return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="border-2 border-green-500/20">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Destination */}
              <div className="lg:col-span-1">
                <DestinationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onDestinationSelect={(d) => setDestination(d.name)}
                  placeholder="Where to explore?"
                  searchType="both"
                />
              </div>

              {/* Date Selection */}
              <div className="lg:col-span-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
                      className="pointer-events-auto"
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

              {/* Search Button */}
              <div className="lg:col-span-1">
                <Button 
                  type="submit" 
                  disabled={!canSearch}
                  className="w-full h-10"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Explore Activities
                </Button>
              </div>
            </div>

            {/* Intelligence Indicators */}
            {showIntelligence && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Predictions Available
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  {suggestions.length} Smart Suggestions
                </Badge>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* AI Predictions Panel */}
      {showIntelligence && predictions.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-sm">Activity Intelligence</h3>
            </div>
            
            <div className="space-y-3">
              {predictions.map((prediction, index) => (
                <div key={index} className={`p-3 rounded-lg ${getConfidenceColor(prediction.confidence)}`}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm flex-1">{prediction.message}</p>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant="outline" className="text-xs">
                        {prediction.confidence}% confidence
                      </Badge>
                      {prediction.actionable && (
                        <Badge variant="secondary" className="text-xs">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Activity Suggestions */}
      {showIntelligence && suggestions.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Recommended Activity Categories</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-semibold text-sm text-blue-800 mb-1">{suggestion.category}</h4>
                  <p className="text-xs text-blue-600 mb-2">{suggestion.reason}</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.activities.slice(0, 3).map((activity, actIndex) => (
                      <Badge key={actIndex} variant="secondary" className="text-xs">
                        {activity}
                      </Badge>
                    ))}
                    {suggestion.activities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{suggestion.activities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};