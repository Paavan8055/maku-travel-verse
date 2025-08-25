import React from 'react';
import { RealTimeMetricsDashboard } from '@/components/admin/RealTimeMetricsDashboard';

const AdminRealtimePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Real-time Metrics</h1>
        <p className="text-muted-foreground">
          Live system performance and user activity monitoring
        </p>
      </div>
      <RealTimeMetricsDashboard />
    </div>
  );
};

export default AdminRealtimePage;