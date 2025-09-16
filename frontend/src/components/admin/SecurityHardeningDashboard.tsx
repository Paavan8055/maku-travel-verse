import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Eye, 
  Key,
  FileText,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  status: 'open' | 'fixed' | 'mitigated';
  affected_components: string[];
  remediation: string;
  created_at: string;
}

interface SecurityMetrics {
  totalIssues: number;
  criticalIssues: number;
  fixedIssues: number;
  securityScore: number;
  lastAudit: string;
  complianceLevel: number;
}

const MOCK_SECURITY_ISSUES: SecurityIssue[] = [
  {
    id: '1',
    severity: 'critical',
    category: 'Authentication',
    title: 'Missing MFA for Admin Access',
    description: 'Administrative accounts lack multi-factor authentication',
    status: 'open',
    affected_components: ['Admin Dashboard', 'User Management'],
    remediation: 'Implement TOTP/SMS MFA for all admin accounts',
    created_at: '2025-01-08T10:00:00Z'
  },
  {
    id: '2',
    severity: 'high',
    category: 'Data Protection',
    title: 'Insufficient Data Encryption',
    description: 'Sensitive user data not encrypted at rest',
    status: 'open',
    affected_components: ['Database', 'File Storage'],
    remediation: 'Enable transparent data encryption (TDE)',
    created_at: '2025-01-08T09:30:00Z'
  },
  {
    id: '3',
    severity: 'medium',
    category: 'Access Control',
    title: 'Overprivileged Service Accounts',
    description: 'Service accounts have excessive permissions',
    status: 'mitigated',
    affected_components: ['Agent System', 'API Gateway'],
    remediation: 'Apply principle of least privilege',
    created_at: '2025-01-07T15:20:00Z'
  },
  {
    id: '4',
    severity: 'high',
    category: 'API Security',
    title: 'Missing Rate Limiting',
    description: 'API endpoints lack proper rate limiting',
    status: 'fixed',
    affected_components: ['REST API', 'Agent Endpoints'],
    remediation: 'Implement sliding window rate limiting',
    created_at: '2025-01-07T14:10:00Z'
  },
  {
    id: '5',
    severity: 'critical',
    category: 'Input Validation',
    title: 'SQL Injection Vulnerability',
    description: 'User input not properly sanitized in legacy endpoints',
    status: 'open',
    affected_components: ['Legacy API', 'Search Function'],
    remediation: 'Implement parameterized queries and input validation',
    created_at: '2025-01-06T11:45:00Z'
  }
];

export function SecurityHardeningDashboard() {
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>(MOCK_SECURITY_ISSUES);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);

  useEffect(() => {
    calculateMetrics();
  }, [securityIssues]);

  const calculateMetrics = () => {
    const totalIssues = securityIssues.length;
    const criticalIssues = securityIssues.filter(i => i.severity === 'critical' && i.status === 'open').length;
    const fixedIssues = securityIssues.filter(i => i.status === 'fixed').length;
    const openIssues = securityIssues.filter(i => i.status === 'open').length;
    
    // Calculate security score based on severity and status
    let scoreDeduction = 0;
    securityIssues.forEach(issue => {
      if (issue.status === 'open') {
        switch (issue.severity) {
          case 'critical': scoreDeduction += 25; break;
          case 'high': scoreDeduction += 15; break;
          case 'medium': scoreDeduction += 8; break;
          case 'low': scoreDeduction += 3; break;
        }
      }
    });
    
    const securityScore = Math.max(0, 100 - scoreDeduction);
    const complianceLevel = securityScore > 85 ? 95 : securityScore > 70 ? 80 : securityScore > 50 ? 60 : 40;

    setMetrics({
      totalIssues,
      criticalIssues,
      fixedIssues,
      securityScore,
      lastAudit: '2025-01-08T12:00:00Z',
      complianceLevel
    });
  };

  const runSecurityAudit = async () => {
    setRunningAudit(true);
    try {
      // Simulate security audit
      toast.info('Starting comprehensive security audit...');
      
      setTimeout(() => {
        toast.success('Security audit completed');
        // Add a new discovered issue
        const newIssue: SecurityIssue = {
          id: String(Date.now()),
          severity: 'medium',
          category: 'Logging',
          title: 'Insufficient Audit Logging',
          description: 'Critical actions not properly logged',
          status: 'open',
          affected_components: ['Admin Actions', 'Data Access'],
          remediation: 'Enable comprehensive audit logging',
          created_at: new Date().toISOString()
        };
        setSecurityIssues(prev => [newIssue, ...prev]);
        setRunningAudit(false);
      }, 3000);
    } catch (error) {
      console.error('Security audit failed:', error);
      toast.error('Security audit failed');
      setRunningAudit(false);
    }
  };

  const fixIssue = async (issueId: string) => {
    try {
      toast.info('Applying security fix...');
      
      // Simulate fix implementation
      setTimeout(() => {
        setSecurityIssues(prev => 
          prev.map(issue => 
            issue.id === issueId 
              ? { ...issue, status: 'fixed' as const }
              : issue
          )
        );
        toast.success('Security issue fixed');
      }, 2000);
    } catch (error) {
      console.error('Failed to fix issue:', error);
      toast.error('Failed to apply fix');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      fixed: 'default',
      mitigated: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Hardening</h1>
          <p className="text-muted-foreground">
            Comprehensive security assessment and remediation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={runSecurityAudit}
            disabled={runningAudit}
            variant="outline"
          >
            {runningAudit ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Security Audit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Critical Alert */}
      {metrics && metrics.criticalIssues > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{metrics.criticalIssues} critical security issues</strong> require immediate attention.
            System security score: {metrics.securityScore}%
          </AlertDescription>
        </Alert>
      )}

      {/* Security Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Security Score</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xl font-bold">{metrics.securityScore}%</p>
                    <Progress value={metrics.securityScore} className="w-16 h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                  <p className="text-xl font-bold text-destructive">{metrics.criticalIssues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Issues Fixed</p>
                  <p className="text-xl font-bold text-success">{metrics.fixedIssues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <p className="text-xl font-bold">{metrics.complianceLevel}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Security Issues</CardTitle>
          <CardDescription>
            Identified vulnerabilities and their remediation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityIssues.map(issue => (
              <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <h4 className="font-semibold">{issue.title}</h4>
                      <p className="text-sm text-muted-foreground">{issue.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(issue.severity)}
                    {getStatusBadge(issue.status)}
                  </div>
                </div>

                <p className="text-sm">{issue.description}</p>

                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-2">Affected:</span>
                  {issue.affected_components.map((component, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {component}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Remediation: </span>
                    <span>{issue.remediation}</span>
                  </div>
                  {issue.status === 'open' && (
                    <Button 
                      size="sm" 
                      onClick={() => fixIssue(issue.id)}
                      variant="outline"
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      Apply Fix
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>
            Proactive measures to enhance system security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Key className="h-4 w-4 text-primary mt-1" />
              <div>
                <h4 className="font-medium">Implement Zero Trust Architecture</h4>
                <p className="text-sm text-muted-foreground">
                  Adopt a zero trust model for all agent communications and data access
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Eye className="h-4 w-4 text-primary mt-1" />
              <div>
                <h4 className="font-medium">Enhanced Monitoring</h4>
                <p className="text-sm text-muted-foreground">
                  Deploy advanced threat detection and behavioral analytics
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-4 w-4 text-primary mt-1" />
              <div>
                <h4 className="font-medium">Regular Security Assessments</h4>
                <p className="text-sm text-muted-foreground">
                  Schedule automated security scans and penetration testing
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}