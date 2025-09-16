import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, Zap, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface DynamicPricing {
  basePrice: number;
  currentPrice: number;
  demandMultiplier: number;
  seasonalAdjustment: number;
  competitorPricing: number;
  optimizedPrice: number;
  priceChangeDirection: 'up' | 'down' | 'stable';
  confidence: number;
}

interface UpsellOpportunity {
  id: string;
  type: 'room_upgrade' | 'amenity' | 'service' | 'package';
  title: string;
  description: string;
  additionalRevenue: number;
  conversionProbability: number;
  urgency: 'low' | 'medium' | 'high';
}

interface RevenueOptimizerProps {
  hotelId?: string;
  basePrice: number;
  currentBooking?: any;
  onPriceUpdate?: (newPrice: number) => void;
  onUpsellSelect?: (upsell: UpsellOpportunity) => void;
  className?: string;
}

export const RevenueOptimizer: React.FC<RevenueOptimizerProps> = ({
  hotelId,
  basePrice,
  currentBooking,
  onPriceUpdate,
  onUpsellSelect,
  className
}) => {
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPricing | null>(null);
  const [upsellOpportunities, setUpsellOpportunities] = useState<UpsellOpportunity[]>([]);
  const [totalRevenuePotential, setTotalRevenuePotential] = useState(0);

  useEffect(() => {
    // Simulate dynamic pricing calculation
    const mockDynamicPricing: DynamicPricing = {
      basePrice,
      currentPrice: basePrice,
      demandMultiplier: 1.15,
      seasonalAdjustment: 1.05,
      competitorPricing: basePrice * 1.08,
      optimizedPrice: Math.round(basePrice * 1.15 * 1.05),
      priceChangeDirection: 'up',
      confidence: 87
    };

    setDynamicPricing(mockDynamicPricing);

    // Generate upsell opportunities
    const mockUpsells: UpsellOpportunity[] = [
      {
        id: '1',
        type: 'room_upgrade',
        title: 'Ocean View Suite Upgrade',
        description: 'Upgrade to a premium suite with stunning ocean views',
        additionalRevenue: 85,
        conversionProbability: 0.32,
        urgency: 'high'
      },
      {
        id: '2',
        type: 'amenity',
        title: 'Spa Package Add-on',
        description: 'Relaxing spa treatment package for two',
        additionalRevenue: 120,
        conversionProbability: 0.24,
        urgency: 'medium'
      },
      {
        id: '3',
        type: 'service',
        title: 'Airport Transfer Service',
        description: 'Private luxury transfer to/from airport',
        additionalRevenue: 45,
        conversionProbability: 0.56,
        urgency: 'low'
      },
      {
        id: '4',
        type: 'package',
        title: 'Dining Experience Package',
        description: 'Fine dining at our award-winning restaurant',
        additionalRevenue: 95,
        conversionProbability: 0.28,
        urgency: 'medium'
      }
    ];

    setUpsellOpportunities(mockUpsells);

    // Calculate total revenue potential
    const potential = mockUpsells.reduce((sum, upsell) => 
      sum + (upsell.additionalRevenue * upsell.conversionProbability), 0
    );
    setTotalRevenuePotential(potential);
  }, [basePrice]);

  const getUpsellIcon = (type: string) => {
    switch (type) {
      case 'room_upgrade': return <TrendingUp className="h-4 w-4" />;
      case 'amenity': return <Gift className="h-4 w-4" />;
      case 'service': return <Zap className="h-4 w-4" />;
      case 'package': return <Target className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (!dynamicPricing) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dynamic Pricing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Dynamic Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">${dynamicPricing.currentPrice}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Optimized Price</p>
              <p className="text-2xl font-bold text-primary">
                ${dynamicPricing.optimizedPrice}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Demand Multiplier</span>
              <span>{dynamicPricing.demandMultiplier}x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Seasonal Adjustment</span>
              <span>{dynamicPricing.seasonalAdjustment}x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Confidence Level</span>
              <span>{dynamicPricing.confidence}%</span>
            </div>
          </div>

          <Progress value={dynamicPricing.confidence} className="mb-4" />

          <Button 
            onClick={() => onPriceUpdate?.(dynamicPricing.optimizedPrice)}
            className="w-full"
          >
            Apply Optimized Pricing (+${dynamicPricing.optimizedPrice - dynamicPricing.currentPrice})
          </Button>
        </CardContent>
      </Card>

      {/* Upsell Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Upsell Opportunities
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Potential additional revenue: ${totalRevenuePotential.toFixed(0)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upsellOpportunities.map(upsell => (
              <div
                key={upsell.id}
                className="flex items-center justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getUpsellIcon(upsell.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{upsell.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {upsell.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={getUrgencyColor(upsell.urgency)}
                      >
                        {upsell.urgency} priority
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(upsell.conversionProbability * 100)}% conversion
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    +${upsell.additionalRevenue}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpsellSelect?.(upsell)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueOptimizer;