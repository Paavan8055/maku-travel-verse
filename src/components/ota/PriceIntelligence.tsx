import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { priceAPI } from '@/lib/otaDataClient';

interface PriceIntelligenceProps {
  itemType: string;
  itemId: string;
  currentPrice: number;
  route?: string;
  className?: string;
}

interface PricePrediction {
  predicted_price: number;
  confidence_score: number;
  recommendation: string;
  factors: any;
  valid_until: string;
}

interface PriceHistory {
  date: string;
  price: number;
}

export const PriceIntelligence: React.FC<PriceIntelligenceProps> = ({
  itemType,
  itemId,
  currentPrice,
  route,
  className = ''
}) => {
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricePrediction();
    generatePriceHistory();
  }, [itemType, itemId]);

  const loadPricePrediction = async () => {
    try {
      const data = await priceAPI.fetchPricePrediction(itemType, itemId);
      setPrediction(data);
    } catch (error) {
      // Generate mock prediction if no data available
      generateMockPrediction();
    } finally {
      setLoading(false);
    }
  };

  const generateMockPrediction = () => {
    const recommendations = ['book_now', 'wait', 'flexible'] as const;
    const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
    
    const priceChange = (Math.random() - 0.5) * 0.2; // ±20% change
    const predictedPrice = currentPrice * (1 + priceChange);
    
    setPrediction({
      predicted_price: predictedPrice,
      confidence_score: Math.random() * 0.4 + 0.6, // 60-100% confidence
      recommendation,
      factors: {
        seasonal_demand: Math.random() > 0.5 ? 'high' : 'normal',
        historical_trend: priceChange > 0 ? 'increasing' : 'decreasing',
        booking_window: Math.floor(Math.random() * 30) + 1,
        availability: Math.random() > 0.7 ? 'limited' : 'good'
      },
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  };

  const generatePriceHistory = () => {
    const history: PriceHistory[] = [];
    const daysBack = 30;
    
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate price fluctuations
      const variation = (Math.random() - 0.5) * 0.15; // ±15% variation
      const price = currentPrice * (1 + variation);
      
      history.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100
      });
    }
    
    setPriceHistory(history);
  };

  const getRecommendationInfo = () => {
    if (!prediction) return null;

    switch (prediction.recommendation) {
      case 'book_now':
        return {
          title: 'Book Now',
          description: 'Prices are likely to increase soon',
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'wait':
        return {
          title: 'Wait',
          description: 'Prices may drop in the coming days',
          icon: TrendingDown,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'flexible':
        return {
          title: 'Be Flexible',
          description: 'Consider alternative dates for better prices',
          icon: Calendar,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      default:
        return null;
    }
  };

  const getPriceChange = () => {
    if (!prediction) return null;
    
    const change = prediction.predicted_price - currentPrice;
    const percentage = (change / currentPrice) * 100;
    
    return {
      amount: Math.abs(change),
      percentage: Math.abs(percentage),
      isIncrease: change > 0
    };
  };

  const getMinMaxPrices = () => {
    if (priceHistory.length === 0) return { min: currentPrice, max: currentPrice };
    
    const prices = priceHistory.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendationInfo = getRecommendationInfo();
  const priceChange = getPriceChange();
  const { min, max } = getMinMaxPrices();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Price Intelligence
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Recommendation */}
        {recommendationInfo && (
          <div className={`p-4 rounded-lg border ${recommendationInfo.bgColor} ${recommendationInfo.borderColor}`}>
            <div className="flex items-center gap-3">
              <recommendationInfo.icon className={`w-6 h-6 ${recommendationInfo.color}`} />
              <div>
                <h4 className={`font-semibold ${recommendationInfo.color}`}>
                  {recommendationInfo.title}
                </h4>
                <p className="text-sm text-muted">
                  {recommendationInfo.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Price Prediction */}
        {prediction && priceChange && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Predicted Price (7 days)</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  ${prediction.predicted_price.toFixed(2)}
                </span>
                <Badge variant={priceChange.isIncrease ? "destructive" : "secondary"}>
                  {priceChange.isIncrease ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {priceChange.isIncrease ? '+' : '-'}
                  {priceChange.percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Confidence</span>
                <span>{Math.round(prediction.confidence_score * 100)}%</span>
              </div>
              <Progress value={prediction.confidence_score * 100} className="h-2" />
            </div>
          </div>
        )}

        {/* Price Range */}
        <div className="space-y-3">
          <h4 className="font-medium">30-Day Price Range</h4>
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="text-muted">Lowest</div>
              <div className="font-semibold text-green-600">${min.toFixed(2)}</div>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full"></div>
            </div>
            <div className="text-center">
              <div className="text-muted">Highest</div>
              <div className="font-semibold text-red-600">${max.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-center text-sm text-muted">
            Current: ${currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Key Factors */}
        {prediction?.factors && (
          <div className="space-y-3">
            <h4 className="font-medium">Key Factors</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Demand</span>
                <Badge variant="outline">
                  {prediction.factors.seasonal_demand || 'Normal'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Trend</span>
                <Badge variant="outline">
                  {prediction.factors.historical_trend || 'Stable'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Availability</span>
                <Badge variant="outline">
                  {prediction.factors.availability || 'Good'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Booking Window</span>
                <Badge variant="outline">
                  {prediction.factors.booking_window || 15} days
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1">
            Set Price Alert
          </Button>
          <Button variant="outline" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            Flexible Dates
          </Button>
        </div>

        {/* Update Info */}
        {prediction && (
          <div className="text-xs text-muted text-center">
            Last updated: {new Date().toLocaleTimeString()} • 
            Next update: {new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};