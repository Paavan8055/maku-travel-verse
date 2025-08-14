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
    foundingYear: 2025,
    totalFunding: 'Pre-Seed',
    monthlyUsers: 'Building',
    partnerGrowth: 'Early Stage',
    apiCalls: 2,
    uptime: 'In Development',
    teamSize: 'Small & Focused',
    countriesLive: 'Global Vision'
  });

  const [liveMetrics, setLiveMetrics] = useState({
    developmentDays: Math.floor((new Date().getTime() - new Date('2025-06-01').getTime()) / (1000 * 60 * 60 * 24)),
    apiIntegrations: 2,
    prototypProgress: 35
  });

  useEffect(() => {
    // Update development days daily
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        ...prev,
        developmentDays: Math.floor((new Date().getTime() - new Date('2025-06-01').getTime()) / (1000 * 60 * 60 * 24)),
        prototypProgress: Math.min(prev.prototypProgress + 0.1, 100)
      }));
    }, 86400000); // Update daily

    return () => clearInterval(interval);
  }, []);

  const startupMetrics: StartupMetric[] = [
    {
      icon: Rocket,
      title: 'Days Building',
      value: `${liveMetrics.developmentDays} Days`,
      change: 'Since June 2025',
      description: 'Building every day',
      color: 'text-travel-ocean',
      progress: 25,
      target: '1 Year Strong'
    },
    {
      icon: DollarSign,
      title: 'Funding Status',
      value: metrics.totalFunding,
      change: 'Preparing',
      description: 'Building for investors',
      color: 'text-travel-gold',
      progress: 15,
      target: 'Seed Round'
    },
    {
      icon: Building2,
      title: 'API Partners',
      value: `${metrics.apiCalls} Live`,
      change: '+1 Soon',
      description: 'Amadeus, Hotelbeds',
      color: 'text-travel-coral',
      progress: 30,
      target: '5+ Integrations'
    },
    {
      icon: Users,
      title: 'Partner Interest',
      value: metrics.partnerGrowth,
      change: 'Growing Daily',
      description: 'Building waitlist',
      color: 'text-travel-forest',
      progress: 20,
      target: 'Launch Ready'
    },
    {
      icon: Zap,
      title: 'Prototype',
      value: `${Math.floor(liveMetrics.prototypProgress)}%`,
      change: 'Active Development',
      description: 'Core features',
      color: 'text-travel-sky',
      progress: liveMetrics.prototypProgress,
      target: 'Beta Launch'
    },
    {
      icon: Globe,
      title: 'Vision',
      value: metrics.countriesLive,
      change: 'From Day 1',
      description: 'Built for scale',
      color: 'text-travel-pink',
      progress: 10,
      target: 'Worldwide'
    }
  ];

  const liveStats = [
    {
      icon: Activity,
      title: 'Development',
      value: 'Active',
      subtitle: 'Building daily',
      color: 'text-green-500',
      pulse: true
    },
    {
      icon: TrendingUp,
      title: 'Progress',
      value: `${Math.floor(liveMetrics.prototypProgress)}%`,
      subtitle: 'Prototype ready',
      color: 'text-travel-ocean'
    },
    {
      icon: Building2,
      title: 'APIs',
      value: `${liveMetrics.apiIntegrations}`,
      subtitle: 'Live integrations',
      color: 'text-travel-gold'
    },
    {
      icon: Target,
      title: 'Mission',
      value: 'Clear',
      subtitle: 'Travel innovation',
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
              <div className="w-2 h-2 bg-travel-ocean rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Founded Maku.travel</h4>
                  <span className="text-sm text-muted-foreground">June 2025</span>
                </div>
                <p className="text-sm text-muted-foreground">Started with vision to revolutionize travel technology</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-travel-gold rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">API Integrations</h4>
                  <span className="text-sm text-muted-foreground">Aug 2025</span>
                </div>
                <p className="text-sm text-muted-foreground">Connected Amadeus and Hotelbeds for real inventory</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-travel-forest rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Prototype Complete</h4>
                  <span className="text-sm text-muted-foreground">Dec 2025</span>
                </div>
                <p className="text-sm text-muted-foreground">Building functional prototype with core features</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-travel-coral rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Partner Launch</h4>
                  <span className="text-sm text-muted-foreground">Q1 2026</span>
                </div>
                <p className="text-sm text-muted-foreground">Begin onboarding first wave of partners</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};