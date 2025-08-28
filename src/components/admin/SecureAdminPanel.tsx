import React from 'react';
import { AdminGuard } from '@/features/auth/components/AdminGuard';
import { EmergencyFixPanel } from '@/components/EmergencyFixPanel';
import { SystemHardeningPanel } from '@/components/SystemHardeningPanel';
import { SecureAdminDashboard } from '@/components/SecureAdminDashboard';
import { TestingFrameworkDashboard } from '@/components/TestingFrameworkDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export const SecureAdminPanel = () => {
  return (
    <AdminGuard redirectTo="/">
      <div className="min-h-screen bg-background">
        <div className="bg-destructive/5 border-y border-destructive/20 py-6">
          <div className="max-w-6xl mx-auto px-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Control Panel
                </CardTitle>
                <CardDescription>
                  Emergency fixes and system administration tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EmergencyFixPanel />
                  <SystemHardeningPanel />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SecureAdminDashboard />
                  <TestingFrameworkDashboard />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};