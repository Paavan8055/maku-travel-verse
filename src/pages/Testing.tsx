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
import { ComprehensiveTestSuite } from '@/components/testing/ComprehensiveTestSuite';
import { RealTimeMetricsCard } from '@/components/admin/RealTimeMetricsCard';
import { SecurityAuditPanel } from '@/components/admin/SecurityAuditPanel';
import { LoadTestingDashboard } from '@/components/admin/LoadTestingDashboard';
import { PerformanceValidationDashboard as AdminPerfValidation } from '@/components/admin/PerformanceValidationDashboard';

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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="phase4" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Phase 4
            </TabsTrigger>
            <TabsTrigger value="comprehensive" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              All Tests
            </TabsTrigger>
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
            <TabsTrigger value="production" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Production
            </TabsTrigger>
            <TabsTrigger value="load" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Load Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phase4" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <RealTimeMetricsCard />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security & Compliance Audit</CardTitle>
                </CardHeader>
                <CardContent>
                  <SecurityAuditPanel />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Comprehensive Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComprehensiveTestSuite />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comprehensive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Comprehensive Test Suite
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">All Categories</Badge>
                  <Badge variant="outline">Automated Testing</Badge>
                  <Badge variant="outline">Performance Monitoring</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ComprehensiveTestSuite />
              </CardContent>
            </Card>
          </TabsContent>

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

          <TabsContent value="production" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Production Validation
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">Edge Functions</Badge>
                  <Badge variant="outline">Provider Status</Badge>
                  <Badge variant="outline">Critical Path</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ProductionValidationSuite />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="load" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Load Testing Dashboard
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">Concurrent Users</Badge>
                  <Badge variant="outline">Response Times</Badge>
                  <Badge variant="outline">Scalability</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <LoadTestingDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}