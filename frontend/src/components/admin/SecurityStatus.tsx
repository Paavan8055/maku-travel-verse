import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface SecurityIssue {
  level: 'WARN' | 'ERROR' | 'INFO';
  description: string;
  categories: string[];
  fixUrl?: string;
}

export const SecurityStatus = () => {
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchSecurityStatus = async () => {
    setLoading(true);
    try {
      // Run Supabase linter
      const { data, error } = await supabase.functions.invoke('security-linter');
      
      if (error) {
        console.error('Security check error:', error);
        setIssues([{
          level: 'ERROR',
          description: 'Failed to check security status',
          categories: ['SYSTEM']
        }]);
      } else if (data?.issues) {
        setIssues(data.issues);
      } else {
        setIssues([]);
      }
      
      setLastCheck(new Date());
    } catch (error) {
      console.error('Security status error:', error);
      setIssues([{
        level: 'ERROR',
        description: 'Unable to connect to security checker',
        categories: ['SYSTEM']
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const criticalIssues = issues.filter(i => i.level === 'ERROR');
  const warnings = issues.filter(i => i.level === 'WARN');
  const securityIssues = issues.filter(i => i.categories.includes('SECURITY'));

  const getStatusColor = () => {
    if (criticalIssues.length > 0) return 'destructive';
    if (warnings.length > 0) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (criticalIssues.length > 0) return <AlertTriangle className="h-5 w-5" />;
    if (warnings.length > 0) return <Shield className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (criticalIssues.length > 0) return 'Critical Issues';
    if (warnings.length > 0) return 'Security Warnings';
    return 'All Good';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Security Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor() as any}>
              {getStatusText()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSecurityStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {lastCheck && (
          <p className="text-sm text-muted-foreground">
            Last checked: {lastCheck.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking security status...</span>
          </div>
        ) : (
          <>
            {issues.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No security issues detected. Your application security configuration looks good!
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {securityIssues.map((issue, index) => (
                  <Alert 
                    key={index} 
                    variant={issue.level === 'ERROR' ? 'destructive' : 'default'}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>{issue.description}</span>
                        <Badge variant="outline">
                          {issue.level}
                        </Badge>
                      </div>
                      {issue.fixUrl && (
                        <div className="mt-2">
                          <a 
                            href={issue.fixUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm underline"
                          >
                            View fix instructions →
                          </a>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {issues.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Total issues: {issues.length} ({criticalIssues.length} critical, {warnings.length} warnings)
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};