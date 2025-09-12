import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSmartFailureRecovery } from '@/hooks/useSmartFailureRecovery';
import { AlertTriangle, RefreshCw, TrendingUp, Clock } from 'lucide-react';

export const SmartFailureRecoveryPanel: React.FC = () => {
  const { failurePatterns, isRecovering } = useSmartFailureRecovery();

  const getRecoveryProgress = (consecutiveFailures: number, recoveryAttempts: number) => {
    const maxRetries = consecutiveFailures <= 2 ? 3 : consecutiveFailures <= 5 ? 2 : 1;
    return Math.min((recoveryAttempts / maxRetries) * 100, 100);
  };

  const getFailureSeverity = (consecutiveFailures: number) => {
    if (consecutiveFailures >= 7) return { level: 'critical', color: 'destructive' };
    if (consecutiveFailures >= 5) return { level: 'high', color: 'destructive' };
    if (consecutiveFailures >= 3) return { level: 'medium', color: 'secondary' };
    return { level: 'low', color: 'outline' };
  };

  const getNextRetryTime = (consecutiveFailures: number, recoveryAttempts: number) => {
    const baseDelay = 30000; // 30 seconds
    const maxDelay = 900000; // 15 minutes
    const delay = Math.min(baseDelay * Math.pow(2, recoveryAttempts), maxDelay);
    return new Date(Date.now() + delay);
  };

  const activeFailures = failurePatterns.filter(p => p.consecutiveFailures > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 ${isRecovering ? 'animate-spin' : ''}`} />
          Smart Failure Recovery
          {isRecovering && (
            <Badge variant="secondary" className="ml-2">
              Recovering...
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Automated failure detection and intelligent recovery strategies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeFailures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">All systems healthy</p>
            <p className="text-sm">No active failure patterns detected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeFailures.map((pattern) => {
              const severity = getFailureSeverity(pattern.consecutiveFailures);
              const progress = getRecoveryProgress(pattern.consecutiveFailures, pattern.recoveryAttempts);
              const nextRetry = getNextRetryTime(pattern.consecutiveFailures, pattern.recoveryAttempts);

              return (
                <div key={pattern.testSuite} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${severity.level === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                      <span className="font-medium">{pattern.testSuite}</span>
                    </div>
                    <Badge variant={severity.color as any}>
                      {severity.level} severity
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Consecutive failures:</span>
                      <span className="ml-2 font-medium">{pattern.consecutiveFailures}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recovery attempts:</span>
                      <span className="ml-2 font-medium">{pattern.recoveryAttempts}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last failure:</span>
                      <span className="ml-2 font-medium">
                        {new Date(pattern.lastFailureTime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Next retry:</span>
                      <span className="ml-1 font-medium text-xs">
                        {nextRetry.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {pattern.recoveryAttempts > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Recovery progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                    {severity.level === 'critical' && (
                      <p>🚨 Critical failure - administrators have been notified</p>
                    )}
                    {severity.level === 'high' && (
                      <p>⚠️ High severity - implementing extended retry intervals</p>
                    )}
                    {severity.level === 'medium' && (
                      <p>📊 Monitoring pattern - applying exponential backoff</p>
                    )}
                    {severity.level === 'low' && (
                      <p>🔄 Minor issues detected - standard recovery in progress</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Recovery Statistics */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Recovery Statistics</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Active patterns:</span>
                  <span className="ml-2 font-medium">{activeFailures.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total attempts:</span>
                  <span className="ml-2 font-medium">
                    {activeFailures.reduce((sum, p) => sum + p.recoveryAttempts, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Critical alerts:</span>
                  <span className="ml-2 font-medium">
                    {activeFailures.filter(p => p.consecutiveFailures >= 7).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};