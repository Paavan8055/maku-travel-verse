import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUniversalAI } from '../context/UniversalAIContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Zap,
  Clock,
  Target,
  Star,
  BarChart3,
  RefreshCw,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AIAnalyticsDashboard: React.FC = () => {
  const { 
    aiInteractions, 
    usagePatterns, 
    analyzeUsagePatterns,
    getPersonalizationData,
    clearInteractionHistory
  } = useUniversalAI();

  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const analysisData = useMemo(() => analyzeUsagePatterns(), [aiInteractions]);
  const personalizationData = useMemo(() => getPersonalizationData(), [aiInteractions]);

  const filteredInteractions = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case '1d':
        cutoff.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
    }
    
    return aiInteractions.filter(i => new Date(i.timestamp) >= cutoff);
  }, [aiInteractions, timeRange]);

  // Dashboard usage distribution
  const dashboardData = useMemo(() => {
    const counts = filteredInteractions.reduce((acc, i) => {
      acc[i.dashboardType] = (acc[i.dashboardType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredInteractions]);

  // AI type usage
  const aiTypeData = useMemo(() => {
    const counts = filteredInteractions.reduce((acc, i) => {
      acc[i.aiType] = (acc[i.aiType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredInteractions]);

  // Hourly usage pattern
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, interactions: 0 }));
    
    filteredInteractions.forEach(i => {
      const hour = new Date(i.timestamp).getHours();
      hours[hour].interactions++;
    });

    return hours;
  }, [filteredInteractions]);

  // Success rate over time
  const successRateData = useMemo(() => {
    const dailyData: Record<string, { total: number; successful: number }> = {};
    
    filteredInteractions.forEach(i => {
      const date = new Date(i.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, successful: 0 };
      }
      dailyData[date].total++;
      if (i.success) dailyData[date].successful++;
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      successRate: Math.round((data.successful / data.total) * 100) || 0,
      total: data.total
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredInteractions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExportData = () => {
    const data = {
      interactions: filteredInteractions,
      analysis: analysisData,
      personalization: personalizationData,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Analytics Dashboard</h2>
          <p className="text-muted-foreground">Monitor AI interactions and performance across all dashboards</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <TabsList>
              <TabsTrigger value="1d">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisData.totalInteractions}</div>
            <p className="text-xs text-muted-foreground">
              +{filteredInteractions.length} in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analysisData.averageSuccessRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all AI interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Dashboard</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{analysisData.mostUsedDashboard}</div>
            <p className="text-xs text-muted-foreground">
              Primary interface
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisData.peakUsageHours.slice(0, 2).join(', ')}h
            </div>
            <p className="text-xs text-muted-foreground">
              Most active times
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Type Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aiTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Usage Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="interactions" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Success Rate Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={successRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="successRate" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Interactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {filteredInteractions.slice(0, 10).map((interaction) => (
                  <div key={interaction.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      {interaction.aiType === 'maku' ? <MessageCircle className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      <span className="text-sm">{interaction.type}</span>
                      <Badge variant="outline" className="text-xs">
                        {interaction.dashboardType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {interaction.success && <Star className="h-3 w-3 text-green-500" />}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(interaction.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysisData.improvementAreas.length > 0 ? (
                  analysisData.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm">
                      <TrendingUp className="h-4 w-4 text-yellow-600" />
                      {area}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No improvement areas identified. Great job! 🎉
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Preferred AI Type</span>
                  <Badge className="capitalize">{personalizationData.preferredAIType}</Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Optimal Usage Times</span>
                  <div className="flex gap-1 mt-1">
                    {personalizationData.optimalTimes.map(time => (
                      <Badge key={time} variant="outline">{time}:00</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Common Tasks</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {personalizationData.commonTasks.map(task => (
                      <Badge key={task} variant="secondary" className="text-xs">{task}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(personalizationData.successFactors).map(([factor, rate]) => (
                  <div key={factor}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span>{Math.round(rate * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.round(rate * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Most productive hours: {analysisData.peakUsageHours.slice(0, 2).join(', ')}:00</p>
                <p>• Preferred dashboard: {analysisData.mostUsedDashboard}</p>
                <p>• Average daily interactions: {Math.round(filteredInteractions.length / Math.max(1, parseInt(timeRange)))}</p>
                <p>• Success rate trend: {analysisData.averageSuccessRate > 0.8 ? '📈 Improving' : '📉 Needs attention'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Use AI during peak hours ({analysisData.peakUsageHours[0]}:00-{analysisData.peakUsageHours[1] || analysisData.peakUsageHours[0] + 1}:00)</p>
                <p>• Focus on {personalizationData.preferredAIType} AI for best results</p>
                <p>• {analysisData.averageSuccessRate < 0.8 ? 'Consider shorter, more specific queries' : 'Current query style is working well'}</p>
                <p>• Enable cross-dashboard sharing for better context</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {Math.round(analysisData.averageSuccessRate * 100)}
                  </div>
                  <p className="text-sm text-muted-foreground">Overall AI Experience Score</p>
                  <div className="mt-3">
                    <Badge 
                      variant={analysisData.averageSuccessRate > 0.9 ? 'default' : 
                               analysisData.averageSuccessRate > 0.7 ? 'secondary' : 'destructive'}
                    >
                      {analysisData.averageSuccessRate > 0.9 ? 'Excellent' : 
                       analysisData.averageSuccessRate > 0.7 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Interaction History</h4>
                  <p className="text-sm text-muted-foreground">
                    {aiInteractions.length} interactions stored locally
                  </p>
                </div>
                <Button variant="destructive" onClick={clearInteractionHistory}>
                  Clear History
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Export Analytics Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download your AI interaction data
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalyticsDashboard;