import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Activity, TrendingUp, TrendingDown, Server, Zap, Shield, DollarSign, Clock } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

interface ProviderHealth {
  provider_name: string;
  display_name: string;
  health_status: string;
  avg_response_time_ms: number;
  success_rate_percent: number;
  last_check: string;
  priority: number;
  eco_rating: number;
}

interface AnalyticsOverview {
  total_providers: number;
  active_providers: number;
  health_distribution: Record<string, number>;
  avg_response_time_ms: number;
  avg_success_rate_percent: number;
}

export default function ProviderAnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalytics = async () => {
    try {
      // Fetch overview
      const overviewRes = await axios.get(`${BACKEND_URL}/api/admin/providers/analytics/overview`);
      setOverview(overviewRes.data.overview);

      // Fetch health summary
      const healthRes = await axios.get(`${BACKEND_URL}/api/admin/providers/health/summary`);
      setProviders(healthRes.data.providers);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch provider analytics:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchAnalytics, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading provider analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Provider Analytics Dashboard
            </h1>
            <p className="text-gray-600">Real-time provider performance monitoring</p>
          </div>
          <div className="flex gap-4 items-center">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              className={autoRefresh ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
            </Button>
            <Button onClick={fetchAnalytics} variant="outline">
              🔄 Refresh Now
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Total Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{overview.total_providers}</div>
                <p className="text-xs text-gray-500 mt-1">{overview.active_providers} active</p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{overview.avg_response_time_ms}ms</div>
                <p className="text-xs text-gray-500 mt-1">Across all providers</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{overview.avg_success_rate_percent.toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">Average across providers</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {overview.health_distribution.healthy || 0}/{overview.total_providers}
                </div>
                <p className="text-xs text-gray-500 mt-1">Healthy providers</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Provider List */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Status</CardTitle>
            <CardDescription>Real-time health monitoring of all travel providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.provider_name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Provider Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-3 h-3 rounded-full ${getHealthColor(provider.health_status)}`} />
                    <div>
                      <h3 className="font-semibold text-lg">{provider.display_name}</h3>
                      <p className="text-sm text-gray-500">{provider.provider_name}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6">
                    {/* Priority */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Priority</p>
                      <p className="font-semibold">{provider.priority}</p>
                    </div>

                    {/* Eco Rating */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Eco Rating</p>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-green-600">{provider.eco_rating}</p>
                        <span className="text-xs text-gray-400">/100</span>
                      </div>
                    </div>

                    {/* Response Time */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Response</p>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <p className="font-semibold">{provider.avg_response_time_ms}ms</p>
                      </div>
                    </div>

                    {/* Success Rate */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Success</p>
                      <p className="font-semibold text-blue-600">{provider.success_rate_percent.toFixed(1)}%</p>
                    </div>

                    {/* Status Badge */}
                    <Badge className={getHealthBadgeColor(provider.health_status)}>
                      {provider.health_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rotation Priority Explanation */}
        <Card className="mt-8 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Provider Rotation Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Local Suppliers First</h4>
                  <p className="text-sm text-gray-600">
                    Priority 1-9: Direct bookings with local businesses, guides, and experiences
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Eco-Rating Priority</h4>
                  <p className="text-sm text-gray-600">
                    When enabled, providers with higher eco-ratings (85+) are prioritized
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Fee Transparency</h4>
                  <p className="text-sm text-gray-600">
                    Providers with higher transparency scores (90+) are preferred
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold">Health & Performance</h4>
                  <p className="text-sm text-gray-600">
                    Dynamic adjustment based on response times and success rates
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
