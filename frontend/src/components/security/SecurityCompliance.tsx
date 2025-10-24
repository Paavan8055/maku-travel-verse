import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Users,
  Database,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SecurityMetrics {
  overallScore: number;
  complianceStatus: ComplianceCheck[];
  vulnerabilities: SecurityVulnerability[];
  dataProtection: DataProtectionMetrics;
  accessControl: AccessControlMetrics;
  auditLogs: AuditLog[];
}

interface ComplianceCheck {
  framework: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  lastAssessment: Date;
  requirements: ComplianceRequirement[];
}

interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
}

interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  affected: string;
  status: 'open' | 'mitigated' | 'resolved';
  discoveredAt: Date;
}

interface DataProtectionMetrics {
  encryptionCoverage: number;
  gdprCompliance: number;
  dataRetentionPolicies: number;
  rightToErasure: number;
}

interface AccessControlMetrics {
  mfaAdoption: number;
  privilegedAccounts: number;
  sessionSecurity: number;
  rbacImplementation: number;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  event: string;
  user: string;
  resource: string;
  result: 'success' | 'failure' | 'warning';
  ipAddress: string;
}

export const SecurityCompliance: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'compliance' | 'vulnerabilities' | 'audit'>('overview');

  useEffect(() => {
    fetchSecurityMetrics();
  }, []);

  const fetchSecurityMetrics = async () => {
    try {
      // Simulate security data - in production, this would come from your security monitoring system
      const mockMetrics: SecurityMetrics = {
        overallScore: 87,
        complianceStatus: [
          {
            framework: 'GDPR',
            status: 'compliant',
            score: 95,
            lastAssessment: new Date(),
            requirements: [
              { id: 'gdpr-1', description: 'Data encryption at rest', status: 'passed', details: 'AES-256 encryption implemented' },
              { id: 'gdpr-2', description: 'Right to be forgotten', status: 'passed', details: 'Automated deletion processes in place' },
              { id: 'gdpr-3', description: 'Data processing consent', status: 'warning', details: 'Some legacy consents need updating' }
            ]
          },
          {
            framework: 'PCI DSS',
            status: 'compliant',
            score: 92,
            lastAssessment: new Date(),
            requirements: [
              { id: 'pci-1', description: 'Secure payment processing', status: 'passed', details: 'Stripe integration certified' },
              { id: 'pci-2', description: 'Network security', status: 'passed', details: 'WAF and encryption in place' }
            ]
          },
          {
            framework: 'SOC 2',
            status: 'partial',
            score: 78,
            lastAssessment: new Date(),
            requirements: [
              { id: 'soc-1', description: 'Security controls', status: 'passed', details: 'Controls documented and tested' },
              { id: 'soc-2', description: 'Availability monitoring', status: 'warning', details: 'Need enhanced monitoring' }
            ]
          }
        ],
        vulnerabilities: [
          {
            id: 'vuln-1',
            severity: 'medium',
            category: 'Authentication',
            description: 'Session timeout could be shorter',
            affected: 'User authentication system',
            status: 'open',
            discoveredAt: new Date()
          },
          {
            id: 'vuln-2',
            severity: 'low',
            category: 'Information Disclosure',
            description: 'Verbose error messages in development',
            affected: 'API endpoints',
            status: 'mitigated',
            discoveredAt: new Date()
          }
        ],
        dataProtection: {
          encryptionCoverage: 98,
          gdprCompliance: 95,
          dataRetentionPolicies: 90,
          rightToErasure: 85
        },
        accessControl: {
          mfaAdoption: 78,
          privilegedAccounts: 92,
          sessionSecurity: 88,
          rbacImplementation: 95
        },
        auditLogs: generateMockAuditLogs()
      };
      
      setMetrics(mockMetrics);
      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Failed to fetch security metrics',
        description: 'Could not load security data',
        variant: 'destructive'
      });
    }
  };

  const generateMockAuditLogs = (): AuditLog[] => {
    const events = ['Login', 'Logout', 'Data Access', 'Permission Change', 'Failed Login'];
    const users = ['admin@maku.travel', 'operator@maku.travel', 'support@maku.travel'];
    const resources = ['User Database', 'Booking System', 'Payment Gateway', 'Admin Panel'];
    const results = ['success', 'failure', 'warning'] as const;
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: `audit-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000), // Last 24 hours
      event: events[Math.floor(Math.random() * events.length)],
      user: users[Math.floor(Math.random() * users.length)],
      resource: resources[Math.floor(Math.random() * resources.length)],
      result: results[Math.floor(Math.random() * results.length)],
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
    }));
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'non-compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-white';
    }
  };

  if (isLoading || !metrics) {
    return <div className="flex items-center justify-center h-96">Loading security metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security & Compliance</h1>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Overall Security Score</p>
            <p className="text-2xl font-bold">{metrics.overallScore}/100</p>
          </div>
          <Button onClick={fetchSecurityMetrics}>
            <Shield className="h-4 w-4 mr-2" />
            Run Security Scan
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b">
        {[
          { key: 'overview', label: 'Overview', icon: Shield },
          { key: 'compliance', label: 'Compliance', icon: FileText },
          { key: 'vulnerabilities', label: 'Vulnerabilities', icon: AlertTriangle },
          { key: 'audit', label: 'Audit Logs', icon: Eye }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={selectedTab === key ? "default" : "ghost"}
            onClick={() => setSelectedTab(key as any)}
            className="flex items-center space-x-2"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Protection</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.dataProtection.encryptionCoverage}%</div>
                <Progress value={metrics.dataProtection.encryptionCoverage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Access Control</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.accessControl.rbacImplementation}%</div>
                <Progress value={metrics.accessControl.rbacImplementation} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MFA Adoption</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.accessControl.mfaAdoption}%</div>
                <Progress value={metrics.accessControl.mfaAdoption} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GDPR Compliance</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.dataProtection.gdprCompliance}%</div>
                <Progress value={metrics.dataProtection.gdprCompliance} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Recent Vulnerabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.vulnerabilities.slice(0, 3).map((vuln) => (
                  <div key={vuln.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity}
                      </Badge>
                      <div>
                        <p className="font-medium">{vuln.description}</p>
                        <p className="text-sm text-muted-foreground">{vuln.category} • {vuln.affected}</p>
                      </div>
                    </div>
                    <Badge variant={vuln.status === 'resolved' ? 'default' : 'destructive'}>
                      {vuln.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {selectedTab === 'compliance' && (
        <div className="space-y-6">
          {metrics.complianceStatus.map((framework) => (
            <Card key={framework.framework}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <span>{framework.framework}</span>
                    <Badge className={getComplianceColor(framework.status)}>
                      {framework.status}
                    </Badge>
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{framework.score}%</p>
                    <p className="text-sm text-muted-foreground">Compliance Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {framework.requirements.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {req.status === 'passed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : req.status === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{req.description}</p>
                          <p className="text-sm text-muted-foreground">{req.details}</p>
                        </div>
                      </div>
                      <Badge variant={req.status === 'passed' ? 'default' : 'destructive'}>
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vulnerabilities Tab */}
      {selectedTab === 'vulnerabilities' && (
        <div className="space-y-4">
          {metrics.vulnerabilities.map((vuln) => (
            <Card key={vuln.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge className={getSeverityColor(vuln.severity)}>
                      {vuln.severity}
                    </Badge>
                    <div>
                      <h3 className="font-semibold">{vuln.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vuln.category} • Affects: {vuln.affected}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Discovered: {vuln.discoveredAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={vuln.status === 'resolved' ? 'default' : 'destructive'}>
                    {vuln.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Audit Logs Tab */}
      {selectedTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.result === 'success' ? 'bg-green-500' : 
                      log.result === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{log.event} • {log.resource}</p>
                      <p className="text-sm text-muted-foreground">
                        User: {log.user} • IP: {log.ipAddress}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                    <Badge variant={log.result === 'success' ? 'default' : 'destructive'}>
                      {log.result}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};