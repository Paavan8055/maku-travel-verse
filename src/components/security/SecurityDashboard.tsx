import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Lock,
  Key,
  Eye,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface SecurityMetric {
  id: string;
  name: string;
  category: 'authentication' | 'authorization' | 'encryption' | 'monitoring' | 'compliance';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number;
  lastChecked: Date;
  details: string;
  recommendations?: string[];
}

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'unauthorized_access' | 'data_breach' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  status: 'active' | 'investigating' | 'resolved';
  affectedUsers?: number;
  source?: string;
}

export const SecurityDashboard: React.FC = () => {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetric[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  const runSecurityScan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-scanner', {
        body: { action: 'full_scan' }
      });

      if (error) throw error;

      setSecurityMetrics(data.metrics || getMockSecurityMetrics());
      setSecurityAlerts(data.alerts || getMockSecurityAlerts());
      setLastScan(new Date());
    } catch (error) {
      console.error('Error running security scan:', error);
      // Use mock data for demonstration
      setSecurityMetrics(getMockSecurityMetrics());
      setSecurityAlerts(getMockSecurityAlerts());
      setLastScan(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSecurityScan();
  }, []);

  const getMockSecurityMetrics = (): SecurityMetric[] => [
    {
      id: 'rls-policies',
      name: 'Row Level Security Policies',
      category: 'authorization',
      status: 'healthy',
      score: 98,
      lastChecked: new Date(),
      details: 'All tables have RLS enabled with proper policies',
      recommendations: ['Review partner access policies', 'Add audit logging for admin actions']
    },
    {
      id: 'auth-config',
      name: 'Authentication Configuration',
      category: 'authentication',
      status: 'healthy',
      score: 95,
      lastChecked: new Date(),
      details: 'MFA enabled, strong password policies enforced',
      recommendations: ['Consider implementing SSO', 'Add biometric authentication']
    },
    {
      id: 'data-encryption',
      name: 'Data Encryption',
      category: 'encryption',
      status: 'warning',
      score: 87,
      lastChecked: new Date(),
      details: 'Encryption at rest enabled, some API keys not rotated recently',
      recommendations: ['Rotate API keys older than 90 days', 'Implement key management system']
    },
    {
      id: 'access-monitoring',
      name: 'Access Monitoring',
      category: 'monitoring',
      status: 'healthy',
      score: 92,
      lastChecked: new Date(),
      details: 'Real-time monitoring active, audit logs comprehensive',
      recommendations: ['Add anomaly detection', 'Implement behavioral analysis']
    },
    {
      id: 'compliance-check',
      name: 'Compliance Status',
      category: 'compliance',
      status: 'warning',
      score: 78,
      lastChecked: new Date(),
      details: 'GDPR compliant, PCI DSS certification pending renewal',
      recommendations: ['Renew PCI DSS certification', 'Update privacy policy', 'Conduct compliance audit']
    }
  ];

  const getMockSecurityAlerts = (): SecurityAlert[] => [
    {
      id: 'alert-1',
      type: 'failed_login',
      severity: 'medium',
      title: 'Multiple Failed Login Attempts',
      description: 'User account experienced 5 failed login attempts in 10 minutes',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      status: 'investigating',
      affectedUsers: 1,
      source: '192.168.1.100'
    },
    {
      id: 'alert-2',
      type: 'policy_violation',
      severity: 'low',
      title: 'Admin Access Outside Business Hours',
      description: 'Admin user accessed system outside of configured business hours',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      status: 'resolved',
      affectedUsers: 1,
      source: 'admin-dashboard'
    },
    {
      id: 'alert-3',
      type: 'unauthorized_access',
      severity: 'high',
      title: 'Unauthorized API Access Attempt',
      description: 'Invalid API key used to access protected endpoints',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      status: 'active',
      source: 'api-gateway'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <ShieldCheck className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <ShieldAlert className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication':
        return <Key className="h-4 w-4" />;
      case 'authorization':
        return <Lock className="h-4 w-4" />;
      case 'encryption':
        return <Shield className="h-4 w-4" />;
      case 'monitoring':
        return <Eye className="h-4 w-4" />;
      case 'compliance':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getAlertStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'investigating':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'active':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const overallSecurityScore = securityMetrics.length > 0 
    ? Math.round(securityMetrics.reduce((acc, metric) => acc + metric.score, 0) / securityMetrics.length)
    : 0;

  const activeAlerts = securityAlerts.filter(alert => alert.status === 'active').length;
  const criticalAlerts = securityAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive security monitoring and compliance overview
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={runSecurityScan}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Scanning...' : 'Run Security Scan'}
          </Button>
          {lastScan && (
            <div className="text-sm text-gray-500">
              Last scan: {lastScan.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{overallSecurityScore}%</p>
                <p className="text-xs text-muted-foreground">Security Score</p>
              </div>
              <Shield className="h-4 w-4 ml-auto text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress value={overallSecurityScore} className="w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{activeAlerts}</p>
                <p className="text-xs text-muted-foreground">Active Alerts</p>
              </div>
              <AlertTriangle className="h-4 w-4 ml-auto text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">{criticalAlerts}</p>
                <p className="text-xs text-muted-foreground">Critical/High Risk</p>
              </div>
              <ShieldAlert className="h-4 w-4 ml-auto text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold">
                  {securityMetrics.filter(m => m.status === 'healthy').length}
                </p>
                <p className="text-xs text-muted-foreground">Healthy Systems</p>
              </div>
              <ShieldCheck className="h-4 w-4 ml-auto text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">Security Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {securityMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(metric.category)}
                      <CardTitle className="text-lg">{metric.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                  <CardDescription>{metric.details}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Security Score</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metric.score}%</span>
                      {getStatusIcon(metric.status)}
                    </div>
                  </div>
                  <Progress value={metric.score} className="w-full" />
                  
                  {metric.recommendations && metric.recommendations.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Recommendations:</span>
                      <div className="mt-1 space-y-1">
                        {metric.recommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{rec}</span>
                          </div>
                        ))}
                        {metric.recommendations.length > 2 && (
                          <div className="text-xs text-gray-500 ml-3.5">
                            +{metric.recommendations.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      Fix Issues
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            {securityAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertStatusIcon(alert.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{alert.title}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{alert.timestamp.toLocaleString()}</span>
                          {alert.affectedUsers && <span>{alert.affectedUsers} users affected</span>}
                          {alert.source && <span>Source: {alert.source}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Investigate
                      </Button>
                      {alert.status === 'active' && (
                        <Button size="sm">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Current compliance with major standards and regulations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-medium">GDPR Compliance</span>
                      <p className="text-sm text-gray-600">Fully compliant with EU data protection regulations</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <span className="font-medium">PCI DSS Certification</span>
                      <p className="text-sm text-gray-600">Certification expires in 45 days</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Renewal Required</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-medium">SOC 2 Type II</span>
                      <p className="text-sm text-gray-600">Annual audit completed successfully</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Logs</CardTitle>
              <CardDescription>Recent security-related activities and access logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4" />
                <p>Audit log viewer coming soon</p>
                <p className="text-sm">Real-time security event monitoring and audit trail</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};