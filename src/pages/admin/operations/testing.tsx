
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestTube, Play, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminTestSuite() {
  const tests = [
    {
      name: 'API Connectivity Tests',
      status: 'passed',
      lastRun: '2 hours ago',
      duration: '45s'
    },
    {
      name: 'Payment Processing Tests',
      status: 'passed',
      lastRun: '1 hour ago',
      duration: '120s'
    },
    {
      name: 'Booking Flow Tests',
      status: 'failed',
      lastRun: '30 minutes ago',
      duration: '180s'
    },
    {
      name: 'Provider Integration Tests',
      status: 'running',
      lastRun: 'Now',
      duration: '60s'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />;
      default:
        return <TestTube className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-500">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Suite</h1>
        <p className="text-muted-foreground">
          Run and monitor automated tests for system reliability
        </p>
      </div>

      <div className="flex gap-4">
        <Button className="gap-2">
          <Play className="h-4 w-4" />
          Run All Tests
        </Button>
        <Button variant="outline" className="gap-2">
          <TestTube className="h-4 w-4" />
          Run Provider Tests
        </Button>
      </div>

      <div className="grid gap-4">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(test.status)}
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                </div>
                {getStatusBadge(test.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Last run: {test.lastRun}</span>
                <span>Duration: {test.duration}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
