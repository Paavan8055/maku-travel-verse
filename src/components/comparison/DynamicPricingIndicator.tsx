import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Clock, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceTrend {
  date: string;
  price: number;
  demand: 'low' | 'medium' | 'high';
  prediction: 'increase' | 'decrease' | 'stable';
  confidence: number; // 0-100
}

interface DynamicPricingIndicatorProps {
  currentPrice: number;
  currency: string;
  trends: PriceTrend[];
  demandLevel: 'low' | 'medium' | 'high';
  priceChangeToday: number;
  priceChangeWeek: number;
  lastBookedMinutes?: number;
  roomsLeft?: number;
  onPriceAlert?: (enabled: boolean) => void;
}

export const DynamicPricingIndicator: React.FC<DynamicPricingIndicatorProps> = ({
  currentPrice,
  currency,
  trends,
  demandLevel,
  priceChangeToday,
  priceChangeWeek,
  lastBookedMinutes,
  roomsLeft,
  onPriceAlert
}) => {
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatPercentage = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDemandText = (demand: string) => {
    switch (demand) {
      case 'high': return 'High Demand';
      case 'medium': return 'Moderate Demand';
      case 'low': return 'Low Demand';
      default: return 'Unknown';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'increase': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decrease': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNextPrediction = () => {
    const tomorrow = trends.find(t => {
      const trendDate = new Date(t.date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return trendDate.toDateString() === tomorrow.toDateString();
    });
    return tomorrow;
  };

  const getWeekPrediction = () => {
    const nextWeek = trends.slice(1, 8); // Next 7 days
    const avgPrice = nextWeek.reduce((sum, t) => sum + t.price, 0) / nextWeek.length;
    const priceChange = ((avgPrice - currentPrice) / currentPrice) * 100;
    
    return {
      avgPrice,
      priceChange,
      trend: priceChange > 2 ? 'increase' : priceChange < -2 ? 'decrease' : 'stable'
    };
  };

  const nextPrediction = getNextPrediction();
  const weekPrediction = getWeekPrediction();

  const handlePriceAlert = () => {
    const newState = !priceAlertEnabled;
    setPriceAlertEnabled(newState);
    onPriceAlert?.(newState);
  };

  const getUrgencyMessage = () => {
    if (roomsLeft && roomsLeft <= 3) {
      return `Only ${roomsLeft} rooms left at this price`;
    }
    if (lastBookedMinutes && lastBookedMinutes <= 60) {
      return `Last booked ${lastBookedMinutes} minutes ago`;
    }
    if (demandLevel === 'high' && priceChangeToday > 0) {
      return 'Prices rising due to high demand';
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Current Price & Trend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(currentPrice)}
              </div>
              <div className="text-sm text-muted-foreground">per night</div>
            </div>
            
            <div className="text-right space-y-1">
              <div className={cn(
                "flex items-center gap-1 text-sm",
                priceChangeToday >= 0 ? "text-red-600" : "text-green-600"
              )}>
                {priceChangeToday >= 0 ? 
                  <TrendingUp className="h-4 w-4" /> : 
                  <TrendingDown className="h-4 w-4" />
                }
                {formatPercentage(priceChangeToday)} today
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs",
                priceChangeWeek >= 0 ? "text-red-500" : "text-green-500"
              )}>
                {priceChangeWeek >= 0 ? 
                  <TrendingUp className="h-3 w-3" /> : 
                  <TrendingDown className="h-3 w-3" />
                }
                {formatPercentage(priceChangeWeek)} this week
              </div>
            </div>
          </div>

          {/* Demand Level */}
          <div className="mt-3">
            <Badge className={cn("text-xs", getDemandColor(demandLevel))}>
              <Users className="h-3 w-3 mr-1" />
              {getDemandText(demandLevel)}
            </Badge>
          </div>

          {/* Urgency Message */}
          {getUrgencyMessage() && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
              ⚠️ {getUrgencyMessage()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Predictions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Price Predictions
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrediction(!showPrediction)}
            >
              {showPrediction ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Tomorrow */}
            {nextPrediction && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Tomorrow</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(nextPrediction.price)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getPredictionIcon(nextPrediction.prediction)}
                  <span className="text-xs">
                    {nextPrediction.confidence}% confident
                  </span>
                </div>
              </div>
            )}

            {/* Next Week */}
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm font-medium">Next 7 days</div>
                <div className="text-xs text-muted-foreground">
                  Avg {formatPrice(weekPrediction.avgPrice)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getPredictionIcon(weekPrediction.trend)}
                <span className="text-xs">
                  {formatPercentage(weekPrediction.priceChange)}
                </span>
              </div>
            </div>
          </div>

          {showPrediction && (
            <div className="mt-4 space-y-2">
              <h5 className="text-sm font-medium">7-Day Trend</h5>
              <div className="grid grid-cols-7 gap-1">
                {trends.slice(0, 7).map((trend, index) => (
                  <div key={index} className="text-center p-2 rounded bg-muted/20">
                    <div className="text-xs text-muted-foreground">
                      {new Date(trend.date).toLocaleDateString('en-AU', { weekday: 'short' })}
                    </div>
                    <div className="text-xs font-medium">
                      {formatPrice(trend.price)}
                    </div>
                    <div className="flex justify-center mt-1">
                      {getPredictionIcon(trend.prediction)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Alert */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Price Alerts
              </h4>
              <p className="text-sm text-muted-foreground">
                Get notified when prices drop
              </p>
            </div>
            <Button
              variant={priceAlertEnabled ? "default" : "outline"}
              size="sm"
              onClick={handlePriceAlert}
            >
              {priceAlertEnabled ? 'Enabled' : 'Enable'}
            </Button>
          </div>

          {priceAlertEnabled && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                ✅ You'll be notified if prices drop below {formatPrice(currentPrice * 0.9)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Recommendation */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booking Recommendation
            </h4>
            
            {demandLevel === 'high' && weekPrediction.priceChange > 5 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800 font-medium">
                  🔥 Book Now Recommended
                </div>
                <div className="text-xs text-red-700 mt-1">
                  High demand and prices expected to rise {formatPercentage(weekPrediction.priceChange)} next week
                </div>
              </div>
            )}

            {demandLevel === 'low' && weekPrediction.priceChange < -5 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800 font-medium">
                  ⏰ Consider Waiting
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Prices may drop {formatPercentage(Math.abs(weekPrediction.priceChange))} next week
                </div>
              </div>
            )}

            {demandLevel === 'medium' && Math.abs(weekPrediction.priceChange) < 3 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800 font-medium">
                  📊 Stable Pricing
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Prices expected to remain stable. Book when convenient.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};