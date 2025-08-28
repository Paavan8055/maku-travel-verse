
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminCriticalAlerts() {
  const alerts = [
    {
      id: 1,
      level: 'critical',
      message: 'Payment processor response time exceeded threshold',
      timestamp: '2 minutes ago',
      resolved: false
    },
    {
      id: 2,
      level: 'warning',
      message: 'High API usage detected for Sabre provider',
      timestamp: '15 minutes ago',
      resolved: false
    },
    {
      id: 3,
      level: 'info',
      message: 'Scheduled maintenance completed',
      timestamp: '1 hour ago',
      resolved: true
    }
  ];

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getAlertBadge = (level: string, resolved: boolean) => {
    if (resolved) return <Badge variant="outline">Resolved</Badge>;
    
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>;
      case 'info':
        return <Badge variant="default">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Critical Alerts</h1>
        <p className="text-muted-foreground">
          Monitor and manage system alerts and notifications
        </p>
      </div>

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className={alert.level === 'critical' ? 'border-destructive' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.level)}
                  <CardTitle className="text-lg">{alert.message}</CardTitle>
                </div>
                {getAlertBadge(alert.level, alert.resolved)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{alert.timestamp}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
