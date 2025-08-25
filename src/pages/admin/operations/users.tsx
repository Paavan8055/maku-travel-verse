import React from 'react';
import { UserManagement } from '@/components/admin/UserManagement';

const AdminUsersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>
      <UserManagement />
    </div>
  );
};

export default AdminUsersPage;