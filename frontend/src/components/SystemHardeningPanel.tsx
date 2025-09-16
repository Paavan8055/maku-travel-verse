import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Play, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export const SystemHardeningPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runSecurityAudit = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-hardening', {
        body: { action: 'audit' }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Security Audit Complete",
        description: `Security score: ${data.overallScore}% (${data.securityLevel})`,
        variant: data.overallScore > 80 ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Security Audit Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-testing-suite', {
        body: { testTypes: ['all'] }
      });

      if (error) throw error;

      toast({
        title: "System Tests Complete",
        description: `Overall score: ${data.overallScore}% (${data.summary.passed}/${data.summary.total} passed)`,
        variant: data.overallScore > 80 ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "System Tests Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Hardening & Testing
        </CardTitle>
        <CardDescription>
          Comprehensive security audit and system testing suite
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runSecurityAudit}
            disabled={isRunning}
            variant="outline"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isRunning ? "Running..." : "Security Audit"}
          </Button>
          <Button 
            onClick={runComprehensiveTests}
            disabled={isRunning}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Testing..." : "Full Test Suite"}
          </Button>
        </div>

        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Security Score</span>
              <Badge variant={results.overallScore > 80 ? "default" : "destructive"}>
                {results.overallScore}% ({results.securityLevel})
              </Badge>
            </div>
            
            <div className="space-y-2">
              {results.checks?.slice(0, 5).map((check: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                  <span className="text-sm">{check.description}</span>
                  {check.status === 'passed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>

            {results.recommendations && (
              <div className="space-y-1">
                <span className="font-medium text-sm">Recommendations:</span>
                {results.recommendations.slice(0, 3).map((rec: string, index: number) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};