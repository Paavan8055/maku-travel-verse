import React from 'react';
import { UnifiedHealthDashboard } from '@/components/admin/UnifiedHealthDashboard';
const AdminHealthPage = () => {
  return <div className="space-y-6">
      <div>
        
        <p className="text-muted-foreground">
          Comprehensive provider health, quota management, and circuit breaker monitoring
        </p>
      </div>
      <UnifiedHealthDashboard />
    </div>;
};
export default AdminHealthPage;