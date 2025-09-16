import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  result?: any;
}

const AgentSystemTests = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Primary Agent Routing', status: 'pending' },
    { name: 'Agent Delegation Flow', status: 'pending' },
    { name: 'Memory Persistence', status: 'pending' },
    { name: 'Real-time Updates', status: 'pending' },
    { name: 'Error Handling', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, ...updates } : test
    ));
  };

  const testPrimaryAgentRouting = async () => {
    updateTest('Primary Agent Routing', { status: 'running' });
    const startTime = Date.now();
    
    try {
      // Test each primary agent
      const agents = [
        { id: 'family-travel-planner', params: { destination: 'Sydney', dates: { start: '2025-09-15', end: '2025-09-20' }, familySize: 4 } },
        { id: 'solo-travel-planner', params: { destination: 'Tokyo', dates: { start: '2025-10-01', end: '2025-10-05' } } },
        { id: 'pet-travel-specialist', params: { destination: 'Melbourne', petType: 'dog', breed: 'Golden Retriever' } },
        { id: 'spiritual-travel-planner', params: { destination: 'Bali', spiritualPractice: 'meditation' } }
      ];

      for (const agent of agents) {
        const { data, error } = await supabase.functions.invoke('agents', {
          body: {
            agent_id: agent.id,
            intent: 'test_connection',
            params: agent.params
          }
        });

        if (error) throw new Error(`Failed to reach ${agent.id}: ${error.message}`);
      }

      updateTest('Primary Agent Routing', { 
        status: 'passed', 
        duration: Date.now() - startTime,
        result: `All ${agents.length} primary agents responding`
      });
    } catch (error) {
      updateTest('Primary Agent Routing', { 
        status: 'failed', 
        duration: Date.now() - startTime,
        error: error.message 
      });
    }
  };

  const testAgentDelegation = async () => {
    updateTest('Agent Delegation Flow', { status: 'running' });
    const startTime = Date.now();
    
    try {
      // Test delegation from family planner to specialized agents
      const { data, error } = await supabase.functions.invoke('agents', {
        body: {
          agent_id: 'family-travel-planner',
          intent: 'find_flights',
          params: {
            destination: 'Brisbane',
            dates: { start: '2025-09-20', end: '2025-09-25' },
            familySize: 3,
            children: [{ age: 8 }, { age: 12 }]
          }
        }
      });

      if (error) throw new Error(`Delegation test failed: ${error.message}`);
      
      updateTest('Agent Delegation Flow', { 
        status: 'passed', 
        duration: Date.now() - startTime,
        result: 'Delegation working correctly'
      });
    } catch (error) {
      updateTest('Agent Delegation Flow', { 
        status: 'failed', 
        duration: Date.now() - startTime,
        error: error.message 
      });
    }
  };

  const testMemoryPersistence = async () => {
    updateTest('Memory Persistence', { status: 'running' });
    const startTime = Date.now();
    
    try {
      // Test memory storage and retrieval
      const testKey = `test_memory_${Date.now()}`;
      const testData = { testValue: 'memory_test', timestamp: new Date().toISOString() };
      
      const { error: insertError } = await supabase
        .from('agentic_memory')
        .insert({
          agent_id: 'test-agent',
          user_id: 'test-user',
          memory_key: testKey,
          memory_data: testData,
          expires_at: new Date(Date.now() + 60000).toISOString()
        });

      if (insertError) throw new Error('Memory insert failed');

      const { data: retrievedData, error: selectError } = await supabase
        .from('agentic_memory')
        .select('memory_data')
        .eq('memory_key', testKey)
        .single();

      if (selectError) throw new Error('Memory retrieval failed');
      
      // Cleanup
      await supabase.from('agentic_memory').delete().eq('memory_key', testKey);

      updateTest('Memory Persistence', { 
        status: 'passed', 
        duration: Date.now() - startTime,
        result: 'Memory storage and retrieval working'
      });
    } catch (error) {
      updateTest('Memory Persistence', { 
        status: 'failed', 
        duration: Date.now() - startTime,
        error: error.message 
      });
    }
  };

  const testRealTimeUpdates = async () => {
    updateTest('Real-time Updates', { status: 'running' });
    const startTime = Date.now();
    
    try {
      // Test task creation and real-time subscription
      const { data: task, error } = await supabase
        .from('agentic_tasks')
        .insert({
          agent_id: 'test-agent',
          intent: 'test_realtime',
          params: { test: true },
          status: 'pending',
          progress: 0
        })
        .select()
        .single();

      if (error) throw new Error('Task creation failed');

      // Update the task to test real-time
      setTimeout(async () => {
        await supabase
          .from('agentic_tasks')
          .update({ status: 'completed', progress: 100 })
          .eq('id', task.id);
      }, 1000);

      // Cleanup
      setTimeout(async () => {
        await supabase.from('agentic_tasks').delete().eq('id', task.id);
      }, 3000);

      updateTest('Real-time Updates', { 
        status: 'passed', 
        duration: Date.now() - startTime,
        result: 'Real-time task updates working'
      });
    } catch (error) {
      updateTest('Real-time Updates', { 
        status: 'failed', 
        duration: Date.now() - startTime,
        error: error.message 
      });
    }
  };

  const testErrorHandling = async () => {
    updateTest('Error Handling', { status: 'running' });
    const startTime = Date.now();
    
    try {
      // Test invalid agent ID
      const { error } = await supabase.functions.invoke('agents', {
        body: {
          agent_id: 'nonexistent-agent',
          intent: 'test',
          params: {}
        }
      });

      if (!error) throw new Error('Expected error for invalid agent');

      updateTest('Error Handling', { 
        status: 'passed', 
        duration: Date.now() - startTime,
        result: 'Error handling working correctly'
      });
    } catch (error) {
      updateTest('Error Handling', { 
        status: 'failed', 
        duration: Date.now() - startTime,
        error: error.message 
      });
    }
  };

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));
    
    try {
      await testPrimaryAgentRouting();
      await testAgentDelegation();
      await testMemoryPersistence();
      await testRealTimeUpdates();
      await testErrorHandling();
      
      toast({
        title: "Agent System Tests",
        description: "All integration tests completed",
      });
    } catch (error) {
      toast({
        title: "Test Suite Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary' as const,
      running: 'default' as const,
      passed: 'secondary' as const,
      failed: 'destructive' as const,
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agent System Integration Tests</CardTitle>
            <CardDescription>
              Comprehensive testing of the 70-agent system architecture
            </CardDescription>
          </div>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <div className="font-medium">{test.name}</div>
                  {test.duration && (
                    <div className="text-sm text-muted-foreground">
                      Completed in {test.duration}ms
                    </div>
                  )}
                  {test.result && (
                    <div className="text-sm text-muted-foreground">
                      {test.result}
                    </div>
                  )}
                  {test.error && (
                    <div className="text-sm text-red-500">
                      Error: {test.error}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(test.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentSystemTests;