import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Globe,
  Database,
  Key,
  Users,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';
import logger from '@/utils/logger';

interface SecurityMetrics {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  compliance: {
    gdpr: number;
    ccpa: number;
    pci: number;
    iso27001: number;
    overall: number;
  };
  encryption: {
    dataAtRest: boolean;
    dataInTransit: boolean;
    keyRotation: boolean;
    strength: string;
  };
  audit: {
    totalLogs: number;
    criticalEvents: number;
    failedLogins: number;
    dataAccess: number;
  };
  privacy: {
    consentRate: number;
    dataDeletionRequests: number;
    dataExportRequests: number;
    anonymizedRecords: number;
  };
}

interface ComplianceCheck {
  id: string;
  name: string;
  category: 'gdpr' | 'ccpa' | 'pci' | 'security';
  status: 'compliant' | 'partial' | 'non-compliant';
  description: string;
  lastChecked: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const SecurityCompliance: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    vulnerabilities: {
      critical: 0,
      high: 2,
      medium: 5,
      low: 12,
      total: 19
    },
    compliance: {
      gdpr: 94,
      ccpa: 97,
      pci: 89,
      iso27001: 92,
      overall: 93
    },
    encryption: {
      dataAtRest: true,
      dataInTransit: true,
      keyRotation: true,
      strength: 'AES-256'
    },
    audit: {
      totalLogs: 45672,
      criticalEvents: 3,
      failedLogins: 127,
      dataAccess: 8934
    },
    privacy: {
      consentRate: 87.3,
      dataDeletionRequests: 23,
      dataExportRequests: 45,
      anonymizedRecords: 1247
    }
  });

  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([
    {
      id: 'gdpr-consent',
      name: 'GDPR Consent Management',
      category: 'gdpr',
      status: 'compliant',
      description: 'User consent is properly collected and stored',
      lastChecked: new Date().toISOString(),
      priority: 'critical'
    },
    {
      id: 'gdpr-data-portability',
      name: 'Data Portability Rights',
      category: 'gdpr',
      status: 'compliant',
      description: 'Users can export their data in machine-readable format',
      lastChecked: new Date().toISOString(),
      priority: 'high'
    },
    {
      id: 'ccpa-opt-out',
      name: 'CCPA Opt-Out Mechanism',
      category: 'ccpa',
      status: 'compliant',
      description: 'California residents can opt-out of data sales',
      lastChecked: new Date().toISOString(),
      priority: 'high'
    },
    {
      id: 'pci-encryption',
      name: 'PCI DSS Encryption',
      category: 'pci',
      status: 'partial',
      description: 'Payment data encryption meets PCI requirements',
      lastChecked: new Date().toISOString(),
      priority: 'critical'
    },
    {
      id: 'security-headers',
      name: 'Security Headers',
      category: 'security',
      status: 'compliant',
      description: 'HTTP security headers are properly configured',
      lastChecked: new Date().toISOString(),
      priority: 'medium'
    },
    {
      id: 'data-retention',
      name: 'Data Retention Policy',
      category: 'gdpr',
      status: 'partial',
      description: 'Automated data deletion based on retention policies',
      lastChecked: new Date().toISOString(),
      priority: 'high'
    }
  ]);

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Update metrics periodically
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = useCallback(() => {
    // Simulate real-time security monitoring
    setMetrics(prev => ({
      ...prev,
      audit: {
        ...prev.audit,
        totalLogs: prev.audit.totalLogs + Math.floor(Math.random() * 100),
        criticalEvents: Math.max(0, prev.audit.criticalEvents + Math.floor((Math.random() - 0.9) * 2)),
        failedLogins: prev.audit.failedLogins + Math.floor(Math.random() * 5),
        dataAccess: prev.audit.dataAccess + Math.floor(Math.random() * 50)
      },
      privacy: {
        ...prev.privacy,
        consentRate: Math.min(100, Math.max(80, prev.privacy.consentRate + (Math.random() - 0.5) * 2))
      }
    }));
  }, []);

  const runSecurityScan = async () => {
    setIsScanning(true);
    
    try {
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update vulnerability counts
      setMetrics(prev => ({
        ...prev,
        vulnerabilities: {
          critical: Math.max(0, prev.vulnerabilities.critical - 1),
          high: Math.max(0, prev.vulnerabilities.high - 1),
          medium: prev.vulnerabilities.medium + Math.floor(Math.random() * 2),
          low: prev.vulnerabilities.low + Math.floor(Math.random() * 3),
          total: Math.max(0, prev.vulnerabilities.total - 1)
        }
      }));
      
      // Update compliance checks
      setComplianceChecks(prev =>
        prev.map(check => ({
          ...check,
          lastChecked: new Date().toISOString()
        }))
      );
      
      logger.info('Security scan completed');
    } catch (error) {
      logger.error('Security scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const generateComplianceReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      complianceChecks,
      recommendations: [
        'Implement automated vulnerability scanning',
        'Enhance data encryption key management',
        'Review and update privacy policies',
        'Conduct regular security training'
      ]
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    logger.info('Compliance report generated');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'non-compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'partial': return 'secondary';
      case 'non-compliant': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className={`text-2xl font-bold ${
                  metrics.compliance.overall > 90 ? 'text-green-600' : 
                  metrics.compliance.overall > 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.compliance.overall}%
                </p>
              </div>
              <Shield className={`h-6 w-6 ${
                metrics.compliance.overall > 90 ? 'text-green-600' : 
                metrics.compliance.overall > 75 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vulnerabilities</p>
                <p className={`text-2xl font-bold ${
                  metrics.vulnerabilities.critical > 0 ? 'text-red-600' :
                  metrics.vulnerabilities.high > 0 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metrics.vulnerabilities.total}
                </p>
                <p className="text-xs text-red-600">{metrics.vulnerabilities.critical} critical</p>
              </div>
              <AlertTriangle className={`h-6 w-6 ${
                metrics.vulnerabilities.critical > 0 ? 'text-red-600' :
                metrics.vulnerabilities.high > 0 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Consent Rate</p>
                <p className="text-2xl font-bold">{metrics.privacy.consentRate.toFixed(1)}%</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Audit Events</p>
                <p className="text-2xl font-bold">{metrics.audit.totalLogs.toLocaleString()}</p>
                <p className="text-xs text-red-600">{metrics.audit.criticalEvents} critical</p>
              </div>
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {metrics.vulnerabilities.critical > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{metrics.vulnerabilities.critical} critical vulnerabilities</strong> detected. 
            Immediate remediation required.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="compliance" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runSecurityScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Scan
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateComplianceReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Report
            </Button>
          </div>
        </div>

        <TabsContent value="compliance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>GDPR Compliance</span>
                    <span className="font-bold">{metrics.compliance.gdpr}%</span>
                  </div>
                  <Progress value={metrics.compliance.gdpr} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>CCPA Compliance</span>
                    <span className="font-bold">{metrics.compliance.ccpa}%</span>
                  </div>
                  <Progress value={metrics.compliance.ccpa} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>PCI DSS</span>
                    <span className="font-bold">{metrics.compliance.pci}%</span>
                  </div>
                  <Progress value={metrics.compliance.pci} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>ISO 27001</span>
                    <span className="font-bold">{metrics.compliance.iso27001}%</span>
                  </div>
                  <Progress value={metrics.compliance.iso27001} />
                </div>
              </CardContent>
            </Card>

            {/* Compliance Checks */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {complianceChecks.map((check) => (
                    <div key={check.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{check.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant={getStatusBadge(check.status)}>
                            {check.status}
                          </Badge>
                          <Badge variant={getPriorityBadge(check.priority)} className="text-xs">
                            {check.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{check.category}</span>
                        <span>Last checked: {new Date(check.lastChecked).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vulnerabilities">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span>Critical</span>
                    </div>
                    <Badge variant="destructive">{metrics.vulnerabilities.critical}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span>High</span>
                    </div>
                    <Badge variant="secondary">{metrics.vulnerabilities.high}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span>Medium</span>
                    </div>
                    <Badge variant="outline">{metrics.vulnerabilities.medium}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full" />
                      <span>Low</span>
                    </div>
                    <Badge variant="outline">{metrics.vulnerabilities.low}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Encryption Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Data at Rest</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Encrypted</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Data in Transit</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">TLS 1.3</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Key Rotation</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Automated</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Encryption Strength</span>
                  <Badge variant="default">{metrics.encryption.strength}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Consent Rate</span>
                  <span className="font-bold">{metrics.privacy.consentRate.toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Data Deletion Requests</span>
                  <Badge variant="outline">{metrics.privacy.dataDeletionRequests}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Data Export Requests</span>
                  <Badge variant="outline">{metrics.privacy.dataExportRequests}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Anonymized Records</span>
                  <span className="font-bold">{metrics.privacy.anonymizedRecords.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Right to be Forgotten</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Data Portability</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Consent Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Data Minimization</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-bold">{metrics.audit.totalLogs.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <p className="font-bold">{metrics.audit.criticalEvents}</p>
                  <p className="text-sm text-muted-foreground">Critical Events</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p className="font-bold">{metrics.audit.failedLogins}</p>
                  <p className="text-sm text-muted-foreground">Failed Logins</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-bold">{metrics.audit.dataAccess.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Data Access</p>
                </div>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <p>Detailed audit logs available in security dashboard</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { SecurityCompliance };
export default SecurityCompliance;