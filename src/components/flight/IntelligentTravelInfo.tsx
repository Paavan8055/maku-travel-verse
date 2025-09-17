import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Zap, 
  Thermometer,
  ChevronDown,
  ChevronUp,
  Edit2
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface TravelInsight {
  type: 'price-trend' | 'weather' | 'demand' | 'timing' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action?: string;
  icon: React.ReactNode;
}

interface IntelligentTravelInfoProps {
  origin: string;
  destination: string;
  departureDate?: Date;
  returnDate?: Date;
  passengers: number;
  tripType: string;
  onModify?: () => void;
  resultsCount?: number;
  searchContext?: {
    isBusinessTravel?: boolean;
    budgetRange?: [number, number];
    flexibility?: 'flexible' | 'fixed';
  };
}

export const IntelligentTravelInfo = ({
  origin,
  destination,
  departureDate,
  returnDate,
  passengers,
  tripType,
  onModify,
  resultsCount = 0,
  searchContext
}: IntelligentTravelInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [insights, setInsights] = useState<TravelInsight[]>([]);

  // Generate contextual insights
  useEffect(() => {
    const generatedInsights: TravelInsight[] = [];

    // Price trend insight
    if (departureDate) {
      const daysUntilDeparture = differenceInDays(departureDate, new Date());
      if (daysUntilDeparture > 30) {
        generatedInsights.push({
          type: 'price-trend',
          priority: 'medium',
          title: 'Early Bird Advantage',
          message: `Prices typically 15% lower than closer bookings`,
          icon: <TrendingUp className="h-4 w-4" />
        });
      } else if (daysUntilDeparture < 7) {
        generatedInsights.push({
          type: 'price-trend',
          priority: 'high',
          title: 'Price Alert',
          message: `Last-minute bookings - prices may be elevated`,
          action: 'Check flexible dates',
          icon: <AlertCircle className="h-4 w-4" />
        });
      }
    }

    // Weather insight
    if (destination.includes('Sydney')) {
      generatedInsights.push({
        type: 'weather',
        priority: 'low',
        title: 'Perfect Weather',
        message: `22°C and sunny - ideal travel conditions`,
        icon: <Thermometer className="h-4 w-4" />
      });
    }

    // Demand insight
    if (resultsCount > 50) {
      generatedInsights.push({
        type: 'demand',
        priority: 'medium',
        title: 'High Availability',
        message: `${resultsCount} options available - great selection`,
        icon: <Zap className="h-4 w-4" />
      });
    }

    // Business travel optimization
    if (searchContext?.isBusinessTravel) {
      generatedInsights.push({
        type: 'recommendation',
        priority: 'medium',
        title: 'Business Traveler',
        message: 'Consider morning departures for productivity',
        action: 'Filter by time',
        icon: <Clock className="h-4 w-4" />
      });
    }

    setInsights(generatedInsights.slice(0, 3)); // Limit to 3 insights
  }, [departureDate, destination, resultsCount, searchContext]);

  const highPriorityInsights = insights.filter(i => i.priority === 'high');
  const otherInsights = insights.filter(i => i.priority !== 'high');

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-destructive bg-destructive/5 text-destructive';
      case 'medium': return 'border-primary bg-primary/5 text-primary';
      default: return 'border-muted bg-muted/5 text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* Primary Information Layer */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-6">
            {/* Route Display */}
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg">{origin}</span>
                <div className="h-0.5 w-6 bg-primary rounded-full"></div>
                <span className="font-semibold text-lg">{destination}</span>
              </div>
            </div>
            
            {/* Date Display */}
            {departureDate && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {format(departureDate, "EEE, MMM dd")}
                  {tripType === "roundtrip" && returnDate && (
                    <span className="text-muted-foreground">
                      {" - "}
                      <span className="text-foreground">{format(returnDate, "EEE, MMM dd")}</span>
                    </span>
                  )}
                </span>
              </div>
            )}
            
            {/* Passengers */}
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {passengers} passenger{passengers > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          {onModify && (
            <Button variant="outline" onClick={onModify} size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Modify
            </Button>
          )}
        </div>

        {/* High Priority Insights - Always Visible */}
        {highPriorityInsights.length > 0 && (
          <div className="space-y-2 mb-3">
            {highPriorityInsights.map((insight, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  getInsightColor(insight.priority)
                )}
              >
                <div className="flex items-center space-x-2">
                  {insight.icon}
                  <div>
                    <span className="font-medium text-sm">{insight.title}</span>
                    <p className="text-xs opacity-80">{insight.message}</p>
                  </div>
                </div>
                {insight.action && (
                  <Button variant="ghost" size="sm" className="text-xs h-6">
                    {insight.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Results Summary with Expand Toggle */}
        {resultsCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-sm font-medium">
                {resultsCount} flights found
              </Badge>
              {otherInsights.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {otherInsights.length} insight{otherInsights.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {otherInsights.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    More insights
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Secondary Information Layer - Expandable */}
      {isExpanded && otherInsights.length > 0 && (
        <div className="border-t bg-muted/20 p-4 space-y-2">
          {otherInsights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-2 rounded border",
                getInsightColor(insight.priority)
              )}
            >
              <div className="flex items-center space-x-2">
                {insight.icon}
                <div>
                  <span className="font-medium text-sm">{insight.title}</span>
                  <p className="text-xs opacity-80">{insight.message}</p>
                </div>
              </div>
              {insight.action && (
                <Button variant="ghost" size="sm" className="text-xs h-6">
                  {insight.action}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};