import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { 
  Activity, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface ProviderMetrics {
  provider: string;
  successRate: number;
  averageResponseTime: number;
  totalRequests: number;
  costPerRequest: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'degraded' | 'critical';
}

interface ProviderPerformanceAnalyticsProps {
  className?: string;
}

export const ProviderPerformanceAnalytics: React.FC<ProviderPerformanceAnalyticsProps> = ({
  className = ""
}) => {
  const { getPerformanceAnalytics, loading } = useAdvancedAnalytics();
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  const generateProviderData = (): ProviderMetrics[] => {
    const providers = ['Amadeus', 'Sabre', 'HotelBeds', 'Stripe'];
    return providers.map(provider => ({
      provider,
      successRate: 85 + Math.random() * 14,
      averageResponseTime: 200 + Math.random() * 800,
      totalRequests: Math.floor(1000 + Math.random() * 9000),
      costPerRequest: 0.05 + Math.random() * 0.1,
      revenue: 1000 + Math.random() * 5000,
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      status: Math.random() > 0.8 ? 'critical' : Math.random() > 0.6 ? 'degraded' : 'healthy'
    }));
  };

  useEffect(() => {
    setProviderMetrics(generateProviderData());
  }, [timeRange]);

  const handleRefresh = async () => {
    await getPerformanceAnalytics(timeRange);
    setProviderMetrics(generateProviderData());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredMetrics = selectedProvider === 'all' 
    ? providerMetrics 
    : providerMetrics.filter(m => m.provider === selectedProvider);

  const totalRevenue = providerMetrics.reduce((sum, m) => sum + m.revenue, 0);
  const averageSuccessRate = providerMetrics.reduce((sum, m) => sum + m.successRate, 0) / providerMetrics.length;
  const averageResponseTime = providerMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / providerMetrics.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Provider Performance Analytics</h2>
          <p className="text-muted-foreground">Comprehensive provider metrics and trends</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providerMetrics.map(provider => (
                <SelectItem key={provider.provider} value={provider.provider}>
                  {provider.provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Success Rate</p>
                <p className="text-2xl font-bold">{averageSuccessRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{averageResponseTime.toFixed(0)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Providers</p>
                <p className="text-2xl font-bold">{providerMetrics.filter(m => m.status === 'healthy').length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMetrics.map((provider) => (
          <Card key={provider.provider}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{provider.provider}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(provider.trend)}
                  <Badge variant={getStatusBadge(provider.status)}>
                    {provider.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold">{provider.successRate.toFixed(1)}%</p>
                  <Progress value={provider.successRate} className="mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-xl font-bold">{provider.averageResponseTime.toFixed(0)}ms</p>
                  <Progress 
                    value={Math.min((provider.averageResponseTime / 1000) * 100, 100)} 
                    className="mt-1" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-lg font-semibold">{provider.totalRequests.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost per Request</p>
                  <p className="text-lg font-semibold">${provider.costPerRequest.toFixed(3)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Revenue Generated</p>
                <p className="text-xl font-bold text-success">${provider.revenue.toFixed(0)}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">ROI</span>
                <span className="font-semibold">
                  {((provider.revenue / (provider.totalRequests * provider.costPerRequest)) * 100).toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};