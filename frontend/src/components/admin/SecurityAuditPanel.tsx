import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { ResponsiveDataTable } from '@/components/ui/responsive-data-table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityAuditResult {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  recommendation?: string;
  lastChecked: Date;
}

interface AccessAttempt {
  id: string;
  user_id?: string;
  action: string;
  ip_address?: string;
  success: boolean;
  timestamp: Date;
  user_agent?: string;
}

export const SecurityAuditPanel = () => {
  const [auditResults, setAuditResults] = useState<SecurityAuditResult[]>([]);
  const [accessAttempts, setAccessAttempts] = useState<AccessAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);

  const runSecurityAudit = async () => {
    setLoading(true);
    try {
      // Mock security audit results - in production, this would call actual security checks
      const mockResults: SecurityAuditResult[] = [
        {
          id: '1',
          category: 'Authentication',
          severity: 'critical',
          title: 'JWT Token Validation',
          description: 'Checking if JWT tokens are properly validated across all endpoints',
          status: 'pass',
          recommendation: 'All endpoints properly validate JWT tokens',
          lastChecked: new Date()
        },
        {
          id: '2',
          category: 'Authorization',
          severity: 'high',
          title: 'RLS Policy Coverage',
          description: 'Verifying Row Level Security policies are enabled on all sensitive tables',
          status: 'warning',
          recommendation: 'Consider adding RLS policies to new tables',
          lastChecked: new Date()
        },
        {
          id: '3',
          category: 'Data Protection',
          severity: 'medium',
          title: 'Sensitive Data Encryption',
          description: 'Checking if sensitive data is properly encrypted',
          status: 'pass',
          recommendation: 'All sensitive data is encrypted at rest',
          lastChecked: new Date()
        },
        {
          id: '4',
          category: 'Network Security',
          severity: 'low',
          title: 'HTTPS Enforcement',
          description: 'Verifying all connections use HTTPS',
          status: 'pass',
          recommendation: 'HTTPS is enforced across all endpoints',
          lastChecked: new Date()
        }
      ];

      setAuditResults(mockResults);
      
      // Calculate security score
      const totalChecks = mockResults.length;
      const passedChecks = mockResults.filter(r => r.status === 'pass').length;
      const score = Math.round((passedChecks / totalChecks) * 100);
      setSecurityScore(score);

      toast.success('Security audit completed');
    } catch (error) {
      console.error('Security audit failed:', error);
      toast.error('Security audit failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessAttempts = async () => {
    try {
      // Fetch recent access attempts (mock data)
      const mockAttempts: AccessAttempt[] = [
        {
          id: '1',
          user_id: 'user-123',
          action: 'admin_login',
          ip_address: '192.168.1.100',
          success: true,
          timestamp: new Date(),
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: '2',
          action: 'failed_login_attempt',
          ip_address: '192.168.1.200',
          success: false,
          timestamp: new Date(Date.now() - 300000), // 5 min ago
          user_agent: 'Unknown'
        }
      ];

      setAccessAttempts(mockAttempts);
    } catch (error) {
      console.error('Error fetching access attempts:', error);
    }
  };

  useEffect(() => {
    fetchAccessAttempts();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const auditColumns = [
    {
      key: 'status',
      header: 'Status',
      cell: (value: string) => getStatusIcon(value)
    },
    {
      key: 'category',
      header: 'Category'
    },
    {
      key: 'title',
      header: 'Title'
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (value: string) => (
        <Badge variant={getSeverityColor(value)}>
          {value.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'lastChecked',
      header: 'Last Checked',
      cell: (value: Date) => value.toLocaleString()
    }
  ];

  const accessColumns = [
    {
      key: 'user_id',
      header: 'User',
      cell: (value: string) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {value || 'Anonymous'}
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action'
    },
    {
      key: 'ip_address',
      header: 'IP Address'
    },
    {
      key: 'success',
      header: 'Success',
      cell: (value: boolean) => (
        <Badge variant={value ? 'secondary' : 'destructive'}>
          {value ? 'Success' : 'Failed'}
        </Badge>
      )
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (value: Date) => value.toLocaleString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* Security Score Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Overview</CardTitle>
            </div>
            <Button 
              onClick={runSecurityAudit}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Running Audit...' : 'Run Security Audit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{securityScore}%</div>
              <p className="text-sm text-muted-foreground">Security Score</p>
            </div>
            <Progress value={securityScore} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-500">
                  {auditResults.filter(r => r.status === 'pass').length}
                </div>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-500">
                  {auditResults.filter(r => r.status === 'warning').length}
                </div>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-500">
                  {auditResults.filter(r => r.status === 'fail').length}
                </div>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Details */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Security Audit</TabsTrigger>
          <TabsTrigger value="access">Access Attempts</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveDataTable
                data={auditResults}
                columns={auditColumns}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Access Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveDataTable
                data={accessAttempts}
                columns={accessColumns}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};