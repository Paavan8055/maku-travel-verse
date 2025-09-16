import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, TrendingUp, Users, DollarSign, Globe, Target, Loader2 } from 'lucide-react';
import { usePartnerMetrics } from '@/hooks/usePartnerMetrics';

interface AnalyticsMetric {
  title: string;
  value: string;
  change: number;
  progress?: number;
  target?: string;
  icon: React.ComponentType<any>;
}

const PartnerAnalytics: React.FC = () => {
  const { metrics: partnerMetrics, topPartners, loading, error } = usePartnerMetrics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Partner Analytics</h2>
          <p className="text-muted-foreground">Performance insights and partner growth metrics</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Partner Analytics</h2>
          <p className="text-muted-foreground">Performance insights and partner growth metrics</p>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading partner analytics: {error}</p>
        </div>
      </div>
    );
  }

  const metrics: AnalyticsMetric[] = [
    {
      title: 'Active Partners',
      value: partnerMetrics?.activePartners.toLocaleString() || '0',
      change: partnerMetrics?.partnersChange || 0,
      progress: Math.min((partnerMetrics?.activePartners || 0) / 5000 * 100, 100),
      target: '5,000',
      icon: Building2
    },
    {
      title: 'Partner Revenue',
      value: `$${((partnerMetrics?.partnerRevenue || 0) / 1000000).toFixed(1)}M`,
      change: partnerMetrics?.revenueChange || 0,
      progress: Math.min((partnerMetrics?.partnerRevenue || 0) / 2000000 * 100, 100),
      target: '$2M',
      icon: DollarSign
    },
    {
      title: 'Global Reach',
      value: partnerMetrics?.globalReach.toString() || '0',
      change: partnerMetrics?.reachChange || 0,
      progress: Math.min((partnerMetrics?.globalReach || 0) / 300 * 100, 100),
      target: '300',
      icon: Globe
    },
    {
      title: 'Partner Satisfaction',
      value: `${partnerMetrics?.partnerSatisfaction || 0}%`,
      change: partnerMetrics?.satisfactionChange || 0,
      progress: partnerMetrics?.partnerSatisfaction || 0,
      target: '98%',
      icon: Target
    }
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
                    <p className="text-sm text-muted-foreground">Revenue: ${(partner.revenue / 1000).toFixed(0)}K</p>
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