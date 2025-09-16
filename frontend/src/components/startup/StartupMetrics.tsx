import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, Users, Calendar, Target, Loader2 } from 'lucide-react';
import { useStartupMetrics } from '@/hooks/useStartupMetrics';

interface KPI {
  name: string;
  value: number;
  unit: string;
  change: number;
  target?: number;
  icon: React.ComponentType<any>;
}

const StartupMetrics: React.FC = () => {
  const { metrics, loading, error } = useStartupMetrics();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Startup Metrics</h1>
          <p className="text-muted-foreground">Key performance indicators</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Startup Metrics</h1>
          <p className="text-muted-foreground">Key performance indicators</p>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading metrics: {error}</p>
        </div>
      </div>
    );
  }

  const kpis: KPI[] = [
    {
      name: 'Monthly Revenue',
      value: metrics?.monthlyRevenue || 0,
      unit: 'USD',
      change: metrics?.revenueChange || 0,
      target: 15000,
      icon: DollarSign
    },
    {
      name: 'Active Users', 
      value: metrics?.activeUsers || 0,
      unit: 'users',
      change: metrics?.usersChange || 0,
      target: 5000,
      icon: Users
    },
    {
      name: 'Total Bookings',
      value: metrics?.totalBookings || 0,
      unit: 'bookings', 
      change: metrics?.bookingsChange || 0,
      target: 2000,
      icon: Calendar
    },
    {
      name: 'Conversion Rate',
      value: metrics?.conversionRate || 0,
      unit: '%',
      change: metrics?.conversionChange || 0,
      target: 5.0,
      icon: Target
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Startup Metrics</h1>
        <p className="text-muted-foreground">Key performance indicators</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      +{kpi.change}%
                    </span>
                  </div>
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold">
                      {kpi.value.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {kpi.unit}
                    </span>
                  </div>
                  
                  {kpi.target && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Target</span>
                        <span>{kpi.target.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={Math.min((kpi.value / kpi.target) * 100, 100)}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StartupMetrics;