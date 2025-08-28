import React from 'react';
import { UnifiedHealthDashboard } from '@/components/admin/UnifiedHealthDashboard';

const AdminHealthPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unified System Health</h1>
        <p className="text-muted-foreground">
          Comprehensive provider health, quota management, and circuit breaker monitoring
        </p>
      </div>
      <UnifiedHealthDashboard />
    </div>
  );
};

export default AdminHealthPage;