import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, XCircle, Play, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

interface RecoveryPlan {
  planId: string;
  status: 'initializing' | 'running' | 'completed' | 'failed';
  steps: RecoveryStep[];
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  summary?: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    recoveredProviders: string[];
    failedProviders: string[];
  };
}

export const SystemRecoveryOrchestrator = () => {
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const executeRecovery = async () => {
    setIsExecuting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('system-recovery-orchestrator', {
        body: { action: 'execute' }
      });

      if (error) throw error;

      if (data?.success) {
        setRecoveryPlan(data.recoveryPlan);
        toast({
          title: "Recovery Completed",
          description: `System recovery completed in ${Math.round(data.recoveryPlan.totalDuration / 1000)}s`,
        });
      } else {
        throw new Error(data?.error || 'Recovery failed');
      }
    } catch (error) {
      console.error('Recovery execution failed:', error);
      toast({
        title: "Recovery Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const calculateProgress = () => {
    if (!recoveryPlan) return 0;
    const completedSteps = recoveryPlan.steps.filter(s => s.status === 'completed').length;
    return (completedSteps / recoveryPlan.steps.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          System Recovery Orchestrator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Execute comprehensive system recovery to restore all providers
            </p>
          </div>
          <Button 
            onClick={executeRecovery} 
            disabled={isExecuting}
            className="flex items-center gap-2"
          >
            {isExecuting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isExecuting ? 'Executing...' : 'Start Recovery'}
          </Button>
        </div>

        {recoveryPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Recovery Plan: {recoveryPlan.planId}</h4>
                <p className="text-sm text-muted-foreground">
                  Status: {getStatusBadge(recoveryPlan.status)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{Math.round(calculateProgress())}% Complete</div>
                <Progress value={calculateProgress()} className="w-32" />
              </div>
            </div>

            <div className="space-y-3">
              {recoveryPlan.steps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <span className="font-medium">{step.name}</span>
                    </div>
                    {getStatusBadge(step.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {step.description}
                  </p>
                  {step.duration && (
                    <div className="text-xs text-muted-foreground">
                      Duration: {Math.round(step.duration / 1000)}s
                    </div>
                  )}
                  {step.error && (
                    <div className="text-xs text-red-500 mt-1">
                      Error: {step.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {recoveryPlan.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recovery Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Steps Completed</div>
                      <div className="text-2xl font-bold text-green-600">
                        {recoveryPlan.summary.completedSteps}/{recoveryPlan.summary.totalSteps}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Total Duration</div>
                      <div className="text-2xl font-bold">
                        {Math.round((recoveryPlan.totalDuration || 0) / 1000)}s
                      </div>
                    </div>
                  </div>
                  
                  {recoveryPlan.summary.recoveredProviders.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-green-600">Recovered Providers</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recoveryPlan.summary.recoveredProviders.map(provider => (
                          <Badge key={provider} variant="default">{provider}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {recoveryPlan.summary.failedProviders.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-red-600">Failed Providers</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recoveryPlan.summary.failedProviders.map(provider => (
                          <Badge key={provider} variant="destructive">{provider}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};