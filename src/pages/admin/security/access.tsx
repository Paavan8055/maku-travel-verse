import React from 'react';
import { SecuritySettingsGuide } from '@/components/admin/SecuritySettingsGuide';
import { SecurityMonitoring } from '@/components/admin/SecurityMonitoring';

const AdminSecurityPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security & Access Control</h1>
        <p className="text-muted-foreground">
          Manage user roles, permissions, and security monitoring
        </p>
      </div>
      <div className="space-y-6">
        <SecuritySettingsGuide />
        <SecurityMonitoring />
      </div>
    </div>
  );
};

export default AdminSecurityPage;