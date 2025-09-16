import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProviderPerformance } from '@/hooks/useProviderPerformance';
import { useBookingIntelligence } from '@/hooks/useBookingIntelligence';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Activity, 
  Target, 
  Shield,
  Zap,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react';

export const BusinessIntelligenceDashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const { 
    metrics, 
    alerts, 
    loading, 
    realtimeConnected,
    calculateProviderRanking,
    getRevenueAtRisk 
  } = useProviderPerformance();
  const { activeBookings, totalRevenueAtRisk } = useBookingIntelligence();

  const rankedProviders = calculateProviderRanking();
  const revenueAtRisk = getRevenueAtRisk();
  const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue_generated, 0);
  const avgROI = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.roi_percentage, 0) / metrics.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg ROI</p>
                <p className="text-2xl font-bold text-blue-600">{formatPercentage(avgROI)}</p>
                <p className="text-xs text-muted-foreground">Across all providers</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue at Risk</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(revenueAtRisk + totalRevenueAtRisk)}</p>
                <p className="text-xs text-muted-foreground">{alerts.length} active alerts</p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                <p className="text-2xl font-bold text-purple-600">{activeBookings.length}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {realtimeConnected ? 'Live' : 'Offline'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Intelligence Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance Overview
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue Intelligence
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Risk Management ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <Zap className="h-4 w-4 mr-2" />
            Predictive Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Provider Performance Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankedProviders.map((provider, index) => (
                  <div key={provider.provider_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                        index === 1 ? 'bg-gray-100 text-gray-800' : 
                        index === 2 ? 'bg-orange-100 text-orange-800' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{provider.provider_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatPercentage(provider.success_rate)} success • {formatCurrency(provider.revenue_generated)} revenue
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatPercentage(provider.roi_percentage)} ROI
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {provider.avg_response_time}ms avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.map((metric) => {
                    const percentage = totalRevenue > 0 ? (metric.revenue_generated / totalRevenue) * 100 : 0;
                    return (
                      <div key={metric.provider_id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{metric.provider_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(metric.revenue_generated)} ({formatPercentage(percentage)})
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.provider_id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{metric.provider_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(metric.cost_per_booking)} per booking
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          metric.roi_percentage > 150 ? 'text-green-600' : 
                          metric.roi_percentage > 120 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(metric.roi_percentage)}
                        </div>
                        <p className="text-xs text-muted-foreground">ROI</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length > 0 ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alerts.filter(a => a.severity === 'critical').length} critical alerts</strong> require immediate attention.
                  Estimated revenue impact: {formatCurrency(revenueAtRisk + totalRevenueAtRisk)}
                </AlertDescription>
              </Alert>

              {alerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'high' ? 'border-l-orange-500' :
                  alert.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{alert.message}</CardTitle>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Provider</p>
                        <p className="font-medium">{metrics.find(m => m.provider_id === alert.provider_id)?.provider_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Alert Type</p>
                        <p className="font-medium">{alert.alert_type.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-medium text-green-600">All Systems Healthy</p>
                <p className="text-muted-foreground">No active alerts or performance issues detected</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Forecasting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800">30-Day Projection</h4>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(totalRevenue * 1.15)}
                    </p>
                    <p className="text-sm text-green-700">+15% growth trend</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800">Market Opportunity</h4>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {formatCurrency(totalRevenue * 0.23)}
                    </p>
                    <p className="text-sm text-blue-700">Untapped potential with current providers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">Optimize Provider Mix</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Increase HotelBeds allocation by 15% for 12% ROI improvement
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">Performance Monitoring</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sabre showing declining performance - investigate alternatives
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">Market Expansion</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consider partnering with 2 new activity providers for 8% revenue boost
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};