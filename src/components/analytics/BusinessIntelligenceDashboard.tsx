import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Award,
  RefreshCw
} from 'lucide-react';

interface FinancialMetrics {
  totalRevenue: number;
  grossMargin: number;
  operatingCosts: number;
  netProfit: number;
  providerCosts: {
    [provider: string]: number;
  };
  revenueByProduct: {
    [product: string]: number;
  };
}

interface MarketMetrics {
  marketShare: number;
  competitorAnalysis: {
    competitor: string;
    marketShare: number;
    avgPrice: number;
  }[];
  seasonalTrends: {
    month: string;
    bookings: number;
    revenue: number;
  }[];
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  customerRetention: number;
  satisfactionScore: number;
  avgBookingValue: number;
  customerLifetimeValue: number;
}

export const BusinessIntelligenceDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [marketMetrics, setMarketMetrics] = useState<MarketMetrics | null>(null);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const generateFinancialData = (): FinancialMetrics => {
    const baseRevenue = 150000 + Math.random() * 50000;
    return {
      totalRevenue: baseRevenue,
      grossMargin: 0.3 + Math.random() * 0.2,
      operatingCosts: baseRevenue * (0.2 + Math.random() * 0.1),
      netProfit: baseRevenue * (0.15 + Math.random() * 0.1),
      providerCosts: {
        'Amadeus': 15000 + Math.random() * 5000,
        'Sabre': 12000 + Math.random() * 4000,
        'HotelBeds': 18000 + Math.random() * 6000,
        'Stripe': 3000 + Math.random() * 1000
      },
      revenueByProduct: {
        'Hotels': baseRevenue * 0.6,
        'Flights': baseRevenue * 0.3,
        'Activities': baseRevenue * 0.1
      }
    };
  };

  const generateMarketData = (): MarketMetrics => {
    return {
      marketShare: 2.5 + Math.random() * 1.5,
      competitorAnalysis: [
        { competitor: 'Booking.com', marketShare: 35, avgPrice: 250 },
        { competitor: 'Expedia', marketShare: 28, avgPrice: 275 },
        { competitor: 'Agoda', marketShare: 15, avgPrice: 220 },
        { competitor: 'MAKU Travel', marketShare: 2.5 + Math.random() * 1.5, avgPrice: 265 }
      ],
      seasonalTrends: generateSeasonalData()
    };
  };

  const generateCustomerData = (): CustomerMetrics => {
    return {
      totalCustomers: 12500 + Math.floor(Math.random() * 5000),
      newCustomers: 850 + Math.floor(Math.random() * 300),
      customerRetention: 0.65 + Math.random() * 0.2,
      satisfactionScore: 4.2 + Math.random() * 0.6,
      avgBookingValue: 285 + Math.random() * 100,
      customerLifetimeValue: 1200 + Math.random() * 400
    };
  };

  const generateSeasonalData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      bookings: 800 + Math.random() * 600,
      revenue: 25000 + Math.random() * 15000
    }));
  };

  useEffect(() => {
    setFinancialMetrics(generateFinancialData());
    setMarketMetrics(generateMarketData());
    setCustomerMetrics(generateCustomerData());
  }, [timeRange]);

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFinancialMetrics(generateFinancialData());
    setMarketMetrics(generateMarketData());
    setCustomerMetrics(generateCustomerData());
    setLoading(false);
  };

  if (!financialMetrics || !marketMetrics || !customerMetrics) return null;

  const roiPercentage = ((financialMetrics.netProfit / financialMetrics.operatingCosts) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Business Intelligence
          </h2>
          <p className="text-muted-foreground">Executive insights and market analysis</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${financialMetrics.totalRevenue.toFixed(0)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-success mr-1" />
                  <span className="text-xs text-success">+12.5%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gross Margin</p>
                <p className="text-2xl font-bold">{(financialMetrics.grossMargin * 100).toFixed(1)}%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-success mr-1" />
                  <span className="text-xs text-success">+2.1%</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Market Share</p>
                <p className="text-2xl font-bold">{marketMetrics.marketShare.toFixed(1)}%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-success mr-1" />
                  <span className="text-xs text-success">+0.3%</span>
                </div>
              </div>
              <PieChart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                <p className="text-2xl font-bold">{customerMetrics.satisfactionScore.toFixed(1)}</p>
                <div className="flex items-center mt-1">
                  <Award className="h-3 w-3 text-success mr-1" />
                  <span className="text-xs text-success">Excellent</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="financial">
        <TabsList>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
          <TabsTrigger value="customer">Customer Insights</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(financialMetrics.revenueByProduct).map(([product, revenue]) => (
                    <div key={product} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{product}</span>
                        <span className="font-bold">${revenue.toFixed(0)}</span>
                      </div>
                      <Progress value={(revenue / financialMetrics.totalRevenue) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provider Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(financialMetrics.providerCosts).map(([provider, cost]) => (
                    <div key={provider} className="flex justify-between items-center">
                      <span className="font-medium">{provider}</span>
                      <div className="text-right">
                        <div className="font-bold">${cost.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">
                          {((cost / financialMetrics.operatingCosts) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitor Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketMetrics.competitorAnalysis.map((competitor) => (
                    <div key={competitor.competitor} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{competitor.competitor}</span>
                        <Badge variant={competitor.competitor === 'MAKU Travel' ? 'default' : 'outline'}>
                          {competitor.marketShare.toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={competitor.marketShare} />
                      <div className="text-sm text-muted-foreground">
                        Avg Price: ${competitor.avgPrice}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketMetrics.seasonalTrends.slice(-6).map((trend) => (
                    <div key={trend.month} className="flex justify-between items-center">
                      <span className="font-medium">{trend.month}</span>
                      <div className="text-right">
                        <div className="font-bold">${trend.revenue.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">
                          {trend.bookings} bookings
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-3xl font-bold">{customerMetrics.totalCustomers.toLocaleString()}</p>
                  <p className="text-sm text-success">+{customerMetrics.newCustomers} new</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Retention Rate</p>
                  <p className="text-3xl font-bold">{(customerMetrics.customerRetention * 100).toFixed(1)}%</p>
                  <Progress value={customerMetrics.customerRetention * 100} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg Booking Value</p>
                  <p className="text-3xl font-bold">${customerMetrics.avgBookingValue.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">
                    LTV: ${customerMetrics.customerLifetimeValue.toFixed(0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall ROI</p>
                    <p className="text-4xl font-bold text-success">{roiPercentage.toFixed(1)}%</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="font-bold">${financialMetrics.totalRevenue.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operating Costs</span>
                      <span className="font-bold">${financialMetrics.operatingCosts.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Net Profit</span>
                      <span className="font-bold text-success">${financialMetrics.netProfit.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Provider ROI</h4>
                  {Object.entries(financialMetrics.providerCosts).map(([provider, cost]) => {
                    const providerROI = ((financialMetrics.totalRevenue * 0.25 - cost) / cost) * 100;
                    return (
                      <div key={provider} className="flex justify-between items-center">
                        <span>{provider}</span>
                        <Badge variant={providerROI > 100 ? 'default' : 'secondary'}>
                          {providerROI.toFixed(0)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};