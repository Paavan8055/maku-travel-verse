import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ABTestDashboard } from '@/components/testing/ABTestingFramework';
import { TestTube } from 'lucide-react';

const AdminTestingPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Suite & A/B Testing</h1>
        <p className="text-muted-foreground">
          Manage automated tests, deployment testing, and A/B experiments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            A/B Testing Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ABTestDashboard />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTestingPage;