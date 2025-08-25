import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ABTestDashboard } from '@/components/testing/ABTestingFramework';
import { UnifiedTestSuite } from '@/components/testing/UnifiedTestSuite';
import { TestTube, Play, BarChart3 } from 'lucide-react';

const AdminTestingPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Suite & A/B Testing</h1>
        <p className="text-muted-foreground">
          Unified testing interface with automated scenarios, batch operations, and A/B experiments
        </p>
      </div>

      <Tabs defaultValue="test-suite" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test-suite" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Unified Test Suite
          </TabsTrigger>
          <TabsTrigger value="ab-testing" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            A/B Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test-suite">
          <UnifiedTestSuite />
        </TabsContent>

        <TabsContent value="ab-testing">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTestingPage;