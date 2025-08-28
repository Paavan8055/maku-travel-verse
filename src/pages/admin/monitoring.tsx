import React from 'react';
import { EnhancedHealthDashboard } from '@/components/admin';

const AdminMonitoring = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">System Health Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of provider rotation, quota management, and system health
          </p>
        </div>
        <EnhancedHealthDashboard />
      </div>
    </div>
  );
};

export default AdminMonitoring;