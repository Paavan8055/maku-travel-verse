import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Clock,
  Key
} from 'lucide-react';

export const SecuritySettingsGuide = () => {
  const securityIssues = [
    {
      id: 'otp-expiry',
      title: 'OTP Expiry Too Long',
      level: 'warning',
      description: 'OTP expiry time exceeds recommended threshold of 5 minutes',
      action: 'Reduce OTP expiry to 5 minutes in Supabase Auth settings',
      link: 'https://supabase.com/dashboard/project/_/auth/settings',
      category: 'Authentication',
      fix: 'Go to Auth Settings → Email → OTP expiry: change from default to 300 seconds (5 minutes)'
    },
    {
      id: 'password-protection',
      title: 'Leaked Password Protection Disabled',
      level: 'warning',
      description: 'Password breach protection is currently disabled',
      action: 'Enable leaked password protection in Auth settings',
      link: 'https://supabase.com/dashboard/project/_/auth/settings',
      category: 'Authentication',
      fix: 'Go to Auth Settings → Password → Enable "Prevent sign ups with leaked passwords"'
    },
    {
      id: 'rls-policies',
      title: 'Missing RLS Policies (Fixed)',
      level: 'info',
      description: 'Some cache tables had missing RLS policies - now fixed via migration',
      action: 'No action required - policies added automatically',
      category: 'Database Security',
      fix: 'Completed: Added proper INSERT/DELETE policies for cache tables'
    },
    {
      id: 'function-security',
      title: 'Function Security Hardening (Fixed)',
      level: 'info',
      description: 'Database functions had mutable search_path - now secured',
      action: 'No action required - functions updated with SECURITY DEFINER SET search_path',
      category: 'Database Security',
      fix: 'Completed: All functions now use secure search_path configuration'
    }
  ];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'critical': return <Shield className="h-4 w-4 text-destructive" />;
      default: return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'warning': return 'bg-warning text-warning-foreground';
      case 'info': return 'bg-success text-success-foreground';
      case 'critical': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const pendingIssues = securityIssues.filter(issue => issue.level === 'warning');
  const completedIssues = securityIssues.filter(issue => issue.level === 'info');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Configuration Guide</h2>
          <p className="text-muted-foreground">
            Manual configuration required for optimal security
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {pendingIssues.length} pending actions
        </Badge>
      </div>

      {/* Pending Actions */}
      {pendingIssues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-warning">
            ⚠️ Manual Configuration Required
          </h3>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The following security settings require manual configuration in your Supabase dashboard. 
              These cannot be automated via migrations and must be set by a project admin.
            </AlertDescription>
          </Alert>

          {pendingIssues.map((issue) => (
            <Card key={issue.id} className="border-warning">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(issue.level)}
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                    <Badge className={getLevelColor(issue.level)}>
                      {issue.level}
                    </Badge>
                  </div>
                  <Badge variant="outline">{issue.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{issue.description}</p>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    How to Fix:
                  </h4>
                  <p className="text-sm">{issue.fix}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">
                    Action: {issue.action}
                  </span>
                  {issue.link && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={issue.link} target="_blank" rel="noopener noreferrer">
                        Open Settings
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Actions */}
      {completedIssues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-success">
            ✅ Automatically Fixed
          </h3>
          
          {completedIssues.map((issue) => (
            <Card key={issue.id} className="border-success">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(issue.level)}
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                    <Badge className={getLevelColor(issue.level)}>
                      Completed
                    </Badge>
                  </div>
                  <Badge variant="outline">{issue.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{issue.description}</p>
                <div className="mt-2 text-sm text-success">
                  ✓ {issue.fix}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p>
              <strong>Priority 1:</strong> Configure the {pendingIssues.length} pending authentication settings 
              in your Supabase dashboard to ensure optimal security.
            </p>
            <p>
              <strong>Priority 2:</strong> After making changes, use the Security Scanner to verify 
              all issues are resolved.
            </p>
            <p className="text-sm text-muted-foreground">
              Note: Database security fixes have been applied automatically via migrations. 
              Only authentication settings require manual configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};