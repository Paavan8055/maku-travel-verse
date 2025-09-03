import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle, AlertTriangle, FileText, Lock, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminCompliancePage = () => {
  const { data: complianceData, isLoading, refetch } = useQuery({
    queryKey: ['admin-compliance-status'],
    queryFn: async () => {
      // Mock compliance data - in real implementation, this would come from actual compliance checks
      return {
        gdprCompliance: {
          status: 'compliant',
          score: 95,
          lastAudit: '2024-01-15',
          issues: []
        },
        pciCompliance: {
          status: 'compliant',
          score: 98,
          lastAudit: '2024-01-10',
          issues: []
        },
        isoCompliance: {
          status: 'partial',
          score: 78,
          lastAudit: '2024-01-05',
          issues: ['Documentation update required', 'Security policy review needed']
        },
        dataRetention: {
          status: 'compliant',
          score: 92,
          policies: ['User data: 7 years', 'Booking data: 10 years', 'Logs: 1 year']
        },
        securityScan: {
          lastScan: '2024-01-20',
          vulnerabilities: 2,
          criticalIssues: 0,
          status: 'good'
        }
      };
    },
    refetchInterval: 300000 // 5 minutes
  });

  const getComplianceColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'compliant': return 'default';
      case 'partial': return 'secondary';
      case 'non-compliant': return 'destructive';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Compliance Status
          </h1>
          <p className="text-muted-foreground">
            Monitor regulatory compliance and security standards
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GDPR Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${getScoreColor(complianceData?.gdprCompliance?.score || 0)}`}>
                {complianceData?.gdprCompliance?.score || 0}%
              </div>
              <Badge variant={getComplianceColor(complianceData?.gdprCompliance?.status || 'unknown')}>
                {complianceData?.gdprCompliance?.status || 'Unknown'}
              </Badge>
            </div>
            <Progress value={complianceData?.gdprCompliance?.score || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PCI DSS</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${getScoreColor(complianceData?.pciCompliance?.score || 0)}`}>
                {complianceData?.pciCompliance?.score || 0}%
              </div>
              <Badge variant={getComplianceColor(complianceData?.pciCompliance?.status || 'unknown')}>
                {complianceData?.pciCompliance?.status || 'Unknown'}
              </Badge>
            </div>
            <Progress value={complianceData?.pciCompliance?.score || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ISO 27001</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${getScoreColor(complianceData?.isoCompliance?.score || 0)}`}>
                {complianceData?.isoCompliance?.score || 0}%
              </div>
              <Badge variant={getComplianceColor(complianceData?.isoCompliance?.status || 'unknown')}>
                {complianceData?.isoCompliance?.status || 'Unknown'}
              </Badge>
            </div>
            <Progress value={complianceData?.isoCompliance?.score || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Scan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceData?.securityScan?.vulnerabilities || 0}
            </div>
            <p className="text-xs text-muted-foreground">vulnerabilities found</p>
            <Badge variant={complianceData?.securityScan?.criticalIssues ? 'destructive' : 'default'} className="mt-2">
              {complianceData?.securityScan?.status || 'Unknown'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Compliance Overview</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR Details</TabsTrigger>
          <TabsTrigger value="pci">PCI DSS</TabsTrigger>
          <TabsTrigger value="data">Data Retention</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">GDPR (General Data Protection Regulation)</h4>
                      <p className="text-sm text-muted-foreground">
                        Last audit: {complianceData?.gdprCompliance?.lastAudit}
                      </p>
                    </div>
                    <Badge variant={getComplianceColor(complianceData?.gdprCompliance?.status || 'unknown')}>
                      {complianceData?.gdprCompliance?.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">PCI DSS (Payment Card Industry)</h4>
                      <p className="text-sm text-muted-foreground">
                        Last audit: {complianceData?.pciCompliance?.lastAudit}
                      </p>
                    </div>
                    <Badge variant={getComplianceColor(complianceData?.pciCompliance?.status || 'unknown')}>
                      {complianceData?.pciCompliance?.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">ISO 27001 (Information Security)</h4>
                      <p className="text-sm text-muted-foreground">
                        Last audit: {complianceData?.isoCompliance?.lastAudit}
                      </p>
                      {complianceData?.isoCompliance?.issues?.length > 0 && (
                        <div className="mt-2">
                          {complianceData.isoCompliance.issues.map((issue, index) => (
                            <Badge key={index} variant="outline" className="mr-2 mb-1">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant={getComplianceColor(complianceData?.isoCompliance?.status || 'unknown')}>
                      {complianceData?.isoCompliance?.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gdpr">
          <Card>
            <CardHeader>
              <CardTitle>GDPR Compliance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Data Subject Rights</h4>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Right to Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Right to Erasure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Right to Portability</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Technical Measures</h4>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Data Encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Access Controls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Audit Logging</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pci">
          <Card>
            <CardHeader>
              <CardTitle>PCI DSS Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">PCI DSS Details</h3>
                <p className="text-muted-foreground">
                  Detailed PCI DSS compliance reporting coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceData?.dataRetention?.policies?.map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{policy}</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCompliancePage;