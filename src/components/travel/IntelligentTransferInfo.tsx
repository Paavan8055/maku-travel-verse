import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  Clock, 
  Navigation, 
  Users, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Route
} from 'lucide-react';

interface TransferInsight {
  type: 'traffic' | 'route_optimization' | 'pricing' | 'demand' | 'weather_impact' | 'recommendation';
  title: string;
  description: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'info' | 'warning' | 'success';
  icon: React.ReactNode;
}

interface IntelligentTransferInfoProps {
  pickup: string;
  dropoff: string;
  date?: string;
  passengers?: number;
  className?: string;
}

export const IntelligentTransferInfo: React.FC<IntelligentTransferInfoProps> = ({
  pickup,
  dropoff,
  date,
  passengers = 2,
  className = ''
}) => {
  const [insights, setInsights] = useState<TransferInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateTransferInsights = async () => {
      setLoading(true);
      
      // Simulated intelligent transfer insights
      const transferInsights: TransferInsight[] = [];

      // Traffic analysis
      if (date) {
        const selectedDate = new Date(date);
        const isWeekday = selectedDate.getDay() >= 1 && selectedDate.getDay() <= 5;
        const hour = new Date().getHours();
        
        if (isWeekday && (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19)) {
          transferInsights.push({
            type: 'traffic',
            title: 'Peak Traffic Expected',
            description: 'Rush hour traffic may add 15-25 minutes to journey time. Consider earlier/later departure.',
            value: 75,
            trend: 'up',
            severity: 'warning',
            icon: <Car className="h-4 w-4" />
          });
        } else {
          transferInsights.push({
            type: 'traffic',
            title: 'Optimal Traffic Conditions',
            description: 'Light traffic expected. Journey time should be close to estimated duration.',
            value: 25,
            trend: 'down',
            severity: 'success',
            icon: <Car className="h-4 w-4" />
          });
        }
      }

      // Route optimization
      transferInsights.push({
        type: 'route_optimization',
        title: 'Smart Route Available',
        description: 'Alternative route via highway saves 8 minutes and avoids city center congestion.',
        value: 8,
        severity: 'success',
        icon: <Route className="h-4 w-4" />
      });

      // Pricing intelligence
      transferInsights.push({
        type: 'pricing',
        title: 'Dynamic Pricing Alert',
        description: 'Transfer prices are 20% lower than average for this route today.',
        value: 20,
        trend: 'down',
        severity: 'success',
        icon: <DollarSign className="h-4 w-4" />
      });

      // Demand patterns
      if (passengers > 4) {
        transferInsights.push({
          type: 'demand',
          title: 'Group Transfer Advantage',
          description: `Large group transfers for ${passengers} passengers offer better per-person value than individual rides.`,
          severity: 'info',
          icon: <Users className="h-4 w-4" />
        });
      }

      // Weather impact (seasonal)
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 11 || currentMonth <= 2) { // Summer in Australia
        transferInsights.push({
          type: 'weather_impact',
          title: 'Weather Consideration',
          description: 'Summer heat may affect vehicle comfort. Air-conditioned vehicles recommended.',
          severity: 'info',
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }

      // Smart recommendations
      if (pickup.toLowerCase().includes('airport') || dropoff.toLowerCase().includes('airport')) {
        transferInsights.push({
          type: 'recommendation',
          title: 'Airport Transfer Tip',
          description: 'Flight tracking available with premium services. Reduces wait time for delayed flights.',
          severity: 'info',
          icon: <Navigation className="h-4 w-4" />
        });
      }

      // Distance and time insights
      transferInsights.push({
        type: 'route_optimization',
        title: 'Journey Efficiency',
        description: 'This route is optimized for time and cost. Direct transfer with minimal stops.',
        value: 95,
        severity: 'success',
        icon: <CheckCircle className="h-4 w-4" />
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 900));
      
      setInsights(transferInsights);
      setLoading(false);
    };

    if (pickup && dropoff) {
      generateTransferInsights();
    }
  }, [pickup, dropoff, date, passengers]);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (trend === 'down') return <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />;
    return null;
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Transfer Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-l-4 border-l-orange-500`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Transfer Intelligence: {pickup} → {dropoff}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg border ${getSeverityColor(insight.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">{insight.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    {insight.trend && getTrendIcon(insight.trend)}
                    {insight.value && (
                      <Badge variant="secondary" className="text-xs">
                        {insight.type === 'pricing' || insight.type === 'route_optimization' 
                          ? `${insight.value}${insight.type === 'route_optimization' ? ' min' : '% off'}`
                          : `${insight.value}%`
                        }
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm opacity-90">{insight.description}</p>
                  
                  {insight.type === 'traffic' && insight.value && (
                    <div className="mt-2">
                      <Progress value={insight.value} className="h-2" />
                      <p className="text-xs mt-1 opacity-75">Traffic Congestion Level</p>
                    </div>
                  )}
                  
                  {insight.type === 'route_optimization' && insight.value && insight.value > 90 && (
                    <div className="mt-2">
                      <Progress value={insight.value} className="h-2" />
                      <p className="text-xs mt-1 opacity-75">Route Efficiency Score</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};