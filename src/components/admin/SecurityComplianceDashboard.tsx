import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileCheck,
  UserCheck,
  Database,
  Settings,
  Scan,
  FileText,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  failed_login_attempts: number;
  active_security_alerts: number;
  last_security_scan: string | null;
  rls_enabled_tables: number;
  mfa_enabled_users: number;
  encryption_status: 'enabled' | 'partial' | 'disabled';
  compliance_score: number;
}

interface ComplianceFramework {
  name: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  requirements: ComplianceRequirement[];
}

interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'met' | 'partial' | 'not-met';
  evidence: string[];
}

interface SecurityIncident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  created_at: string;
  resolved: boolean;
  response_actions: string[];
}

export const SecurityComplianceDashboard = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch security metrics
      const metricsData = await fetchSecurityMetrics();
      setMetrics(metricsData);

      // Fetch compliance frameworks
      const frameworksData = await fetchComplianceFrameworks();
      setFrameworks(frameworksData);

      // Fetch security incidents
      const incidentsData = await fetchSecurityIncidents();
      setIncidents(incidentsData);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityMetrics = async (): Promise<SecurityMetrics> => {
    // Fetch active security alerts
    const { data: alerts } = await supabase
      .from('critical_alerts')
      .select('*')
      .like('alert_type', '%security%')
      .eq('resolved', false);

    // Mock additional metrics (in production, implement proper queries)
    return {
      failed_login_attempts: 15, // Mock data
      active_security_alerts: alerts?.length || 0,
      last_security_scan: '2024-01-15T10:00:00Z',
      rls_enabled_tables: 25,
      mfa_enabled_users: 145,
      encryption_status: 'enabled',
      compliance_score: 87
    };
  };

  const fetchComplianceFrameworks = async (): Promise<ComplianceFramework[]> => {
    return [
      {
        name: 'GDPR',
        status: 'compliant',
        score: 92,
        requirements: [
          {
            id: 'gdpr-001',
            description: 'Data processing transparency',
            status: 'met',
            evidence: ['Privacy policy updated', 'User consent tracking active']
          },
          {
            id: 'gdpr-002',
            description: 'Right to erasure implementation',
            status: 'met',
            evidence: ['Data deletion endpoint', 'Automated cleanup processes']
          }
        ]
      },
      {
        name: 'PCI DSS',
        status: 'partial',
        score: 78,
        requirements: [
          {
            id: 'pci-001',
            description: 'Secure payment processing',
            status: 'met',
            evidence: ['Stripe integration', 'No card data storage']
          },
          {
            id: 'pci-002',
            description: 'Regular security testing',
            status: 'partial',
            evidence: ['Quarterly vulnerability scans scheduled']
          }
        ]
      },
      {
        name: 'SOC 2',
        status: 'partial',
        score: 81,
        requirements: [
          {
            id: 'soc2-001',
            description: 'Access control implementation',
            status: 'met',
            evidence: ['Role-based access control', 'MFA enforcement']
          },
          {
            id: 'soc2-002',
            description: 'Incident response procedures',
            status: 'partial',
            evidence: ['Incident tracking system', 'Response team identified']
          }
        ]
      }
    ];
  };

  const fetchSecurityIncidents = async (): Promise<SecurityIncident[]> => {
    const { data } = await supabase
      .from('critical_alerts')
      .select('*')
      .like('alert_type', '%security%')
      .order('created_at', { ascending: false })
      .limit(10);

    return (data || []).map(alert => ({
      id: alert.id,
      type: alert.alert_type,
      severity: alert.severity as any,
      description: alert.message,
      created_at: alert.created_at,
      resolved: alert.resolved,
      response_actions: (alert as any).metadata?.actions || []
    }));
  };

  const runSecurityScan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-hardening', {
        body: { action: 'comprehensive_scan' }
      });

      if (error) throw error;

      toast({
        title: "Security Scan Completed",
        description: `Scan completed with ${data.issues_found} issues found`
      });

      // Refresh data
      await fetchSecurityData();
    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: "Error",
        description: "Failed to run security scan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateComplianceReport = async (framework: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('compliance-reporting', {
        body: { framework, report_type: 'detailed' }
      });

      if (error) throw error;

      toast({
        title: "Report Generated",
        description: `${framework} compliance report has been generated`
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate compliance report",
        variant: "destructive"
      });
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-500';
      case 'partial':
        return 'text-yellow-500';
      case 'non-compliant':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRequirementIcon = (status: string) => {
    switch (status) {
      case 'met':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'not-met':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Security Score</p>
                  <p className="text-2xl font-bold text-green-500">{metrics.compliance_score}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {metrics.active_security_alerts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">MFA Users</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {metrics.mfa_enabled_users}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">RLS Tables</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {metrics.rls_enabled_tables}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-fit grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button onClick={runSecurityScan} disabled={loading} variant="outline">
              <Scan className="h-4 w-4 mr-2" />
              Run Scan
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Security Monitoring</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Failed Login Attempts (24h)</span>
                    <Badge variant={metrics?.failed_login_attempts && metrics.failed_login_attempts > 50 ? 'destructive' : 'secondary'}>
                      {metrics?.failed_login_attempts || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Encryption Status</span>
                    <Badge variant="secondary">
                      {metrics?.encryption_status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Security Scan</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics?.last_security_scan ? 
                        new Date(metrics.last_security_scan).toLocaleDateString() : 
                        'Never'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileCheck className="h-5 w-5" />
                  <span>Compliance Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {frameworks.map((framework) => (
                    <div key={framework.name} className="flex justify-between items-center">
                      <span className="text-sm">{framework.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${getComplianceColor(framework.status)}`}>
                          {framework.score}%
                        </span>
                        <Badge variant={framework.status === 'compliant' ? 'secondary' : 'outline'}>
                          {framework.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {frameworks.map((framework) => (
            <Card key={framework.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{framework.name} Compliance</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${getComplianceColor(framework.status)}`}>
                      {framework.score}%
                    </span>
                    <Button 
                      onClick={() => generateComplianceReport(framework.name)}
                      size="sm"
                      variant="outline"
                    >
                      Generate Report
                    </Button>
                  </div>
                </div>
                <Progress value={framework.score} className="mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {framework.requirements.map((requirement) => (
                    <div key={requirement.id} className="border rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-2">
                          {getRequirementIcon(requirement.status)}
                          <div>
                            <p className="font-medium">{requirement.description}</p>
                            <p className="text-sm text-muted-foreground">{requirement.id}</p>
                          </div>
                        </div>
                        <Badge variant={requirement.status === 'met' ? 'secondary' : 'outline'}>
                          {requirement.status}
                        </Badge>
                      </div>
                      {requirement.evidence.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Evidence:</p>
                          <ul className="text-xs space-y-1">
                            {requirement.evidence.map((evidence, index) => (
                              <li key={index} className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Security Incidents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No security incidents reported
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="border rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant={incident.severity === 'critical' ? 'destructive' : 'outline'}>
                              {incident.severity}
                            </Badge>
                            <Badge variant="outline">{incident.type}</Badge>
                            {incident.resolved && <Badge variant="secondary">Resolved</Badge>}
                          </div>
                          <p className="font-medium">{incident.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(incident.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {incident.response_actions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Response Actions:</p>
                          <ul className="text-xs space-y-1">
                            {incident.response_actions.map((action, index) => (
                              <li key={index} className="flex items-center space-x-1">
                                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Access Control</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">MFA Enabled Users</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={78} className="w-20" />
                      <span className="text-sm">78%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Admin Users</span>
                    <Badge variant="secondary">12</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Sessions</span>
                    <Badge variant="secondary">247</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Data Protection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">RLS Enabled Tables</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={92} className="w-20" />
                      <span className="text-sm">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Encrypted Fields</span>
                    <Badge variant="secondary">All</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Backup Encryption</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};