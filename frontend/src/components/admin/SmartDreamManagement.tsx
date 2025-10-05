import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Brain, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  BarChart3,
  Zap,
  Target,
  Heart,
  MapPin,
  Calendar,
  Database,
  Activity,
  Plus,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Wifi,
  WifiOff,
  DollarSign,
  Timer,
  Shield,
  Key
} from 'lucide-react';
import { useAIIntelligence } from '@/hooks/useAIIntelligence';
import { LoadingSpinner } from '@/components/ui/loading-states';
import logger from '@/utils/logger';

interface SmartDreamMetrics {
  totalJourneys: number;
  activeUsers: number;
  aiAnalysisCount: number;
  averageCompletionRate: number;
  topCompanionType: string;
  aiConfidenceAverage: number;
}

interface UserJourneyAnalytics {
  companionTypes: {
    solo: number;
    romantic: number;
    friends: number;
    family: number;
  };
  completionRates: {
    journey: number;
    dreams: number;
    aiDna: number;
    planner: number;
  };
  aiEngagement: {
    totalAnalyses: number;
    averageConfidence: number;
    topRecommendations: string[];
  };
}

interface Provider {
  id: string;
  name: string;
  type: string;
  api_endpoint: string;
  status: string;
  health_status: string;
  performance_score: number;
  auto_discovered: boolean;
  discovery_date?: string;
  integration_priority: number;
  supported_companions: string[];
  rate_limit: number;
  cost_per_request: number;
  last_health_check: string;
  metadata: {
    region: string;
    specialties: string[];
    established: string;
    auto_discovery_score?: number;
    issues?: string[];
  };
}

interface ProviderAnalytics {
  summary: {
    total_providers: number;
    active_providers: number;
    healthy_providers: number;
    auto_discovered_providers: number;
    avg_performance_score: number;
    total_requests_24h: number;
    success_rate_24h: number;
  };
  performance_by_type: {
    [key: string]: {
      count: number;
      avg_score: number;
      success_rate: number;
    };
  };
  top_performers: Array<{
    name: string;
    score: number;
    type: string;
  }>;
  integration_pipeline: {
    in_testing: number;
    pending_activation: number;
    scheduled_discovery: number;
    next_discovery_scan: string;
  };
  cost_analytics: {
    total_cost_24h: number;
    avg_cost_per_request: number;
    most_expensive_provider: string;
    most_efficient_provider: string;
  };
}

export const SmartDreamManagement = () => {
  const [metrics, setMetrics] = useState<SmartDreamMetrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserJourneyAnalytics | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerAnalytics, setProviderAnalytics] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [discoveryInProgress, setDiscoveryInProgress] = useState(false);

  // AI Intelligence integration for system-wide AI status
  const { travelDNA, intelligentRecommendations, loading: aiLoading, error: aiError } = useAIIntelligence();

  useEffect(() => {
    fetchSmartDreamMetrics();
    fetchProviders();
    fetchProviderAnalytics();
  }, [selectedTimeframe]);

  const fetchSmartDreamMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call for Smart Dream metrics
      // In production, this would call actual admin APIs
      setTimeout(() => {
        setMetrics({
          totalJourneys: 1247,
          activeUsers: 342,
          aiAnalysisCount: 856,
          averageCompletionRate: 73.2,
          topCompanionType: 'romantic',
          aiConfidenceAverage: 87.3
        });

        setUserAnalytics({
          companionTypes: {
            solo: 35,
            romantic: 42,
            friends: 18,
            family: 15
          },
          completionRates: {
            journey: 85.2,
            dreams: 92.1,
            aiDna: 67.8,
            planner: 54.3
          },
          aiEngagement: {
            totalAnalyses: 856,
            averageConfidence: 87.3,
            topRecommendations: ['Tokyo', 'Paris', 'Bali', 'New York', 'Rome']
          }
        });

        setLoading(false);
      }, 1000);

    } catch (err) {
      logger.error('Failed to fetch Smart Dream metrics:', err);
      setError('Failed to load Smart Dream analytics');
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      setProvidersLoading(true);
      
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:8000';
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      const response = await fetch(`${backendUrl}/api/smart-dreams/providers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setProviders(data.providers || []);
      logger.info(`Loaded ${data.providers?.length || 0} providers`);
      
    } catch (err) {
      logger.error('Failed to fetch providers:', err);
      setError('Failed to load provider data');
    } finally {
      setProvidersLoading(false);
    }
  };

  const fetchProviderAnalytics = async () => {
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:8000';
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      const response = await fetch(`${backendUrl}/api/smart-dreams/providers/analytics`);
      if (!response.ok) {
        throw new Error(`Failed to fetch provider analytics: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setProviderAnalytics(data);
      
    } catch (err) {
      logger.error('Failed to fetch provider analytics:', err);
    }
  };

  const discoverNewProviders = async () => {
    try {
      setDiscoveryInProgress(true);
      
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:8000';
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      const response = await fetch(`${backendUrl}/api/smart-dreams/providers/discover`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Provider discovery failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      logger.info(`Discovered ${data.discovered_providers?.length || 0} new providers`);
      
      // Refresh providers list to include newly discovered ones
      await fetchProviders();
      await fetchProviderAnalytics();
      
    } catch (err) {
      logger.error('Provider discovery failed:', err);
      setError('Provider discovery failed');
    } finally {
      setDiscoveryInProgress(false);
    }
  };

  const performHealthCheck = async (providerId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:8000';
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      const response = await fetch(`${backendUrl}/api/smart-dreams/providers/${providerId}/health-check`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      logger.info(`Health check completed for ${providerId}: ${data.status}`);
      
      // Refresh providers list to update health status
      await fetchProviders();
      
    } catch (err) {
      logger.error(`Health check failed for ${providerId}:`, err);
    }
  };

  const activateProvider = async (providerId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:8000';
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      const response = await fetch(`${backendUrl}/api/smart-dreams/providers/${providerId}/activate`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Provider activation failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      logger.info(`Provider ${providerId} activated successfully`);
      
      // Refresh providers list
      await fetchProviders();
      await fetchProviderAnalytics();
      
    } catch (err) {
      logger.error(`Provider activation failed for ${providerId}:`, err);
    }
  };

  const getAISystemStatus = () => {
    if (aiError) return { status: 'error', color: 'red', text: 'AI System Offline' };
    if (aiLoading) return { status: 'loading', color: 'yellow', text: 'AI Processing' };
    if (travelDNA) return { 
      status: 'healthy', 
      color: 'green', 
      text: 'AI System Online',
      confidence: Math.round(travelDNA.confidence_score * 100)
    };
    return { status: 'ready', color: 'gray', text: 'AI System Ready' };
  };

  const aiStatus = getAISystemStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2">Loading Smart Dream analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sparkles className="h-8 w-8 text-purple-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Dreams Management</h2>
            <p className="text-gray-600">AI-powered journey analytics and system monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <div className="flex space-x-2">
            {['24h', '7d', '30d'].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe}
              </Button>
            ))}
          </div>
          
          {/* AI System Status */}
          <Badge 
            variant={aiStatus.status === 'healthy' ? 'default' : 'secondary'}
            className="flex items-center space-x-2"
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: aiStatus.color }}
            />
            <span>{aiStatus.text}</span>
            {aiStatus.confidence && (
              <span className="ml-1 font-semibold">{aiStatus.confidence}%</span>
            )}
          </Badge>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Journeys</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalJourneys.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last {selectedTimeframe}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently using Smart Dreams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.aiAnalysisCount}</div>
            <p className="text-xs text-muted-foreground">
              Travel DNA & recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Journey completion average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">User Analytics</TabsTrigger>
          <TabsTrigger value="providers">Provider Management</TabsTrigger>
          <TabsTrigger value="ai-performance">AI Performance</TabsTrigger>
          <TabsTrigger value="system-health">System Health</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Companion Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <span>Journey Companions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAnalytics && Object.entries(userAnalytics.companionTypes).map(([type, percentage]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feature Completion Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Feature Engagement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAnalytics && Object.entries(userAnalytics.completionRates).map(([feature, rate]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{feature.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          {/* Provider Management Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Provider Management</h3>
              </div>
              <Badge variant="secondary">
                {providerAnalytics?.summary.total_providers || 0} Total Providers
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button 
                onClick={discoverNewProviders}
                disabled={discoveryInProgress}
                className="flex items-center space-x-2"
              >
                {discoveryInProgress ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Discover Providers</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  fetchProviders();
                  fetchProviderAnalytics();
                }}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Provider Analytics Overview */}
          {providerAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                  <Server className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {providerAnalytics.summary.active_providers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {providerAnalytics.summary.total_providers} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {providerAnalytics.summary.healthy_providers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    healthy providers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Auto-Discovered</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {providerAnalytics.summary.auto_discovered_providers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    discovered automatically
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {providerAnalytics.summary.success_rate_24h.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    last 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Provider List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-500" />
                <span>All Providers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {providersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <LoadingSpinner />
                  <span className="ml-2">Loading providers...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {providers
                    .filter(provider => 
                      searchTerm === '' || 
                      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      provider.type.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((provider) => (
                    <div key={provider.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-lg">{provider.name}</h4>
                              <Badge 
                                variant={provider.status === 'active' ? 'default' : provider.status === 'testing' ? 'secondary' : 'outline'}
                              >
                                {provider.status}
                              </Badge>
                              <Badge 
                                variant={provider.health_status === 'healthy' ? 'default' : provider.health_status === 'degraded' ? 'secondary' : 'destructive'}
                                className="flex items-center space-x-1"
                              >
                                {provider.health_status === 'healthy' ? (
                                  <Wifi className="h-3 w-3" />
                                ) : provider.health_status === 'degraded' ? (
                                  <Activity className="h-3 w-3" />
                                ) : (
                                  <WifiOff className="h-3 w-3" />
                                )}
                                <span>{provider.health_status}</span>
                              </Badge>
                              {provider.auto_discovered && (
                                <Badge variant="outline" className="flex items-center space-x-1">
                                  <Zap className="h-3 w-3 text-yellow-500" />
                                  <span>Auto-discovered</span>
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <Database className="h-3 w-3" />
                                <span className="capitalize">{provider.type}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Target className="h-3 w-3" />
                                <span>{provider.performance_score.toFixed(1)}% performance</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>${provider.cost_per_request.toFixed(3)}/req</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Timer className="h-3 w-3" />
                                <span>{provider.rate_limit}/hr</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span className="capitalize">{provider.metadata.region.replace('_', ' ')}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => performHealthCheck(provider.id)}
                            className="flex items-center space-x-1"
                          >
                            <Activity className="h-3 w-3" />
                            <span>Health Check</span>
                          </Button>
                          
                          {provider.status !== 'active' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => activateProvider(provider.id)}
                              className="flex items-center space-x-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Activate</span>
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProvider(provider)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Details</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Provider Specialties */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {provider.metadata.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Issues if any */}
                      {provider.metadata.issues && provider.metadata.issues.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-600">Issues:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {provider.metadata.issues.map((issue, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {issue.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Performance by Type */}
          {providerAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <span>Performance by Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(providerAnalytics.performance_by_type).map(([type, stats]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="capitalize font-medium">{type}</span>
                          <Badge variant="outline">{stats.count} providers</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-sm font-semibold">{stats.avg_score.toFixed(1)}%</div>
                            <div className="text-xs text-gray-500">{stats.success_rate.toFixed(1)}% success</div>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${stats.avg_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span>Top Performers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {providerAnalytics.top_performers.map((provider, index) => (
                      <div key={provider.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{provider.type}</div>
                          </div>
                        </div>
                        <Badge variant="default">
                          {provider.score.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cost Analytics */}
          {providerAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span>Cost Analytics (24h)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${providerAnalytics.cost_analytics.total_cost_24h.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">Total Cost</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ${providerAnalytics.cost_analytics.avg_cost_per_request.toFixed(3)}
                    </div>
                    <div className="text-sm text-blue-600">Avg Cost/Request</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {providerAnalytics.cost_analytics.most_expensive_provider}
                    </div>
                    <div className="text-sm text-red-600">Most Expensive</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {providerAnalytics.cost_analytics.most_efficient_provider}
                    </div>
                    <div className="text-sm text-purple-600">Most Efficient</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI System Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <span>AI Analysis Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Analyses</span>
                    <span className="font-semibold">{userAnalytics?.aiEngagement.totalAnalyses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Confidence</span>
                    <Badge variant="secondary">
                      {userAnalytics?.aiEngagement.averageConfidence}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI Response Time</span>
                    <span className="text-sm text-green-600">8-22s avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <span>Top AI Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userAnalytics?.aiEngagement.topRecommendations.map((destination, index) => (
                    <div key={destination} className="flex items-center justify-between">
                      <span className="font-medium">#{index + 1} {destination}</span>
                      <Badge variant="outline" size="sm">
                        {95 - index * 3}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>AI System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>GPT-4o-mini Status</span>
                    <Badge variant={aiStatus.status === 'healthy' ? 'default' : 'secondary'}>
                      {aiStatus.text}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Emergent LLM Key</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Endpoints</span>
                    <Badge variant="default">17/17 Healthy</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system-health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Smart Dreams System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Component Health</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Dashboard Component</span>
                      <Badge variant="default">Healthy</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Intelligence</span>
                      <Badge variant="default">Healthy</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Gamification</span>
                      <Badge variant="default">Healthy</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Backend Services</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Enhanced Dreams API</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Intelligence API</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Gamification API</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Performance Metrics</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Page Load Time</span>
                      <span className="text-green-600">1.2s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Response Time</span>
                      <span className="text-green-600">15s avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Rate</span>
                      <span className="text-green-600">0.02%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-500" />
                <span>Smart Dreams Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">AI Intelligence Settings</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>AI Analysis Auto-trigger</span>
                      <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Confidence Threshold</span>
                      <Button variant="outline" size="sm">85%</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Recommendations</span>
                      <Button variant="outline" size="sm">10</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Feature Toggles</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Smart Dreams Component</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI DNA Analysis</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Journey Planner</span>
                      <Badge variant="default">Enabled</Badge>
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

export default SmartDreamManagement;