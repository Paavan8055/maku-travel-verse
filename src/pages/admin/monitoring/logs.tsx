
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, AlertCircle } from 'lucide-react';

export default function AdminPerformanceLogs() {
  const logs = [
    {
      id: 1,
      timestamp: '2025-01-28 14:23:45',
      level: 'ERROR',
      service: 'sabre-flight-search',
      message: 'API timeout after 30 seconds',
      responseTime: '30000ms'
    },
    {
      id: 2,
      timestamp: '2025-01-28 14:22:12',
      level: 'WARN',
      service: 'hotelbeds-search',
      message: 'High response time detected',
      responseTime: '2500ms'
    },
    {
      id: 3,
      timestamp: '2025-01-28 14:21:33',
      level: 'INFO',
      service: 'booking-confirmation',
      message: 'Booking processed successfully',
      responseTime: '450ms'
    },
    {
      id: 4,
      timestamp: '2025-01-28 14:20:18',
      level: 'INFO',
      service: 'stripe-payment',
      message: 'Payment processed',
      responseTime: '320ms'
    }
  ];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      case 'WARN':
        return <Badge variant="secondary">Warning</Badge>;
      case 'INFO':
        return <Badge variant="default">Info</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Logs</h1>
        <p className="text-muted-foreground">
          View detailed system performance and error logs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent System Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                  </div>
                  {getLevelBadge(log.level)}
                  <span className="font-medium">{log.service}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm">{log.message}</p>
                  <p className="text-xs text-muted-foreground">{log.responseTime}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
