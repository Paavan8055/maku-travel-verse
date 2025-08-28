import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, TrendingUp, Users, DollarSign, Globe, Target } from 'lucide-react';

interface AnalyticsMetric {
  title: string;
  value: string;
  change: number;
  progress?: number;
  target?: string;
  icon: React.ComponentType<any>;
}

const PartnerAnalytics: React.FC = () => {
  const metrics: AnalyticsMetric[] = [
    {
      title: 'Active Partners',
      value: '2,847',
      change: 23.5,
      progress: 57,
      target: '5,000',
      icon: Building2
    },
    {
      title: 'Partner Revenue',
      value: '$1.2M',
      change: 31.7,
      progress: 73,
      target: '$2M',
      icon: DollarSign
    },
    {
      title: 'Global Reach',
      value: '147',
      change: 18.2,
      progress: 49,
      target: '300',
      icon: Globe
    },
    {
      title: 'Partner Satisfaction',
      value: '96%',
      change: 4.8,
      progress: 96,
      target: '98%',
      icon: Target
    }
  ];

  const topPartners = [
    { name: 'Amadeus', revenue: '$240K', growth: 25.3, status: 'Growing' },
    { name: 'Hotelbeds', revenue: '$185K', growth: 18.7, status: 'Stable' },
    { name: 'Local Hotels Co.', revenue: '$95K', growth: 42.1, status: 'Growing' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Partner Analytics</h2>
        <p className="text-muted-foreground">Performance insights and partner growth metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      +{metric.change}%
                    </span>
                  </div>
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-3xl font-bold">{metric.value}</div>
                  
                  {metric.progress && metric.target && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Target: {metric.target}</span>
                        <span>{metric.progress}%</span>
                      </div>
                      <Progress value={metric.progress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPartners.map((partner, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-travel-ocean to-travel-forest rounded-full flex items-center justify-center text-white font-bold">
                    {partner.name[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold">{partner.name}</h4>
                    <p className="text-sm text-muted-foreground">Revenue: {partner.revenue}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={partner.status === 'Growing' ? 'default' : 'secondary'}>
                    {partner.status}
                  </Badge>
                  <p className="text-sm text-green-600 mt-1">+{partner.growth}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerAnalytics;