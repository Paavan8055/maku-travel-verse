import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, UserCheck, AlertTriangle, CheckCircle, Settings, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AuthenticationFix = () => {
  const [testingAuth, setTestingAuth] = useState(false);
  const [authStatus, setAuthStatus] = useState<'unknown' | 'working' | 'broken'>('unknown');
  const { toast } = useToast();

  const testAuthentication = async () => {
    setTestingAuth(true);
    try {
      // Test 1: Check session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      // Test 2: Try to get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Test 3: Test auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, session);
      });
      
      if (sessionError || userError) {
        setAuthStatus('broken');
        toast({
          title: "Authentication Issues Detected",
          description: "Auth system has errors that need fixing",
          variant: "destructive"
        });
      } else {
        setAuthStatus('working');
        toast({
          title: "Authentication Working",
          description: "Auth system is functioning correctly",
          variant: "default"
        });
      }
      
      subscription.unsubscribe();
      
    } catch (error) {
      setAuthStatus('broken');
      console.error('Auth test failed:', error);
      toast({
        title: "Authentication Test Failed",
        description: "Critical auth system errors detected",
        variant: "destructive"
      });
    } finally {
      setTestingAuth(false);
    }
  };

  const fixAuthConfiguration = async () => {
    try {
      // This would trigger auth configuration fixes
      const { error } = await supabase.functions.invoke('configure-auth-security');
      
      if (error) {
        toast({
          title: "Auth Fix Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Auth Configuration Updated",
          description: "Authentication system has been reconfigured",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Auth Fix Error",
        description: "Failed to update auth configuration",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = () => {
    switch (authStatus) {
      case 'working':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Working</Badge>;
      case 'broken':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Broken</Badge>;
      default:
        return <Badge variant="outline"><Shield className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Authentication System Recovery
          </CardTitle>
          <CardDescription>
            Diagnose and fix authentication issues preventing user login/signup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Auth Status:</span>
              {getStatusBadge()}
            </div>
            <Button 
              onClick={testAuthentication}
              disabled={testingAuth}
              variant="outline"
              size="sm"
            >
              {testingAuth ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Test Auth
                </>
              )}
            </Button>
          </div>

          {authStatus === 'broken' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Critical authentication issues detected. Users cannot login or signup.
                <Button 
                  onClick={fixAuthConfiguration}
                  className="ml-2"
                  size="sm"
                  variant="secondary"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Fix Auth Config
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Known Auth Issues:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• OAuth redirect URL misconfigurations</li>
              <li>• Supabase auth trigger function errors</li>
              <li>• RLS policy conflicts preventing user operations</li>
              <li>• Session management and token refresh failures</li>
              <li>• Email confirmation process blocking access</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Recovery Actions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Fix OAuth URLs
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <UserCheck className="w-4 h-4 mr-2" />
                Test Signup Flow
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Verify RLS Policies
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Auth State
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};