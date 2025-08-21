import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, Users, Calendar, Target } from 'lucide-react';

interface KPI {
  name: string;
  value: number;
  unit: string;
  change: number;
  target?: number;
  icon: React.ComponentType<any>;
}

const StartupMetrics: React.FC = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);

  useEffect(() => {
    setKpis([
      {
        name: 'Monthly Revenue',
        value: 12400,
        unit: 'USD',
        change: 23.5,
        target: 15000,
        icon: DollarSign
      },
      {
        name: 'Active Users', 
        value: 2847,
        unit: 'users',
        change: 18.2,
        target: 5000,
        icon: Users
      },
      {
        name: 'Total Bookings',
        value: 1234,
        unit: 'bookings', 
        change: 31.7,
        target: 2000,
        icon: Calendar
      },
      {
        name: 'Conversion Rate',
        value: 3.2,
        unit: '%',
        change: 0.8,
        target: 5.0,
        icon: Target
      }
    ]);
  }, []);

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