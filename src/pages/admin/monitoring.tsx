import React from 'react';
import { EnhancedProductionDashboard } from '@/components/admin';

const AdminMonitoring = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <EnhancedProductionDashboard />
      </div>
    </div>
  );
};

export default AdminMonitoring;