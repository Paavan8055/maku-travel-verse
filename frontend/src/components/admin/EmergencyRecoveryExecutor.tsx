import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Loader2, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecoveryStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export const EmergencyRecoveryExecutor = () => {
  const [steps, setSteps] = useState<RecoveryStep[]>([
    { id: 'credential-test', name: 'Test Provider Credentials', status: 'pending' },
    { id: 'emergency-fix', name: 'Emergency Provider Fix', status: 'pending' },
    { id: 'provider-rotation', name: 'Test Provider Rotation', status: 'pending' },
    { id: 'search-validation', name: 'Validate Search Functions', status: 'pending' },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const updateStep = (stepId: string, updates: Partial<RecoveryStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const executeRecoveryPlan = async () => {
    setIsExecuting(true);
    
    try {
      // Step 1: Test Provider Credentials
      updateStep('credential-test', { status: 'running' });
      const { data: credentialData, error: credentialError } = await supabase.functions.invoke('provider-credential-test');
      
      if (credentialError) {
        updateStep('credential-test', { status: 'failed', error: credentialError.message });
      } else {
        updateStep('credential-test', { status: 'completed', result: credentialData });
      }

      // Step 2: Emergency Provider Fix
      updateStep('emergency-fix', { status: 'running' });
      const { data: fixData, error: fixError } = await supabase.functions.invoke('emergency-provider-fix');
      
      if (fixError) {
        updateStep('emergency-fix', { status: 'failed', error: fixError.message });
      } else {
        updateStep('emergency-fix', { status: 'completed', result: fixData });
      }

      // Step 3: Test Provider Rotation
      updateStep('provider-rotation', { status: 'running' });
      const { data: rotationData, error: rotationError } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'hotel',
          params: {
            destination: 'SYD',
            checkInDate: '2025-12-15',
            checkOutDate: '2025-12-17',
            adults: 2,
            rooms: 1
          }
        }
      });
      
      if (rotationError) {
        updateStep('provider-rotation', { status: 'failed', error: rotationError.message });
      } else {
        updateStep('provider-rotation', { status: 'completed', result: rotationData });
      }

      // Step 4: Validate Search Functions
      updateStep('search-validation', { status: 'running' });
      
      // Test multiple search types
      const searchTests = await Promise.allSettled([
        supabase.functions.invoke('amadeus-hotel-offers', {
          body: { destination: 'SYD', checkIn: '2025-12-15', checkOut: '2025-12-17', adults: 2 }
        }),
        supabase.functions.invoke('hotelbeds-search', {
          body: { destination: 'Sydney', checkIn: '2025-12-15', checkOut: '2025-12-17', guests: 2, rooms: 1 }
        }),
        supabase.functions.invoke('sabre-flight-search', {
          body: { originLocationCode: 'SYD', destinationLocationCode: 'MEL', departureDate: '2025-12-15', adults: 1 }
        })
      ]);

      const validationResults = {
        amadeus: searchTests[0].status === 'fulfilled' ? 'success' : 'failed',
        hotelbeds: searchTests[1].status === 'fulfilled' ? 'success' : 'failed', 
        sabre: searchTests[2].status === 'fulfilled' ? 'success' : 'failed',
        total: searchTests.filter(test => test.status === 'fulfilled').length
      };

      updateStep('search-validation', { status: 'completed', result: validationResults });

      toast({
        title: "Phase 3 Recovery Complete",
        description: `API connectivity restored. ${validationResults.total}/3 providers functional.`,
        variant: "default"
      });

    } catch (error) {
      console.error('Recovery execution failed:', error);
      toast({
        title: "Recovery Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
    
    setIsExecuting(false);
  };

  useEffect(() => {
    // Auto-execute on mount
    executeRecoveryPlan();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <PlayCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Phase 3 Recovery Plan - Live API Restoration
        </CardTitle>
        <CardDescription>
          Executing emergency provider fix and connectivity restoration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(step.status)}
              <div>
                <div className="font-medium">{step.name}</div>
                {step.error && (
                  <div className="text-sm text-red-600">{step.error}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(step.status)}
              {step.result && step.status === 'completed' && (
                <Badge variant="outline">
                  {step.id === 'search-validation' && step.result.total ? 
                    `${step.result.total}/3 working` : 
                    'Success'
                  }
                </Badge>
              )}
            </div>
          </div>
        ))}
        
        {isExecuting && (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Executing recovery procedures...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};