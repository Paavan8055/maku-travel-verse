import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MFAMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'recommended';
}

export function MFAConfiguration() {
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([
    {
      id: 'totp',
      name: 'Time-based OTP (TOTP)',
      description: 'Use authenticator apps like Google Authenticator or Authy',
      enabled: false,
      icon: <Smartphone className="h-5 w-5" />,
      status: 'recommended'
    },
    {
      id: 'sms',
      name: 'SMS Verification',
      description: 'Receive verification codes via SMS',
      enabled: false,
      icon: <Key className="h-5 w-5" />,
      status: 'inactive'
    },
    {
      id: 'email',
      name: 'Email Verification',
      description: 'Receive verification codes via email',
      enabled: true,
      icon: <Shield className="h-5 w-5" />,
      status: 'active'
    }
  ]);

  const [configuring, setConfiguring] = useState(false);

  const handleToggleMFA = async (methodId: string) => {
    setConfiguring(true);
    
    try {
      // Simulate API call to enable/disable MFA method
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMfaMethods(prev => prev.map(method => 
        method.id === methodId 
          ? { 
              ...method, 
              enabled: !method.enabled,
              status: !method.enabled ? 'active' : 'inactive'
            }
          : method
      ));
      
      const method = mfaMethods.find(m => m.id === methodId);
      toast.success(`${method?.name} ${!method?.enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update MFA configuration');
    } finally {
      setConfiguring(false);
    }
  };

  const enabledMethods = mfaMethods.filter(method => method.enabled);
  const securityScore = Math.min(100, (enabledMethods.length * 30) + 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Multi-Factor Authentication</h2>
          <p className="text-muted-foreground">
            Configure additional security layers for admin access
          </p>
        </div>
        <Badge variant={securityScore >= 70 ? "default" : "destructive"}>
          Security Score: {securityScore}%
        </Badge>
      </div>

      {enabledMethods.length < 2 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your project has insufficient MFA options enabled. Enable at least 2 methods for optimal security.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {mfaMethods.map((method) => (
          <Card key={method.id} className="border-l-4 border-l-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {method.icon}
                  <div>
                    <CardTitle className="text-lg">{method.name}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={
                      method.status === 'active' ? 'default' : 
                      method.status === 'recommended' ? 'secondary' : 'outline'
                    }
                  >
                    {method.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {method.status}
                  </Badge>
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={() => handleToggleMFA(method.id)}
                    disabled={configuring}
                  />
                </div>
              </div>
            </CardHeader>
            {method.enabled && method.id === 'totp' && (
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Setup Instructions:
                  </p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan the QR code or enter the secret key manually</li>
                    <li>Enter the 6-digit code to verify setup</li>
                  </ol>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>Best practices for MFA implementation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Enable TOTP (Recommended)</p>
              <p className="text-sm text-muted-foreground">
                Most secure option that works offline and doesn't rely on SMS/email delivery
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Backup Methods</p>
              <p className="text-sm text-muted-foreground">
                Enable multiple MFA methods to prevent account lockouts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Regular Security Audits</p>
              <p className="text-sm text-muted-foreground">
                Review MFA configurations monthly and remove unused methods
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          onClick={() => handleToggleMFA('totp')}
          disabled={configuring}
          variant={mfaMethods.find(m => m.id === 'totp')?.enabled ? 'outline' : 'default'}
        >
          {mfaMethods.find(m => m.id === 'totp')?.enabled ? 'Disable' : 'Enable'} TOTP
        </Button>
        <Button variant="outline" disabled={configuring}>
          Test MFA Configuration
        </Button>
      </div>
    </div>
  );
}