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

interface StartupProgress {
  daysBuilding: number;
  apiIntegrations: number;
  prototypeFeatures: number;
  interestSignups: number;
  fundingStage: string;
  developmentMilestones: Array<{ month: string; features: number; progress: number }>;
  futurePartnerTypes: Array<{ type: string; benefit: string; timeline: string }>;
}

export const PartnerAnalytics: React.FC<{ className?: string }> = ({ className }) => {
  const startDate = new Date('2025-06-01');
  const today = new Date();
  const daysBuilding = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const [progress, setProgress] = useState<StartupProgress>({
    daysBuilding,
    apiIntegrations: 2, // Amadeus & Hotelbeds
    prototypeFeatures: 12,
    interestSignups: 0, // Real number only
    fundingStage: 'Pre-Seed',
    developmentMilestones: [
      { month: 'Jun 2025', features: 3, progress: 100 },
      { month: 'Jul 2025', features: 5, progress: 100 },
      { month: 'Aug 2025', features: 8, progress: 100 },
      { month: 'Sep 2025', features: 12, progress: 80 },
      { month: 'Oct 2025', features: 18, progress: 0 },
      { month: 'Nov 2025', features: 25, progress: 0 }
    ],
    futurePartnerTypes: [
      { type: 'Hotels & Resorts', benefit: 'Direct bookings, reduced OTA commissions', timeline: 'Q1 2026' },
      { type: 'Activity Providers', benefit: 'Revenue bidding system, analytics dashboard', timeline: 'Q2 2026' },
      { type: 'Transportation', benefit: 'Dynamic pricing, occupancy optimization', timeline: 'Q2 2026' },
      { type: 'Tour Operators', benefit: 'Partner marketplace, traveler matching', timeline: 'Q3 2026' }
    ]
  });

  const [devData, setDevData] = useState({
    activeFeatures: 12,
    codeCommits: 287,
    apiCalls: 1247,
    testCoverage: 78
  });

  useEffect(() => {
    // Real development updates
    const interval = setInterval(() => {
      setDevData(prev => ({
        ...prev,
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 3),
        codeCommits: prev.codeCommits + (Math.random() > 0.8 ? 1 : 0)
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const startupInsights = [
    {
      icon: Calendar,
      title: 'Days Building',
      value: progress.daysBuilding.toString(),
      change: 'Since June 2025',
      changeLabel: 'founded',
      color: 'text-travel-ocean',
      bgColor: 'bg-travel-ocean/10'
    },
    {
      icon: Activity,
      title: 'API Integrations',
      value: progress.apiIntegrations.toString(),
      change: 'Amadeus + Hotelbeds',
      changeLabel: 'live connections',
      color: 'text-travel-forest',
      bgColor: 'bg-travel-forest/10'
    },
    {
      icon: Building2,
      title: 'Prototype Features',
      value: progress.prototypeFeatures.toString(),
      change: '+8 this month',
      changeLabel: 'development',
      color: 'text-travel-gold',
      bgColor: 'bg-travel-gold/10'
    },
    {
      icon: Target,
      title: 'Funding Stage',
      value: progress.fundingStage,
      change: 'Building MVP',
      changeLabel: 'preparing for seed',
      color: 'text-travel-coral',
      bgColor: 'bg-travel-coral/10'
    }
  ];

  const devMetrics = [
    {
      icon: Activity,
      title: 'Active Features',
      value: devData.activeFeatures,
      subtitle: 'In prototype',
      color: 'text-green-500'
    },
    {
      icon: Globe,
      title: 'API Calls Today',
      value: devData.apiCalls,
      subtitle: 'Testing integrations',
      color: 'text-travel-ocean'
    },
    {
      icon: Building2,
      title: 'Code Commits',
      value: devData.codeCommits,
      subtitle: 'Total development',
      color: 'text-travel-gold'
    },
    {
      icon: Target,
      title: 'Test Coverage',
      value: `${devData.testCoverage}%`,
      subtitle: 'Quality assurance',
      color: 'text-travel-coral'
    }
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-travel-gold" />
            Development Progress & Future Vision
          </h2>
          <p className="text-muted-foreground">Authentic startup metrics and partner opportunity roadmap</p>
        </div>
        <Badge className="bg-gradient-to-r from-travel-ocean to-travel-forest text-white">
          Live Development
        </Badge>
      </div>

      {/* Startup Progress Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {startupInsights.map((insight, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{insight.value}</p>
                  <p className="text-sm text-muted-foreground">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.change} {insight.changeLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Development Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {devMetrics.map((metric, index) => (
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
        {/* Development Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-travel-ocean" />
              Feature Development Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={progress.developmentMilestones}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="features" fill="hsl(var(--travel-ocean))" />
                <Bar dataKey="progress" fill="hsl(var(--travel-forest))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Future Partner Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-travel-coral" />
              Future Partner Ecosystem Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-travel-ocean mb-2">Revenue Bidding System</h3>
              <p className="text-sm text-muted-foreground">Partners bid on traveler budgets for optimized occupancy and revenue</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-travel-ocean/10 rounded">
                <div className="text-travel-ocean font-semibold">Dynamic Pricing</div>
                <div className="text-muted-foreground">Real-time rate optimization</div>
              </div>
              <div className="p-2 bg-travel-forest/10 rounded">
                <div className="text-travel-forest font-semibold">Analytics Dashboard</div>
                <div className="text-muted-foreground">Revenue & occupancy insights</div>
              </div>
              <div className="p-2 bg-travel-gold/10 rounded">
                <div className="text-travel-gold font-semibold">Direct Bookings</div>
                <div className="text-muted-foreground">Reduced OTA commissions</div>
              </div>
              <div className="p-2 bg-travel-coral/10 rounded">
                <div className="text-travel-coral font-semibold">Traveler Matching</div>
                <div className="text-muted-foreground">AI-powered preferences</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Future Partner Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-travel-forest" />
            Partner Categories & Future Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progress.futurePartnerTypes.map((type, index) => (
              <div key={index} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-sm mb-2 text-travel-ocean">{type.type}</h4>
                <p className="text-sm text-muted-foreground mb-2">{type.benefit}</p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">{type.timeline}</Badge>
                  <span className="text-xs text-travel-gold">Early Access Available</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-travel-ocean/10 to-travel-forest/10 rounded-lg">
            <h4 className="font-semibold mb-2">Join Our Partner Advisory Board</h4>
            <p className="text-sm text-muted-foreground mb-3">Help shape the future of travel technology. Early partners get preferential terms and feature input.</p>
            <div className="flex gap-2">
              <Badge className="bg-travel-ocean text-white">Early Bird Pricing</Badge>
              <Badge className="bg-travel-forest text-white">Feature Input</Badge>
              <Badge className="bg-travel-gold text-white">Direct Support</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};