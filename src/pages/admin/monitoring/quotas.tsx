import React from 'react';
import { QuotaDashboard } from '@/components/quota/QuotaDashboard';

const AdminQuotasPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quota Management</h1>
        <p className="text-muted-foreground">
          Monitor API provider quotas, usage limits, and availability
        </p>
      </div>
      <QuotaDashboard />
    </div>
  );
};

export default AdminQuotasPage;