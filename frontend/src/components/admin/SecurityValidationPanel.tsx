import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Play, CheckCircle, AlertTriangle, XCircle, Clock, Zap } from "lucide-react";

interface ValidationTest {
  id: string;
  test_category: string;
  test_name: string;
  test_description: string;
  test_status: string;
  test_result: any;
  execution_time_ms: number;
  last_run_at: string;
}

export const SecurityValidationPanel = () => {
  const [tests, setTests] = useState<ValidationTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('system_validation_tests')
        .select('*')
        .order('test_category', { ascending: true });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast({
        title: "Failed to Load Tests",
        description: "Could not load validation tests",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const runTest = async (testId: string) => {
    setRunningTests(prev => new Set(prev).add(testId));
    
    try {
      const { data, error } = await supabase.rpc('run_validation_test', {
        p_test_id: testId
      });

      if (error) throw error;

      toast({
        title: "Test Completed",
        description: `Test completed`,
        variant: "default"
      });

      // Refresh tests to get updated status
      await fetchTests();
    } catch (error) {
      console.error('Error running test:', error);
      toast({
        title: "Test Failed",
        description: "Failed to execute test",
        variant: "destructive"
      });
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev);
        next.delete(testId);
        return next;
      });
    }
  };

  const runAllTestsInCategory = async (category: string) => {
    const categoryTests = tests.filter(test => test.test_category === category);
    setLoading(true);

    try {
      for (const test of categoryTests) {
        await runTest(test.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'skipped': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'secondary';
      default: return 'outline';
    }
  };

  const testsByCategory = tests.reduce((acc, test) => {
    if (!acc[test.test_category]) {
      acc[test.test_category] = [];
    }
    acc[test.test_category].push(test);
    return acc;
  }, {} as Record<string, ValidationTest[]>);

  const getCategoryStats = (categoryTests: ValidationTest[]) => {
    const total = categoryTests.length;
    const passed = categoryTests.filter(t => t.test_status === 'passed').length;
    const failed = categoryTests.filter(t => t.test_status === 'failed').length;
    const pending = categoryTests.filter(t => t.test_status === 'pending').length;
    const running = categoryTests.filter(t => t.test_status === 'running').length;
    
    return { total, passed, failed, pending, running };
  };

  const overallStats = {
    total: tests.length,
    passed: tests.filter(t => t.test_status === 'passed').length,
    failed: tests.filter(t => t.test_status === 'failed').length,
    pending: tests.filter(t => t.test_status === 'pending').length,
    running: tests.filter(t => t.test_status === 'running').length,
  };

  const overallProgress = overallStats.total > 0 
    ? ((overallStats.passed + overallStats.failed) / overallStats.total) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Validation & Testing Suite
          </CardTitle>
          <CardDescription>
            Comprehensive security and functionality validation for production readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{overallStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{overallStats.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{overallStats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{overallStats.running}</div>
                <div className="text-sm text-muted-foreground">Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{overallStats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(testsByCategory).map(([category, categoryTests]) => {
        const stats = getCategoryStats(categoryTests);
        const categoryProgress = stats.total > 0 
          ? ((stats.passed + stats.failed) / stats.total) * 100 
          : 0;

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="capitalize">{category.replace('_', ' ')} Tests</CardTitle>
                  <CardDescription>
                    {stats.passed}/{stats.total} tests passed
                  </CardDescription>
                </div>
                <Button
                  onClick={() => runAllTestsInCategory(category)}
                  disabled={loading || stats.running > 0}
                  variant="outline"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run All
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(categoryProgress)}%</span>
                </div>
                <Progress value={categoryProgress} className="h-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(runningTests.has(test.id) ? 'running' : test.test_status)}
                        <span className="font-medium">{test.test_name.replace('_', ' ')}</span>
                        <Badge variant={getStatusColor(test.test_status) as any}>
                          {runningTests.has(test.id) ? 'running' : test.test_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {test.test_description}
                      </p>
                      {test.execution_time_ms && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          {test.execution_time_ms}ms
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => runTest(test.id)}
                      disabled={runningTests.has(test.id) || loading}
                      variant="ghost"
                      size="sm"
                    >
                      {runningTests.has(test.id) ? 'Running...' : 'Run Test'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};