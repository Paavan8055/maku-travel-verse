import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  AlertTriangle,
  Crown,
  Globe,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExecutiveKPI {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface StrategicInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
  deadline?: string;
}

interface MarketIntelligence {
  segment: string;
  marketShare: number;
  growthRate: number;
  competitors: Array<{
    name: string;
    share: number;
    trend: 'gaining' | 'losing' | 'stable';
  }>;
  opportunities: string[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const ExecutiveDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<ExecutiveKPI[]>([]);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [marketData, setMarketData] = useState<MarketIntelligence[]>([]);
  const [revenueProjection, setRevenueProjection] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('90d');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExecutiveData();
  }, [timeRange]);

  const fetchExecutiveData = async () => {
    try {
      setLoading(true);
      
      // Call executive analytics edge function
      const { data, error } = await supabase.functions.invoke('business-intelligence', {
        body: { 
          action: 'executive_dashboard',
          timeRange,
          includeForecasting: true,
          includeMarketAnalysis: true
        }
      });

      if (error) throw error;

      // Mock sophisticated executive data
      const mockKPIs: ExecutiveKPI[] = [
        {
          label: 'Total Revenue',
          value: '$2.4M',
          change: 18.5,
          trend: 'up',
          target: '$2.8M',
          status: 'good'
        },
        {
          label: 'Monthly Recurring Revenue',
          value: '$485K',
          change: 12.3,
          trend: 'up',
          target: '$520K',
          status: 'excellent'
        },
        {
          label: 'Customer Acquisition Cost',
          value: '$47',
          change: -8.2,
          trend: 'down',
          target: '$45',
          status: 'good'
        },
        {
          label: 'Customer Lifetime Value',
          value: '$1,250',
          change: 15.7,
          trend: 'up',
          target: '$1,400',
          status: 'excellent'
        },
        {
          label: 'Gross Margin',
          value: '68.5%',
          change: 2.3,
          trend: 'up',
          target: '70%',
          status: 'good'
        },
        {
          label: 'Market Share',
          value: '12.8%',
          change: 0.8,
          trend: 'up',
          target: '15%',
          status: 'warning'
        }
      ];

      const mockInsights: StrategicInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          priority: 'high',
          title: 'Untapped Corporate Travel Market',
          description: 'Analysis shows 300% growth potential in B2B corporate bookings segment',
          impact: '$850K additional ARR potential',
          action: 'Launch enterprise sales initiative',
          deadline: '2024-03-15'
        },
        {
          id: '2',
          type: 'risk',
          priority: 'high',
          title: 'Provider Concentration Risk',
          description: '65% of revenue dependent on single provider partnership',
          impact: 'Risk of $1.2M revenue loss',
          action: 'Diversify provider portfolio',
          deadline: '2024-02-28'
        },
        {
          id: '3',
          type: 'trend',
          priority: 'medium',
          title: 'Mobile Booking Surge',
          description: 'Mobile bookings increased 145% - desktop declining',
          impact: 'User experience optimization needed',
          action: 'Accelerate mobile-first development'
        }
      ];

      const mockMarketData: MarketIntelligence[] = [
        {
          segment: 'Domestic Flights',
          marketShare: 15.2,
          growthRate: 8.5,
          competitors: [
            { name: 'Competitor A', share: 28.5, trend: 'stable' },
            { name: 'Competitor B', share: 22.1, trend: 'losing' },
            { name: 'Competitor C', share: 18.7, trend: 'gaining' }
          ],
          opportunities: ['Regional expansion', 'Business traveler focus']
        },
        {
          segment: 'International Hotels',
          marketShare: 8.9,
          growthRate: 22.3,
          competitors: [
            { name: 'Global Leader', share: 35.2, trend: 'stable' },
            { name: 'Regional Player', share: 18.4, trend: 'gaining' }
          ],
          opportunities: ['Luxury segment entry', 'Asia-Pacific expansion']
        }
      ];

      const mockRevenue = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        actual: Math.floor(Math.random() * 100000) + 150000,
        projected: Math.floor(Math.random() * 120000) + 160000,
        target: 200000 + (i * 5000)
      }));

      setKpis(mockKPIs);
      setInsights(mockInsights);
      setMarketData(mockMarketData);
      setRevenueProjection(mockRevenue);

    } catch (error) {
      console.error('Error fetching executive data:', error);
      toast({
        title: "Error",
        description: "Failed to load executive dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <ArrowUpRight className={`h-4 w-4 ${change > 0 ? 'text-green-500' : 'text-red-500'}`} />;
    }
    return <ArrowDownRight className={`h-4 w-4 ${change < 0 ? 'text-green-500' : 'text-red-500'}`} />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-5 w-5 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Executive Dashboard
          </h1>
          <p className="text-muted-foreground">Strategic insights and KPI monitoring for leadership</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30D
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90D
          </Button>
          <Button
            variant={timeRange === '1y' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('1y')}
          >
            1Y
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Strategic Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial Performance</TabsTrigger>
          <TabsTrigger value="market">Market Intelligence</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi, idx) => (
              <Card key={idx} className={`border-l-4 ${getStatusColor(kpi.status).replace('text-', 'border-l-').replace(' bg-', '')}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {kpi.label}
                  </CardTitle>
                  {getTrendIcon(kpi.trend, kpi.change)}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                    {kpi.target && (
                      <span className="text-muted-foreground">
                        Target: {kpi.target}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trajectory</CardTitle>
                <CardDescription>Actual vs projected vs target performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="projected" stroke="hsl(var(--secondary))" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="target" stroke="hsl(var(--accent))" strokeDasharray="2 2" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategic Health Score</CardTitle>
                <CardDescription>Overall business performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">87/100</div>
                  <div className="text-sm text-muted-foreground">Excellent Performance</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Financial Health</span>
                    <Badge variant="outline">92/100</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Market Position</span>
                    <Badge variant="outline">85/100</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Operational Excellence</span>
                    <Badge variant="outline">89/100</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Innovation Index</span>
                    <Badge variant="outline">82/100</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue sources and contribution analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Flight Commissions', value: 45, fill: COLORS[0] },
                        { name: 'Hotel Commissions', value: 35, fill: COLORS[1] },
                        { name: 'Activity Commissions', value: 15, fill: COLORS[2] },
                        { name: 'Service Fees', value: 5, fill: COLORS[3] }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profitability Analysis</CardTitle>
                <CardDescription>Margin trends and cost optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="space-y-4">
            {marketData.map((market, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {market.segment}
                    </CardTitle>
                    <Badge variant="outline">
                      {market.marketShare}% Market Share
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+{market.growthRate}%</div>
                      <div className="text-sm text-muted-foreground">Growth Rate</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Top Competitors</div>
                      {market.competitors.map((comp, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{comp.name}</span>
                          <div className="flex items-center gap-2">
                            <span>{comp.share}%</span>
                            <Badge variant={comp.trend === 'gaining' ? 'default' : comp.trend === 'losing' ? 'destructive' : 'secondary'}>
                              {comp.trend}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Opportunities</div>
                      {market.opportunities.map((opp, i) => (
                        <div key={i} className="text-sm text-muted-foreground">
                          • {opp}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      {insight.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(insight.priority) as any}>
                        {insight.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {insight.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{insight.description}</p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-1">Impact</div>
                      <div className="text-sm">{insight.impact}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-600 mb-1">Recommended Action</div>
                      <div className="text-sm">{insight.action}</div>
                    </div>
                  </div>

                  {insight.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {new Date(insight.deadline).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm">
                      Take Action
                    </Button>
                    <Button size="sm" variant="outline">
                      Schedule Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};