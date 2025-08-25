import React from 'react';
import { SearchStatusDashboard } from '@/components/admin/SearchStatusDashboard';

const AdminProvidersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider Status</h1>
        <p className="text-muted-foreground">
          Monitor API provider health, rotation, and performance metrics
        </p>
      </div>
      <SearchStatusDashboard />
    </div>
  );
};

export default AdminProvidersPage;