import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, 
  Building2, 
  Globe, 
  DollarSign,
  Users,
  Calendar,
  Star,
  Activity,
  Target
} from 'lucide-react';

interface PartnerMetrics {
  totalPartners: number;
  newPartnersThisMonth: number;
  averageRevenue: number;
  bookingGrowth: number;
  partnerSatisfaction: number;
  activePartnersByRegion: Array<{ name: string; value: number; color: string }>;
  monthlyGrowth: Array<{ month: string; partners: number; revenue: number }>;
  partnerTypes: Array<{ type: string; count: number; growth: string }>;
}

export const PartnerAnalytics: React.FC<{ className?: string }> = ({ className }) => {
  const [analytics, setAnalytics] = useState<PartnerMetrics>({
    totalPartners: 2847,
    newPartnersThisMonth: 156,
    averageRevenue: 8500,
    bookingGrowth: 23.5,
    partnerSatisfaction: 96,
    activePartnersByRegion: [
      { name: 'Asia Pacific', value: 1200, color: '#FF6B6B' },
      { name: 'North America', value: 800, color: '#4ECDC4' },
      { name: 'Europe', value: 650, color: '#45B7D1' },
      { name: 'Latin America', value: 150, color: '#96CEB4' },
      { name: 'Africa', value: 47, color: '#FFEAA7' }
    ],
    monthlyGrowth: [
      { month: 'Jan', partners: 2200, revenue: 15.2 },
      { month: 'Feb', partners: 2350, revenue: 16.8 },
      { month: 'Mar', partners: 2480, revenue: 18.1 },
      { month: 'Apr', partners: 2620, revenue: 19.7 },
      { month: 'May', partners: 2750, revenue: 21.3 },
      { month: 'Jun', partners: 2847, revenue: 22.8 }
    ],
    partnerTypes: [
      { type: 'Hotels & Resorts', count: 1520, growth: '+18%' },
      { type: 'Tour Operators', count: 680, growth: '+25%' },
      { type: 'Activity Providers', count: 420, growth: '+32%' },
      { type: 'Transportation', count: 227, growth: '+15%' }
    ]
  });

  const [liveData, setLiveData] = useState({
    onlinePartners: 1847,
    activeBookings: 245,
    pendingPayouts: 89,
    supportTickets: 12
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLiveData(prev => ({
        ...prev,
        activeBookings: prev.activeBookings + Math.floor(Math.random() * 5) - 2,
        onlinePartners: prev.onlinePartners + Math.floor(Math.random() * 10) - 5
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const partnerInsights = [
    {
      icon: Building2,
      title: 'Total Partners',
      value: analytics.totalPartners.toLocaleString(),
      change: `+${analytics.newPartnersThisMonth}`,
      changeLabel: 'this month',
      color: 'text-travel-ocean',
      bgColor: 'bg-travel-ocean/10'
    },
    {
      icon: DollarSign,
      title: 'Avg Partner Revenue',
      value: `$${analytics.averageRevenue.toLocaleString()}`,
      change: `+${analytics.bookingGrowth}%`,
      changeLabel: 'vs last month',
      color: 'text-travel-gold',
      bgColor: 'bg-travel-gold/10'
    },
    {
      icon: TrendingUp,
      title: 'Booking Growth',
      value: `${analytics.bookingGrowth}%`,
      change: '+5.2%',
      changeLabel: 'vs last quarter',
      color: 'text-travel-forest',
      bgColor: 'bg-travel-forest/10'
    },
    {
      icon: Star,
      title: 'Partner Satisfaction',
      value: `${analytics.partnerSatisfaction}%`,
      change: '+2%',
      changeLabel: 'improvement',
      color: 'text-travel-coral',
      bgColor: 'bg-travel-coral/10'
    }
  ];

  const realTimeMetrics = [
    {
      icon: Activity,
      title: 'Online Partners',
      value: liveData.onlinePartners,
      subtitle: 'Currently active',
      color: 'text-green-500'
    },
    {
      icon: Calendar,
      title: 'Active Bookings',
      value: liveData.activeBookings,
      subtitle: 'Being processed',
      color: 'text-travel-ocean'
    },
    {
      icon: DollarSign,
      title: 'Pending Payouts',
      value: liveData.pendingPayouts,
      subtitle: 'Ready for payment',
      color: 'text-travel-gold'
    },
    {
      icon: Users,
      title: 'Support Tickets',
      value: liveData.supportTickets,
      subtitle: 'Open issues',
      color: 'text-travel-coral'
    }
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-travel-gold" />
            Partner Ecosystem Analytics
          </h2>
          <p className="text-muted-foreground">Real-time insights into our global partner network</p>
        </div>
        <Badge className="bg-gradient-to-r from-travel-ocean to-travel-forest text-white">
          Live Data
        </Badge>
      </div>

      {/* Key Partner Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {partnerInsights.map((insight, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{insight.value}</p>
                  <p className="text-sm text-muted-foreground">{insight.title}</p>
                  <p className="text-xs text-green-600">{insight.change} {insight.changeLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {realTimeMetrics.map((metric, index) => (
          <Card key={index} className="border-dashed">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <metric.icon className={`h-5 w-5 ${metric.color} mr-2`} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Partner Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-travel-ocean" />
              Partner Growth & Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="partners" fill="hsl(var(--travel-ocean))" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--travel-gold))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Regional Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-travel-coral" />
              Partner Distribution by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.activePartnersByRegion}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.activePartnersByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Partner Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-travel-forest" />
            Partner Categories & Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.partnerTypes.map((type, index) => (
              <div key={index} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-sm mb-2">{type.type}</h4>
                <p className="text-2xl font-bold text-travel-ocean">{type.count}</p>
                <p className="text-sm text-green-600">{type.growth} growth</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};