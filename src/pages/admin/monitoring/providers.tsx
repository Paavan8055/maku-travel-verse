import React from 'react';
import { ConsolidatedHealthDashboard } from '@/components/admin/ConsolidatedHealthDashboard';

const AdminProvidersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider Status</h1>
        <p className="text-muted-foreground">
          Monitor API provider health, rotation, and performance metrics
        </p>
      </div>
      <ConsolidatedHealthDashboard />
    </div>
  );
};

export default AdminProvidersPage;