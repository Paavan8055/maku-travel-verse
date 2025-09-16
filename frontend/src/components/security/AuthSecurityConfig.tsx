import React from 'react';
import { AlertTriangle, Shield, Clock, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AuthSecurityConfig = () => {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Security Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Manual Configuration Required:</strong> The following security settings must be configured in your Supabase Dashboard under Authentication → Settings.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-medium">OTP Expiry</p>
                <p className="text-sm text-muted-foreground">One-time password expiration time</p>
              </div>
            </div>
            <Badge variant="outline">Set to 3600 seconds (1 hour)</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-medium">Leaked Password Protection</p>
                <p className="text-sm text-muted-foreground">Prevent use of compromised passwords</p>
              </div>
            </div>
            <Badge variant="outline">Enable</Badge>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>How to configure:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to Authentication → Settings</li>
              <li>Find "Auth Settings" section</li>
              <li>Set OTP expiry to 3600 seconds</li>
              <li>Enable "Leaked password protection"</li>
              <li>Save changes</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};