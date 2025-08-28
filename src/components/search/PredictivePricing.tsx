import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PricePrediction {
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  bestBookingTime: string;
  priceHistory: Array<{
    date: string;
    price: number;
  }>;
  factors: Array<{
    name: string;
    impact: 'positive' | 'negative';
    weight: number;
  }>;
}

interface PredictivePricingProps {
  itemId: string;
  itemType: 'hotel' | 'flight' | 'activity';
  searchParams: {
    destination?: string;
    dates?: {
      checkIn: string;
      checkOut: string;
    };
    guests?: number;
  };
}

export const PredictivePricing: React.FC<PredictivePricingProps> = ({
  itemId,
  itemType,
  searchParams
}) => {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      
      // Simulate API call to ML prediction service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockPrediction: PricePrediction = {
        currentPrice: 299,
        predictedPrice: 350,
        confidence: 85,
        trend: 'up',
        bestBookingTime: 'Book within 3 days for best price',
        priceHistory: [
          { date: '2024-01-01', price: 280 },
          { date: '2024-01-02', price: 290 },
          { date: '2024-01-03', price: 299 },
          { date: '2024-01-04', price: 310 },
          { date: '2024-01-05', price: 325 },
        ],
        factors: [
          { name: 'High demand period', impact: 'negative', weight: 0.8 },
          { name: 'Limited availability', impact: 'negative', weight: 0.6 },
          { name: 'Seasonal pricing', impact: 'negative', weight: 0.4 },
          { name: 'Competitor pricing', impact: 'positive', weight: 0.3 },
        ]
      };
      
      setPrediction(mockPrediction);
      setLoading(false);
    };

    fetchPrediction();
  }, [itemId, itemType, searchParams]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/2 mb-2" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) return null;

  const priceChange = prediction.predictedPrice - prediction.currentPrice;
  const priceChangePercent = Math.round((priceChange / prediction.currentPrice) * 100);
  const isIncreasing = prediction.trend === 'up';

  return (
    <Card className="travel-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Price Prediction
          <Badge variant="outline" className="ml-auto">
            {prediction.confidence}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current vs Predicted Price */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-2xl font-bold">${prediction.currentPrice}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {isIncreasing ? (
              <TrendingUp className="h-5 w-5 text-red-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-500" />
            )}
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Next Week</p>
              <p className={`text-xl font-bold ${isIncreasing ? 'text-red-600' : 'text-green-600'}`}>
                ${prediction.predictedPrice}
              </p>
            </div>
          </div>
        </div>

        {/* Price Change Alert */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          isIncreasing ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
        }`}>
          <AlertTriangle className="h-5 w-5" />
          <div className="flex-1">
            <p className="font-medium">
              Price expected to {isIncreasing ? 'increase' : 'decrease'} by ${Math.abs(priceChange)} ({Math.abs(priceChangePercent)}%)
            </p>
            <p className="text-sm opacity-80">{prediction.bestBookingTime}</p>
          </div>
        </div>

        {/* Confidence Meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Prediction Confidence</p>
            <p className="text-sm text-muted-foreground">{prediction.confidence}%</p>
          </div>
          <Progress value={prediction.confidence} className="h-2" />
        </div>

        {/* Price Factors */}
        <div>
          <h4 className="font-medium mb-3">Factors affecting price</h4>
          <div className="space-y-2">
            {prediction.factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{factor.name}</span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={factor.weight * 100} 
                    className="w-16 h-2"
                  />
                  <Badge 
                    variant={factor.impact === 'positive' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {factor.impact === 'positive' ? '↓' : '↑'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price History Chart */}
        <div>
          <h4 className="font-medium mb-3">Price Trend (Last 5 days)</h4>
          <div className="flex items-end justify-between h-20 px-2">
            {prediction.priceHistory.map((point, index) => {
              const height = (point.price / Math.max(...prediction.priceHistory.map(p => p.price))) * 100;
              return (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div 
                    className="bg-primary rounded-t"
                    style={{ 
                      height: `${height * 0.6}px`,
                      width: '20px'
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(point.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className={`w-full ${isIncreasing ? 'bg-orange-600 hover:bg-orange-700' : 'btn-primary'}`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {isIncreasing ? 'Book Now to Save' : 'Wait for Better Price'}
        </Button>
      </CardContent>
    </Card>
  );
};