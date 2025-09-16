import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  Shield,
  Settings,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';

interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastError?: string;
}

export function Phase3RecoveryPanel() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [recoverySteps, setRecoverySteps] = useState<RecoveryStep[]>([
    {
      id: 'credential-test',
      name: 'Provider Credential Test',
      description: 'Test all provider credentials and authentication',
      status: 'pending'
    },
    {
      id: 'emergency-fix',
      name: 'Emergency Provider Fix',
      description: 'Reset circuit breakers and clear critical alerts',
      status: 'pending'
    },
    {
      id: 'individual-test',
      name: 'Individual Provider Testing',
      description: 'Test each provider endpoint individually',
      status: 'pending'
    },
    {
      id: 'search-validation',
      name: 'End-to-End Search Validation',
      description: 'Validate hotel, flight, and activity search functionality',
      status: 'pending'
    }
  ]);
  
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);

  const updateStep = (stepId: string, updates: Partial<RecoveryStep>) => {
    setRecoverySteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const executeCredentialTest = async () => {
    updateStep('credential-test', { status: 'running' });
    
    try {
      const { data, error } = await supabase.functions.invoke('credential-test');
      
      if (error) throw error;
      
      updateStep('credential-test', { 
        status: 'completed',
        result: data
      });
      
      return data;
    } catch (error) {
      updateStep('credential-test', { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const executeEmergencyFix = async () => {
    updateStep('emergency-fix', { status: 'running' });
    
    try {
      const { data, error } = await supabase.functions.invoke('emergency-provider-fix');
      
      if (error) throw error;
      
      updateStep('emergency-fix', { 
        status: 'completed',
        result: data
      });
      
      return data;
    } catch (error) {
      updateStep('emergency-fix', { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const executeIndividualTests = async () => {
    updateStep('individual-test', { status: 'running' });
    
    try {
      const tests = [
        { provider: 'amadeus', test: 'amadeus-hotel-offers' },
        { provider: 'sabre', test: 'sabre-flight-search' },
        { provider: 'hotelbeds', test: 'hotelbeds-activities' }
      ];
      
      const results = [];
      
      for (const test of tests) {
        try {
          const { data, error } = await supabase.functions.invoke(test.test, {
            body: { validate: true }
          });
          
          results.push({
            provider: test.provider,
            status: error ? 'failed' : 'healthy',
            error: error?.message
          });
        } catch (err) {
          results.push({
            provider: test.provider,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Test failed'
          });
        }
      }
      
      setProviderHealth(results);
      
      updateStep('individual-test', { 
        status: 'completed',
        result: results
      });
      
      return results;
    } catch (error) {
      updateStep('individual-test', { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const executeSearchValidation = async () => {
    updateStep('search-validation', { status: 'running' });
    
    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'hotel',
          params: {
            cityCode: 'SYD',
            checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            checkOutDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            adults: 2
          }
        }
      });
      
      if (error) throw error;
      
      updateStep('search-validation', { 
        status: 'completed',
        result: data
      });
      
      return data;
    } catch (error) {
      updateStep('search-validation', { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const executeFullRecovery = async () => {
    setIsExecuting(true);
    
    try {
      toast.info('Starting Phase 3 Critical Recovery...');
      
      // Step 1: Credential Test
      const credentialResults = await executeCredentialTest();
      
      // Step 2: Emergency Fix
      const emergencyResults = await executeEmergencyFix();
      
      // Step 3: Individual Tests
      const individualResults = await executeIndividualTests();
      
      // Step 4: Search Validation
      const searchResults = await executeSearchValidation();
      
      toast.success('Phase 3 Recovery completed successfully!');
      
    } catch (error) {
      toast.error('Recovery process failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExecuting(false);
    }
  };

  const getStepIcon = (status: RecoveryStep['status']) => {
    switch (status) {
      case 'pending':
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStepBadge = (status: RecoveryStep['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'running':
        return <Badge className="bg-blue-600">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Phase 3 Critical Recovery
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Automated provider credential recovery and system restoration
            </p>
          </div>
          <Button
            onClick={executeFullRecovery}
            disabled={isExecuting}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isExecuting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Execute Recovery
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This will automatically test credentials, reset circuit breakers, and validate all provider endpoints.
            The process typically takes 2-5 minutes to complete.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {recoverySteps.map((step) => (
            <div 
              key={step.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStepIcon(step.status)}
                <div>
                  <div className="font-medium">{step.name}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                  {step.error && (
                    <div className="text-sm text-red-600 mt-1">{step.error}</div>
                  )}
                </div>
              </div>
              {getStepBadge(step.status)}
            </div>
          ))}
        </div>

        {providerHealth.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Provider Health Status
            </h4>
            <div className="grid gap-2">
              {providerHealth.map((provider) => (
                <div 
                  key={provider.provider}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <span className="font-medium capitalize">{provider.provider}</span>
                  <div className="flex items-center gap-2">
                    {provider.status === 'healthy' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <Badge 
                      variant={provider.status === 'healthy' ? 'default' : 'destructive'}
                      className={provider.status === 'healthy' ? 'bg-green-600' : ''}
                    >
                      {provider.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}