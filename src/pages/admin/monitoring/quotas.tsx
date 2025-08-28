
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Gauge, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminQuotaManagement() {
  const quotas = [
    {
      service: 'Sabre API',
      used: 8500,
      limit: 10000,
      percentage: 85,
      resetDate: '2025-01-01'
    },
    {
      service: 'HotelBeds API',
      used: 6200,
      limit: 15000,
      percentage: 41,
      resetDate: '2025-01-01'
    },
    {
      service: 'Stripe API',
      used: 2400,
      limit: 5000,
      percentage: 48,
      resetDate: '2025-01-01'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quota Management</h1>
        <p className="text-muted-foreground">
          Monitor API usage quotas and limits across all providers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quotas.map((quota) => (
          <Card key={quota.service}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{quota.service}</CardTitle>
              {quota.percentage > 80 ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <Gauge className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {quota.used.toLocaleString()} / {quota.limit.toLocaleString()}
              </div>
              <Progress value={quota.percentage} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {quota.percentage}% used • Resets {quota.resetDate}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
