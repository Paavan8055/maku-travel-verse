import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProviderHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  response_time: number | null;
  error_rate: number | null;
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  provider_name: string | null;
  alert_message: string;
  created_at: string;
  is_resolved: boolean;
  resolved_at?: string;
}

interface DashboardData {
  provider_health?: {
    providers: ProviderHealth[];
    overall_status: string;
    avg_response_time: number;
    total_errors: number;
  };
  booking_analytics?: {
    total_bookings_today: number;
    total_bookings_week: number;
    conversion_rate: number;
    average_booking_value: number;
    top_providers: Array<{ provider: string; bookings: number; value: number }>;
  };
  user_engagement?: {
    total_active_users: number;
    daily_active_users: number;
    user_sessions: number;
    avg_session_duration: number;
    feature_usage: Record<string, number>;
    top_pages: Array<{ page: string; views: number }>;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'bookings' | 'users' | 'alerts'>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL;

      // Fetch provider health dashboard
      const providerResponse = await fetch(`${backendUrl}/api/analytics/dashboard/provider_health`);
      const providerData = await providerResponse.json();

      // Fetch booking analytics dashboard
      const bookingResponse = await fetch(`${backendUrl}/api/analytics/dashboard/booking_analytics`);
      const bookingData = await bookingResponse.json();

      // Fetch user engagement dashboard
      const userResponse = await fetch(`${backendUrl}/api/analytics/dashboard/user_engagement`);
      const userData = await userResponse.json();

      // Fetch system alerts
      const alertsResponse = await fetch(`${backendUrl}/api/analytics/alerts?unresolved=true`);
      const alertsData = await alertsResponse.json();

      setDashboardData({
        provider_health: providerData.success ? providerData.dashboard.data : null,
        booking_analytics: bookingData.success ? bookingData.dashboard.data : null,
        user_engagement: userData.success ? userData.dashboard.data : null
      });

      setAlerts(alertsData.success ? alertsData.alerts : []);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Data Fetch Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'maintenance': return <Settings className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics & Monitoring</h1>
          <div className="animate-pulse bg-gray-200 w-20 h-8 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="bg-gray-200 w-24 h-4 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-200 w-16 h-8 rounded mb-2"></div>
                <div className="bg-gray-200 w-20 h-3 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Analytics & Monitoring</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={fetchDashboardData} 
            disabled={refreshing}
            size="sm"
            variant="outline"
          >
            <Activity className="w-4 h-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'providers', label: 'Providers', icon: Shield },
          { id: 'bookings', label: 'Bookings', icon: TrendingUp },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex items-center space-x-2"
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.id === 'alerts' && alerts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {alerts.length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.provider_health?.providers?.filter(p => p.status === 'healthy').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {dashboardData.provider_health?.providers?.length || 0} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.booking_analytics?.total_bookings_today || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${dashboardData.booking_analytics?.average_booking_value?.toFixed(2) || '0.00'} avg
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.user_engagement?.daily_active_users || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.user_engagement?.user_sessions || 0} sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {alerts.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  unresolved alerts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{alert.alert_message}</p>
                          <p className="text-xs text-gray-500">
                            {alert.provider_name && `${alert.provider_name} • `}
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Provider Health Tab */}
      {activeTab === 'providers' && dashboardData.provider_health && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.provider_health.providers.map((provider) => (
              <Card key={provider.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium capitalize">
                    {provider.name}
                  </CardTitle>
                  {getStatusIcon(provider.status)}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={provider.status === 'healthy' ? 'default' : 'secondary'}>
                        {provider.status}
                      </Badge>
                    </div>
                    {provider.response_time && (
                      <div className="flex justify-between text-sm">
                        <span>Response Time:</span>
                        <span className="font-mono">{provider.response_time}ms</span>
                      </div>
                    )}
                    {provider.error_rate !== null && (
                      <div className="flex justify-between text-sm">
                        <span>Error Rate:</span>
                        <span className={`font-mono ${provider.error_rate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                          {(provider.error_rate * 100).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.provider_health.providers.filter(p => p.status === 'healthy').length}
                  </div>
                  <p className="text-sm text-gray-600">Healthy Providers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {dashboardData.provider_health.avg_response_time}ms
                  </div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardData.provider_health.total_errors}
                  </div>
                  <p className="text-sm text-gray-600">Total Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Analytics Tab */}
      {activeTab === 'bookings' && dashboardData.booking_analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Today's Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.booking_analytics.total_bookings_today}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Weekly Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.booking_analytics.total_bookings_week}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(dashboardData.booking_analytics.conversion_rate * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg Booking Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${dashboardData.booking_analytics.average_booking_value.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.booking_analytics.top_providers.map((provider, index) => (
                  <div key={provider.provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{provider.provider}</p>
                        <p className="text-sm text-gray-600">{provider.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${provider.value.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">total value</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Engagement Tab */}
      {activeTab === 'users' && dashboardData.user_engagement && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.user_engagement.total_active_users.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.user_engagement.daily_active_users.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.user_engagement.user_sessions.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(dashboardData.user_engagement.avg_session_duration)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dashboardData.user_engagement.feature_usage).map(([feature, usage]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <span className="capitalize">{feature}</span>
                      <Badge variant="outline">{usage.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.user_engagement.top_pages.map((page) => (
                    <div key={page.page} className="flex items-center justify-between">
                      <span className="font-mono text-sm">{page.page}</span>
                      <Badge variant="outline">{page.views.toLocaleString()} views</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No active alerts. System is running smoothly!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{alert.alert_message}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            {alert.provider_name && (
                              <>
                                <span className="capitalize">{alert.provider_name}</span>
                                <span>•</span>
                              </>
                            )}
                            <Clock className="w-3 h-3" />
                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="default">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;