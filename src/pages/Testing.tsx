import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, Smartphone, Gauge, Heart } from 'lucide-react';
import { EndToEndTestSuite } from '@/components/testing/EndToEndTestSuite';
import { MobileTestingSuite } from '@/components/testing/MobileTestingSuite';
import { PerformanceValidationDashboard } from '@/components/testing/PerformanceValidationDashboard';
import { HealthCheckValidator } from '@/components/testing/HealthCheckValidator';
import { ProductionValidationSuite } from '@/components/testing/ProductionValidationSuite';

export default function Testing() {
  const [activeTab, setActiveTab] = useState('e2e');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Testing & Validation Suite</h1>
          <p className="text-muted-foreground">
            Comprehensive testing tools for ensuring application quality and performance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="e2e" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              E2E Tests
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Tests
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Health Check
            </TabsTrigger>
          </TabsList>

          <TabsContent value="e2e" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  End-to-End Testing
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">Booking Flows</Badge>
                  <Badge variant="outline">API Integration</Badge>
                  <Badge variant="outline">User Journeys</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <EndToEndTestSuite />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile Testing
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">Responsive Design</Badge>
                  <Badge variant="outline">Touch Compatibility</Badge>
                  <Badge variant="outline">Device Testing</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <MobileTestingSuite />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Performance Validation
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">Core Web Vitals</Badge>
                  <Badge variant="outline">Load Times</Badge>
                  <Badge variant="outline">Memory Usage</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <PerformanceValidationDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Health Check Validation
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">Service Monitoring</Badge>
                  <Badge variant="outline">Alert Testing</Badge>
                  <Badge variant="outline">Error Recovery</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <HealthCheckValidator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}