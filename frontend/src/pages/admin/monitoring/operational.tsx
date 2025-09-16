import React from 'react';
import { OperationalDashboard } from '@/components/admin/OperationalDashboard';

const AdminOperationalPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Operational Excellence</h1>
        <p className="text-muted-foreground">
          Advanced analytics, correlation tracking, and self-healing capabilities
        </p>
      </div>
      <OperationalDashboard />
    </div>
  );
};

export default AdminOperationalPage;