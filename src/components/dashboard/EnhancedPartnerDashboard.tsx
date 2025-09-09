import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalBotInterface } from '@/components/master-bot/UniversalBotInterface';
import { BotResultsPanel } from '@/components/master-bot/BotResultsPanel';
import { useMasterBotController } from '@/hooks/useMasterBotController';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BarChart3,
  Target,
  Lightbulb,
  AlertTriangle,
  Star
} from 'lucide-react';

export const EnhancedPartnerDashboard: React.FC = () => {
  const { botResults, getResultsByType, getHighPriorityResults } = useMasterBotController('partner');

  const revenueResults = getResultsByType('revenue_optimization');
  const marketResults = getResultsByType('market_intelligence');
  const performanceResults = getResultsByType('performance_analysis');
  const highPriorityResults = getHighPriorityResults();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Partner Dashboard</h1>
            <p className="text-muted-foreground">Optimize your business with AI-powered insights</p>
          </div>
          {highPriorityResults.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {highPriorityResults.length} urgent insights
            </Badge>
          )}
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue Optimization</TabsTrigger>
            <TabsTrigger value="market">Market Intelligence</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Revenue Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Revenue Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    +${(revenueResults.reduce((sum, r) => sum + (r.result_data?.revenue_impact || 0), 0)).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Potential monthly increase
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Optimization Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {Math.round(revenueResults.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / Math.max(revenueResults.length, 1) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI confidence in recommendations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Active Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {revenueResults.filter(r => r.result_data?.type === 'campaign').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Running optimization campaigns
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    New Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {revenueResults.filter(r => r.actionability_rating === 'high').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    High-impact recommendations
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Optimization Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Pricing Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueResults.filter(r => r.result_data?.type === 'pricing').slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {rec.result_data?.title || 'Dynamic Pricing Adjustment'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rec.result_data?.description || 'Optimize pricing based on demand'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          +{rec.result_data?.impact || '12'}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Customer Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueResults.filter(r => r.result_data?.type === 'customer').slice(0, 3).map((insight, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {insight.result_data?.title || 'Customer Behavior Pattern'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {insight.result_data?.description || 'Identified booking preference trend'}
                          </p>
                        </div>
                        <Badge variant={insight.actionability_rating === 'high' ? 'default' : 'outline'}>
                          {insight.actionability_rating || 'medium'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Market Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Rank #3 in local market segment</p>
                    <p>• 15% above average pricing</p>
                    <p>• 92% customer satisfaction score</p>
                    <p>• 23% market share growth potential</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Competitive Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Competitor A: 5% price advantage</p>
                    <p>• Competitor B: Lower availability</p>
                    <p>• Market trend: +12% demand increase</p>
                    <p>• Opportunity: Weekend premium pricing</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Average rating: 4.7/5 stars</p>
                    <p>• Response time: 2.3 hours</p>
                    <p>• Booking completion: 89%</p>
                    <p>• Customer retention: 76%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <BotResultsPanel dashboardType="partner" className="col-span-full" />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceResults.slice(0, 4).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {trend.result_data?.metric || 'Performance Metric'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {trend.result_data?.description || 'Performance analysis result'}
                          </p>
                        </div>
                        <Badge variant={trend.result_data?.trend === 'up' ? 'default' : 'secondary'}>
                          {trend.result_data?.change || '+5.2'}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Goal Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Monthly Revenue Target</span>
                        <span>87%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Customer Satisfaction</span>
                        <span>94%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Market Share Growth</span>
                        <span>76%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '76%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UniversalBotInterface dashboardType="partner" className="lg:col-span-1" />
              <BotResultsPanel dashboardType="partner" className="lg:col-span-1" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};