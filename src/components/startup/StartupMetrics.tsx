import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  TrendingUp, 
  Users, 
  Building2, 
  Zap,
  Globe,
  DollarSign,
  Star,
  Activity,
  Target,
  Clock
} from 'lucide-react';

interface StartupMetric {
  icon: React.ElementType;
  title: string;
  value: string | number;
  change: string;
  description: string;
  color: string;
  progress?: number;
  target?: string;
}

export const StartupMetrics: React.FC<{ className?: string }> = ({ className }) => {
  const [metrics, setMetrics] = useState({
    foundingYear: 2023,
    totalFunding: '2.5M',
    monthlyUsers: 45670,
    partnerGrowth: 156,
    apiCalls: 2.8,
    uptime: 99.97,
    teamSize: 24,
    countriesLive: 15
  });

  const [liveMetrics, setLiveMetrics] = useState({
    activeUsers: 1247,
    bookingsToday: 89,
    revenueToday: 15600
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        bookingsToday: prev.bookingsToday + Math.floor(Math.random() * 3),
        revenueToday: prev.revenueToday + Math.floor(Math.random() * 500)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const startupMetrics: StartupMetric[] = [
    {
      icon: Rocket,
      title: 'Company Age',
      value: `${new Date().getFullYear() - metrics.foundingYear} years`,
      change: 'Since 2023',
      description: 'Founded in Sydney',
      color: 'text-travel-ocean',
      progress: 65,
      target: 'Series A Ready'
    },
    {
      icon: DollarSign,
      title: 'Total Funding',
      value: `$${metrics.totalFunding}`,
      change: '+50% YoY',
      description: 'Seed funding raised',
      color: 'text-travel-gold',
      progress: 40,
      target: '$5M Series A'
    },
    {
      icon: Users,
      title: 'Monthly Users',
      value: metrics.monthlyUsers.toLocaleString(),
      change: '+234% YoY',
      description: 'Active travelers',
      color: 'text-travel-coral',
      progress: 75,
      target: '100K users'
    },
    {
      icon: Building2,
      title: 'Partner Growth',
      value: `+${metrics.partnerGrowth}%`,
      change: 'This quarter',
      description: 'New partners joined',
      color: 'text-travel-forest',
      progress: 85,
      target: '5000 partners'
    },
    {
      icon: Zap,
      title: 'API Calls',
      value: `${metrics.apiCalls}M`,
      change: '+89% monthly',
      description: 'Per month',
      color: 'text-travel-sky',
      progress: 60,
      target: '10M calls/month'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      value: `${metrics.countriesLive}`,
      change: '+3 this quarter',
      description: 'Countries live',
      color: 'text-travel-pink',
      progress: 50,
      target: '30 countries'
    }
  ];

  const liveStats = [
    {
      icon: Activity,
      title: 'Users Online',
      value: liveMetrics.activeUsers.toLocaleString(),
      subtitle: 'Right now',
      color: 'text-green-500',
      pulse: true
    },
    {
      icon: TrendingUp,
      title: 'Bookings Today',
      value: liveMetrics.bookingsToday,
      subtitle: 'Since midnight',
      color: 'text-travel-ocean'
    },
    {
      icon: DollarSign,
      title: 'Revenue Today',
      value: `$${liveMetrics.revenueToday.toLocaleString()}`,
      subtitle: 'Partner earnings',
      color: 'text-travel-gold'
    },
    {
      icon: Star,
      title: 'System Uptime',
      value: `${metrics.uptime}%`,
      subtitle: 'Last 30 days',
      color: 'text-travel-forest'
    }
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-travel-gold" />
            Startup Metrics
          </h2>
          <p className="text-muted-foreground">Real-time performance and growth indicators</p>
        </div>
        <Badge className="bg-gradient-to-r from-travel-ocean to-travel-forest text-white">
          Series A Track
        </Badge>
      </div>

      {/* Live Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {liveStats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className="relative">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  {stat.pulse && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {startupMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{metric.title}</h3>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-sm text-green-600">{metric.change}</p>
                </div>
              </div>
              
              {metric.progress && metric.target && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress to {metric.target}</span>
                    <span className="font-medium">{metric.progress}%</span>
                  </div>
                  <Progress value={metric.progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Startup Story Timeline */}
      <Card className="bg-gradient-to-r from-travel-ocean/5 to-travel-forest/5 border-travel-ocean/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-travel-ocean" />
            Our Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-travel-ocean rounded-full"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Founded Maku.travel</h4>
                  <span className="text-sm text-muted-foreground">January 2023</span>
                </div>
                <p className="text-sm text-muted-foreground">Started with a vision to revolutionize travel booking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-travel-gold rounded-full"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Seed Funding Secured</h4>
                  <span className="text-sm text-muted-foreground">June 2023</span>
                </div>
                <p className="text-sm text-muted-foreground">$2.5M raised from leading VCs and angel investors</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-travel-forest rounded-full"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">First 1000 Partners</h4>
                  <span className="text-sm text-muted-foreground">March 2024</span>
                </div>
                <p className="text-sm text-muted-foreground">Reached major milestone with global partner network</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-travel-coral rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">AI Platform Launch</h4>
                  <span className="text-sm text-muted-foreground">Current</span>
                </div>
                <p className="text-sm text-muted-foreground">Launching AI-powered features and smart recommendations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};