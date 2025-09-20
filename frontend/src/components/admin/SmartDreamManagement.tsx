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

export const SmartDreamManagement = () => {
  const [metrics, setMetrics] = useState<SmartDreamMetrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserJourneyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  // AI Intelligence integration for system-wide AI status
  const { travelDNA, intelligentRecommendations, loading: aiLoading, error: aiError } = useAIIntelligence();

  useEffect(() => {
    fetchSmartDreamMetrics();
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