
import React from 'react';
import { UnifiedHealthDashboard } from '@/components/admin/UnifiedHealthDashboard';

export default function AdminSystemHealth() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground">
          Monitor overall system health and service status
        </p>
      </div>
      <UnifiedHealthDashboard />
    </div>
  );
}
