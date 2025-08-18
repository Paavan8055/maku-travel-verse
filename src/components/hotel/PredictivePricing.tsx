import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PricePoint {
  date: string;
  price: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  demandLevel: 'low' | 'medium' | 'high';
}

interface PricePrediction {
  hotelId: string;
  currentPrice: number;
  predictedPrices: PricePoint[];
  optimalBookingWindow: {
    start: string;
    end: string;
    expectedSavings: number;
  };
  recommendation: {
    action: 'wait' | 'book_now' | 'book_soon';
    reason: string;
    confidence: number;
  };
}

interface PredictivePricingProps {
  hotelId: string;
  currentPrice: number;
  checkInDate: string;
  className?: string;
}

export const PredictivePricing: React.FC<PredictivePricingProps> = ({
  hotelId,
  currentPrice,
  checkInDate,
  className = ""
}) => {
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const generatePrediction = (): PricePrediction => {
    const checkIn = new Date(checkInDate);
    const today = new Date();
    const daysUntilCheckIn = Math.floor((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate price predictions for the next 30 days or until check-in
    const predictionDays = Math.min(30, daysUntilCheckIn);
    const predictedPrices: PricePoint[] = [];
    
    for (let i = 1; i <= predictionDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Simulate price patterns based on booking patterns and demand
      let priceMultiplier = 1;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let demandLevel: 'low' | 'medium' | 'high' = 'medium';
      
      // Seasonal patterns
      const month = date.getMonth();
      const isHighSeason = month === 11 || month === 0 || month === 1; // Dec, Jan, Feb
      if (isHighSeason) {
        priceMultiplier *= 1.2;
        demandLevel = 'high';
      }
      
      // Weekend patterns
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
        priceMultiplier *= 1.15;
        demandLevel = demandLevel === 'medium' ? 'high' : 'high';
      }
      
      // Advance booking patterns
      const daysFromToday = i;
      if (daysFromToday < 7) {
        // Last minute - prices usually higher
        priceMultiplier *= 1.1;
        trend = 'up';
      } else if (daysFromToday > 21) {
        // Far in advance - more stable
        priceMultiplier *= 0.95;
        trend = 'down';
      }
      
      // Add some randomness for market volatility
      const volatility = 0.1 * Math.random() - 0.05; // ±5%
      priceMultiplier += volatility;
      
      const predictedPrice = Math.round(currentPrice * priceMultiplier);
      const confidence = Math.max(60, Math.min(95, 90 - (i * 2))); // Confidence decreases over time
      
      // Determine trend
      if (i > 1) {
        const prevPrice = predictedPrices[i - 2].price;
        const priceDiff = (predictedPrice - prevPrice) / prevPrice;
        if (priceDiff > 0.03) trend = 'up';
        else if (priceDiff < -0.03) trend = 'down';
        else trend = 'stable';
      }
      
      predictedPrices.push({
        date: date.toISOString().split('T')[0],
        price: predictedPrice,
        confidence,
        trend,
        demandLevel
      });
    }
    
    // Find optimal booking window
    const lowestPricePoint = predictedPrices.reduce((min, point) => 
      point.price < min.price ? point : min, predictedPrices[0]);
    
    const optimalBookingWindow = {
      start: lowestPricePoint.date,
      end: new Date(new Date(lowestPricePoint.date).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expectedSavings: currentPrice - lowestPricePoint.price
    };
    
    // Generate recommendation
    let recommendation: PricePrediction['recommendation'];
    const avgFuturePrice = predictedPrices.reduce((sum, p) => sum + p.price, 0) / predictedPrices.length;
    const priceIncreaseLikely = avgFuturePrice > currentPrice * 1.05;
    
    if (optimalBookingWindow.expectedSavings > currentPrice * 0.1 && daysUntilCheckIn > 14) {
      recommendation = {
        action: 'wait',
        reason: `Prices expected to drop by $${optimalBookingWindow.expectedSavings} around ${new Date(lowestPricePoint.date).toLocaleDateString()}`,
        confidence: lowestPricePoint.confidence
      };
    } else if (priceIncreaseLikely) {
      recommendation = {
        action: 'book_now',
        reason: 'Prices are expected to increase based on demand patterns',
        confidence: 85
      };
    } else {
      recommendation = {
        action: 'book_soon',
        reason: 'Prices are relatively stable, book when convenient',
        confidence: 75
      };
    }
    
    return {
      hotelId,
      currentPrice,
      predictedPrices,
      optimalBookingWindow,
      recommendation
    };
  };

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setPrediction(generatePrediction());
      setIsLoading(false);
    }, 1500);
  }, [hotelId, currentPrice, checkInDate]);

  if (isLoading) {
    return (
      <Card className={`travel-card ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Analyzing price trends...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) return null;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'book_now': return 'bg-red-100 text-red-800 border-red-200';
      case 'wait': return 'bg-green-100 text-green-800 border-green-200';
      case 'book_soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'book_now': return <AlertTriangle className="h-4 w-4" />;
      case 'wait': return <Clock className="h-4 w-4" />;
      case 'book_soon': return <CheckCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-600" />;
      default: return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <Card className={`travel-card ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          AI Price Forecast
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Recommendation */}
        <Card className={`border ${getActionColor(prediction.recommendation.action)}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              {getActionIcon(prediction.recommendation.action)}
              <div className="flex-1">
                <h3 className="font-semibold capitalize">
                  {prediction.recommendation.action.replace('_', ' ')}
                </h3>
                <p className="text-sm mt-1">{prediction.recommendation.reason}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs">Confidence:</span>
                  <Progress 
                    value={prediction.recommendation.confidence} 
                    className="h-2 w-20 ml-2" 
                  />
                  <span className="text-xs ml-2">{prediction.recommendation.confidence}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimal Booking Window */}
        {prediction.optimalBookingWindow.expectedSavings > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Optimal Booking Window</h4>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {new Date(prediction.optimalBookingWindow.start).toLocaleDateString()} - 
                  {new Date(prediction.optimalBookingWindow.end).toLocaleDateString()}
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Save ${prediction.optimalBookingWindow.expectedSavings}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Price Trend Preview */}
        <div className="space-y-2">
          <h4 className="font-medium">7-Day Price Trend</h4>
          <div className="space-y-2">
            {prediction.predictedPrices.slice(0, 7).map((point, index) => (
              <div key={point.date} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">
                    {new Date(point.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  {getTrendIcon(point.trend)}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      point.demandLevel === 'high' ? 'border-red-200 text-red-800' :
                      point.demandLevel === 'medium' ? 'border-yellow-200 text-yellow-800' :
                      'border-green-200 text-green-800'
                    }`}
                  >
                    {point.demandLevel} demand
                  </Badge>
                  <span className="font-medium">${point.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Predictions based on historical data, seasonal patterns, and market demand. 
          Actual prices may vary and are subject to availability.
        </p>
      </CardContent>
    </Card>
  );
};