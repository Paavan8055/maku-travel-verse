import React from 'react';
import { EnhancedHealthDashboard } from '@/components/admin/EnhancedHealthDashboard';

const AdminHealthPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Health</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of provider rotation, quota management, and system health
        </p>
      </div>
      <EnhancedHealthDashboard />
    </div>
  );
};

export default AdminHealthPage;