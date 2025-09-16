import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ConversionMetrics {
  searchToView: number;
  viewToBooking: number;
  averageBookingValue: number;
  customerLifetimeValue: number;
  abandonmentRate: number;
  timeToBooking: number; // minutes
}

interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number;
  dropOff: number;
}

interface RevenueAnalyticsDashboardProps {
  className?: string;
}

export const RevenueAnalyticsDashboard: React.FC<RevenueAnalyticsDashboardProps> = ({
  className = ""
}) => {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);

  const generateAnalyticsData = (): ConversionMetrics => {
    // Simulate realistic analytics data
    return {
      searchToView: 23.5 + (Math.random() - 0.5) * 5, // 21-26%
      viewToBooking: 3.2 + (Math.random() - 0.5) * 1, // 2.7-3.7%
      averageBookingValue: 245 + Math.random() * 100, // $245-345
      customerLifetimeValue: 820 + Math.random() * 200, // $820-1020
      abandonmentRate: 76.8 + (Math.random() - 0.5) * 8, // 72-81%
      timeToBooking: 18 + Math.random() * 12 // 18-30 minutes
    };
  };

  const generateFunnelData = (): FunnelStep[] => {
    const baseUsers = 1000;
    return [
      {
        step: 'Hotel Search',
        count: baseUsers,
        conversionRate: 100,
        dropOff: 0
      },
      {
        step: 'Hotel View',
        count: Math.floor(baseUsers * 0.75),
        conversionRate: 75,
        dropOff: 25
      },
      {
        step: 'Offers Check',
        count: Math.floor(baseUsers * 0.45),
        conversionRate: 45,
        dropOff: 30
      },
      {
        step: 'Booking Details',
        count: Math.floor(baseUsers * 0.18),
        conversionRate: 18,
        dropOff: 27
      },
      {
        step: 'Payment',
        count: Math.floor(baseUsers * 0.12),
        conversionRate: 12,
        dropOff: 6
      },
      {
        step: 'Confirmed',
        count: Math.floor(baseUsers * 0.09),
        conversionRate: 9,
        dropOff: 3
      }
    ];
  };

  useEffect(() => {
    setMetrics(generateAnalyticsData());
    setFunnelData(generateFunnelData());

    // Update every 30 seconds
    const interval = setInterval(() => {
      setMetrics(generateAnalyticsData());
      setFunnelData(generateFunnelData());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  const getPerformanceIndicator = (value: number, benchmark: number) => {
    const diff = ((value - benchmark) / benchmark) * 100;
    if (Math.abs(diff) < 2) return { icon: null, color: 'text-muted-foreground', text: 'stable' };
    return diff > 0 
      ? { icon: <TrendingUp className="h-3 w-3" />, color: 'text-green-600', text: `+${diff.toFixed(1)}%` }
      : { icon: <TrendingDown className="h-3 w-3" />, color: 'text-red-600', text: `${diff.toFixed(1)}%` };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="travel-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Booking Value</p>
                <p className="text-2xl font-bold">${metrics.averageBookingValue.toFixed(0)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getPerformanceIndicator(metrics.averageBookingValue, 280).icon}
                  <span className={`text-xs ${getPerformanceIndicator(metrics.averageBookingValue, 280).color}`}>
                    {getPerformanceIndicator(metrics.averageBookingValue, 280).text}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="travel-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Search to Booking</p>
                <p className="text-2xl font-bold">{metrics.searchToView.toFixed(1)}%</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getPerformanceIndicator(metrics.searchToView, 22).icon}
                  <span className={`text-xs ${getPerformanceIndicator(metrics.searchToView, 22).color}`}>
                    {getPerformanceIndicator(metrics.searchToView, 22).text}
                  </span>
                </div>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="travel-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customer LTV</p>
                <p className="text-2xl font-bold">${metrics.customerLifetimeValue.toFixed(0)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getPerformanceIndicator(metrics.customerLifetimeValue, 900).icon}
                  <span className={`text-xs ${getPerformanceIndicator(metrics.customerLifetimeValue, 900).color}`}>
                    {getPerformanceIndicator(metrics.customerLifetimeValue, 900).text}
                  </span>
                </div>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="travel-card">
        <CardHeader>
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((step, index) => (
              <div key={step.step} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{step.step}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {step.count.toLocaleString()} users
                    </span>
                    <Badge variant={step.conversionRate > 50 ? 'default' : step.conversionRate > 20 ? 'secondary' : 'destructive'}>
                      {step.conversionRate}%
                    </Badge>
                  </div>
                </div>
                <Progress value={step.conversionRate} className="h-2" />
                {step.dropOff > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {step.dropOff}% drop-off from previous step
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time & Abandonment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="travel-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Time to Booking</p>
                <p className="text-xl font-bold">{metrics.timeToBooking.toFixed(0)} minutes</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Industry avg: 25 minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="travel-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Abandonment Rate</p>
                <p className="text-xl font-bold">{metrics.abandonmentRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Industry avg: 78%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};