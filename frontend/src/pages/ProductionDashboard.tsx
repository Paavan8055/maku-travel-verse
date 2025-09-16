import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Shield, 
  Database, 
  Rocket, 
  BarChart3,
  Settings,
  Activity,
  Globe
} from 'lucide-react';

// Production Components
import { ProductionOptimizer } from '@/components/production/ProductionOptimizer';
import { AdvancedCaching } from '@/components/production/AdvancedCaching';
import { SecurityCompliance } from '@/components/production/SecurityCompliance';
import { DeploymentManager } from '@/components/production/DeploymentManager';

const ProductionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Production Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Phase 4: Advanced Production Optimization & Deployment Management
          </p>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Status</p>
                  <p className="text-2xl font-bold text-green-600">Operational</p>
                </div>
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Performance</p>
                  <p className="text-2xl font-bold text-green-600">94</p>
                  <p className="text-xs text-muted-foreground">Lighthouse Score</p>
                </div>
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Security</p>
                  <p className="text-2xl font-bold text-green-600">98%</p>
                  <p className="text-xs text-muted-foreground">Compliance</p>
                </div>
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold text-green-600">99.95%</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <Globe className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Optimization</span>
            </TabsTrigger>
            <TabsTrigger value="caching" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Caching</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="deployment" className="flex items-center space-x-2">
              <Rocket className="h-4 w-4" />
              <span>Deployment</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Production Health Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Key Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span>Performance Score</span>
                          <Badge variant="default">A+ (94/100)</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span>Bundle Size</span>
                          <Badge variant="outline">890KB (↓24%)</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <span>Cache Hit Rate</span>
                          <Badge variant="secondary">87.3%</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <span>Security Score</span>
                          <Badge variant="default">98% Compliant</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">System Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span>Production Environment</span>
                          </div>
                          <span className="text-sm text-muted-foreground">v2.1.1</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span>CDN & Edge Servers</span>
                          </div>
                          <span className="text-sm text-muted-foreground">8/8 Active</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span>Database Cluster</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Healthy</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span>Monitoring & Alerts</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phase 4: Production Optimization Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-medium">Performance Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Bundle splitting, lazy loading, image optimization
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Database className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-medium">Advanced Caching</h4>
                      <p className="text-sm text-muted-foreground">
                        Multi-layer caching with intelligent invalidation
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium">Security & Compliance</h4>
                      <p className="text-sm text-muted-foreground">
                        GDPR/CCPA compliance, vulnerability scanning
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Rocket className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <h4 className="font-medium">Deployment Management</h4>
                      <p className="text-sm text-muted-foreground">
                        CI/CD pipeline, zero-downtime deployments
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimization">
            <ProductionOptimizer />
          </TabsContent>

          <TabsContent value="caching">
            <AdvancedCaching />
          </TabsContent>

          <TabsContent value="security">
            <SecurityCompliance />
          </TabsContent>

          <TabsContent value="deployment">
            <DeploymentManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductionDashboard;