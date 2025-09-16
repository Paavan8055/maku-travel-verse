import React from 'react';
import { CorrelationTracker } from '@/components/admin/CorrelationTracker';

const AdminCorrelationPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Correlation Tracking</h1>
        <p className="text-muted-foreground">
          Track request correlation IDs and debug complex booking flows
        </p>
      </div>
      <CorrelationTracker />
    </div>
  );
};

export default AdminCorrelationPage;