import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users, BarChart3, Brain, Target, Zap, Shield } from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const { generateAnalytics, loading } = useAdvancedAnalytics();

  const [analyticsData, setAnalyticsData] = useState({
    revenue: { current: 2850000, projected: 3200000, variance: 12.3 },
    customers: { total: 15420, churnRisk: 231, lifetime_value: 3500 },
    demand: { forecast: 'High', confidence: 92, seasonality: 'Peak Season' },
    risks: { total: 8, critical: 2, medium: 4, low: 2 },
    opportunities: { identified: 12, revenue_impact: 450000 },
    performance: { system_health: 94, prediction_accuracy: 89 }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await generateAnalytics({
        type: 'performance',
        timeRange
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 10) return 'text-green-600';
    if (variance > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (variance: number) => {
    return variance > 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics & Forecasting</h1>
          <p className="text-muted-foreground">
            AI-powered business intelligence and predictive insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Forecast</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analyticsData.revenue.projected / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={getVarianceColor(analyticsData.revenue.variance)}>
                +{analyticsData.revenue.variance}%
              </span>{' '}
              vs current period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Intelligence</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.customers.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-600">{analyticsData.customers.churnRisk}</span> at churn risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Forecast</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.demand.forecast}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.demand.confidence}% confidence · {analyticsData.demand.seasonality}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.risks.total}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="destructive" className="text-xs">
                {analyticsData.risks.critical} Critical
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {analyticsData.risks.medium} Medium
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="forecasting" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="risks">Risk Management</TabsTrigger>
          <TabsTrigger value="maintenance">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Demand Forecasting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Next 30 Days</span>
                    <Badge variant="outline">High Demand</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peak Season Impact</span>
                    <span className="text-sm font-medium text-green-600">+35% booking velocity</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidence Level</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      🎯 <strong>Recommendation:</strong> Increase inventory by 20% for peak season. 
                      Consider dynamic pricing strategy for high-demand destinations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Q1 2025 Projection</span>
                    <span className="text-lg font-bold">$3.2M AUD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidence Interval</span>
                    <span className="text-sm">$2.8M - $3.6M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">YoY Growth</span>
                    <span className="text-sm font-medium text-green-600">+18.5%</span>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      📈 <strong>Insight:</strong> Revenue growth accelerating driven by premium 
                      segment expansion and improved conversion rates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Behavior Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average CLV</span>
                    <span className="text-lg font-bold">$3,500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Churn Risk (High)</span>
                    <Badge variant="destructive">231 customers</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Engagement Score</span>
                    <span className="text-sm font-medium">8.5/10</span>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ <strong>Action Required:</strong> Implement retention campaign for 
                      high-value customers at risk. Focus on personalized offers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Segmentation Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Luxury Travelers</span>
                    <Badge variant="outline">2,340 (15%)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Business Travelers</span>
                    <Badge variant="outline">4,630 (30%)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Leisure Travelers</span>
                    <Badge variant="outline">8,450 (55%)</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">
                      💡 <strong>Opportunity:</strong> Luxury segment shows highest engagement. 
                      Consider premium service tier expansion.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Financial Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">$2.8M</div>
                  <div className="text-sm text-muted-foreground">Current Revenue</div>
                  <div className="text-xs text-green-600 mt-1">+18% vs budget</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">32%</div>
                  <div className="text-sm text-muted-foreground">Gross Margin</div>
                  <div className="text-xs text-green-600 mt-1">Above 30% target</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">$450K</div>
                  <div className="text-sm text-muted-foreground">Operating Cash Flow</div>
                  <div className="text-xs text-green-600 mt-1">Strong liquidity</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Competitive Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Market Position</span>
                    <Badge variant="outline">#3 in Luxury Segment</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Strong positioning with premium pricing strategy and superior customer service.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Competitive Advantages</span>
                    <Badge variant="outline">AI Personalization</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Leading in AI-powered recommendations and local partnership network.
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-800">Growth Opportunity</span>
                    <Badge variant="outline">Corporate Travel</Badge>
                  </div>
                  <p className="text-sm text-blue-700">
                    Significant expansion opportunity in corporate travel segment with 40% market growth potential.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Active Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Badge variant="destructive">Critical</Badge>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Currency Exposure Risk</div>
                      <div className="text-xs text-muted-foreground">High USD/AUD volatility impact</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Badge variant="destructive">Critical</Badge>
                    <div className="flex-1">
                      <div className="font-medium text-sm">API Dependency Risk</div>
                      <div className="text-xs text-muted-foreground">Single point of failure - Amadeus</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Badge variant="secondary">Medium</Badge>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Market Competition</div>
                      <div className="text-xs text-muted-foreground">Pricing pressure from OTAs</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Mitigation Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Currency Hedging</span>
                    <Badge variant="outline">In Progress</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Provider Diversification</span>
                    <Badge variant="outline">Planned</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backup Systems</span>
                    <Badge variant="outline">Implemented</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Recommendation:</strong> Accelerate provider diversification 
                      to reduce API dependency risk within 60 days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                System Health & Predictive Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-green-600">94%</div>
                    <div className="text-sm text-muted-foreground">Overall System Health</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Database Performance</span>
                      <Badge variant="secondary">Moderate Risk</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>API Response Times</span>
                      <Badge variant="outline">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Error Rates</span>
                      <Badge variant="outline">Normal</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-blue-600">3</div>
                    <div className="text-sm text-muted-foreground">Predicted Issues (30 days)</div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-amber-50 rounded text-sm">
                      <div className="font-medium text-amber-800">Database Optimization</div>
                      <div className="text-amber-600">Recommended in 2-3 weeks</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded text-sm">
                      <div className="font-medium text-blue-800">API Scaling</div>
                      <div className="text-blue-600">Plan for increased capacity</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};