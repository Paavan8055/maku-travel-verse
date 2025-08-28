
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Database, Server, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminSystemDiagnostics() {
  const diagnostics = [
    {
      component: 'Database Connection',
      status: 'healthy',
      latency: '12ms',
      lastCheck: '1 min ago',
      icon: Database
    },
    {
      component: 'API Gateway',
      status: 'healthy',
      latency: '45ms',
      lastCheck: '2 min ago',
      icon: Server
    },
    {
      component: 'Payment Processor',
      status: 'degraded',
      latency: '890ms',
      lastCheck: '3 min ago',
      icon: Wifi
    },
    {
      component: 'Provider Services',
      status: 'healthy',
      latency: '234ms',
      lastCheck: '1 min ago',
      icon: Activity
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="secondary">Degraded</Badge>;
      case 'down':
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Diagnostics</h1>
        <p className="text-muted-foreground">
          Run diagnostic checks on system components
        </p>
      </div>

      <div className="flex gap-4">
        <Button>Run Full Diagnostics</Button>
        <Button variant="outline">Network Test</Button>
        <Button variant="outline">Performance Test</Button>
      </div>

      <div className="grid gap-4">
        {diagnostics.map((diagnostic, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <diagnostic.icon className="h-5 w-5" />
                  <CardTitle className="text-lg">{diagnostic.component}</CardTitle>
                </div>
                {getStatusBadge(diagnostic.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Latency: {diagnostic.latency}</span>
                <span>Last check: {diagnostic.lastCheck}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
