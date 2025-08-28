import React from 'react';
import { UnifiedHealthDashboard } from '@/components/admin/UnifiedHealthDashboard';

const AdminProvidersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider Status</h1>
        <p className="text-muted-foreground">
          Monitor API provider health, rotation, and performance metrics
        </p>
      </div>
      <UnifiedHealthDashboard />
    </div>
  );
};

export default AdminProvidersPage;