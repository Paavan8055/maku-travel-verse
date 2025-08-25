import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProviderPerformanceAnalytics } from '@/components/analytics/ProviderPerformanceAnalytics';
import { PredictiveMonitoring } from '@/components/analytics/PredictiveMonitoring';
import { BusinessIntelligenceDashboard } from '@/components/analytics/BusinessIntelligenceDashboard';
import { DataExportManager } from '@/components/analytics/DataExportManager';
import { RevenueAnalyticsDashboard } from '@/components/hotel/RevenueAnalyticsDashboard';

const AdminAnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive business intelligence and predictive insights
        </p>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Provider Performance</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Monitoring</TabsTrigger>
          <TabsTrigger value="business">Business Intelligence</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <ProviderPerformanceAnalytics />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveMonitoring />
        </TabsContent>

        <TabsContent value="business">
          <BusinessIntelligenceDashboard />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="export">
          <DataExportManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsPage;