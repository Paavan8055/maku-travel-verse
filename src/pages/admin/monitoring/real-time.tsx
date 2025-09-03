import React from 'react';
import { RealTimeMonitoringDashboard } from '@/components/admin/RealTimeMonitoringDashboard';

const AdminRealTimeMonitoringPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Real-Time Monitoring</h1>
        <p className="text-muted-foreground">
          Live system health, performance metrics, and operational status
        </p>
      </div>
      <RealTimeMonitoringDashboard />
    </div>
  );
};

export default AdminRealTimeMonitoringPage;