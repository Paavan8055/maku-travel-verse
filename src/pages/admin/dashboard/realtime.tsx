
import React from 'react';
import { RealTimeMetricsDashboard } from '@/components/admin/RealTimeMetricsDashboard';

export default function AdminRealtimeMetrics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Real-time Metrics</h1>
        <p className="text-muted-foreground">
          Monitor live system performance and user activity
        </p>
      </div>
      <RealTimeMetricsDashboard />
    </div>
  );
}
