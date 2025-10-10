import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Save, Download, Upload, Trash2, Copy, Settings } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestCase {
  id: string;
  name: string;
  agentId: string;
  intent: string;
  params: any;
  expectedResult: any;
  lastRun?: string;
  status?: 'pass' | 'fail' | 'pending';
  actualResult?: any;
  executionTime?: number;
}

export const AgentTestingSuite: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [newTestDialog, setNewTestDialog] = useState(false);
  const { toast } = useToast();

  const [newTest, setNewTest] = useState<Partial<TestCase>>({
    name: '',
    agentId: '',
    intent: '',
    params: {},
    expectedResult: {}
  });

  const runSingleTest = async (testCase: TestCase) => {
    setRunningTests(prev => new Set(prev).add(testCase.id));
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('agents', {
        body: {
          agent_id: testCase.agentId,
          intent: testCase.intent,
          params: testCase.params
        }
      });

      const executionTime = Date.now() - startTime;
      const status: 'pass' | 'fail' = error ? 'fail' : 'pass';
      
      const updatedTest: TestCase = {
        ...testCase,
        status,
        actualResult: data || error,
        executionTime,
        lastRun: new Date().toISOString()
      };

      setTestCases(prev => prev.map(test => 
        test.id === testCase.id ? updatedTest : test
      ));

      toast({
        title: status === 'pass' ? "Test Passed" : "Test Failed",
        description: `${testCase.name} completed in ${executionTime}ms`,
        variant: status === 'pass' ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Test execution error:', error);
      toast({
        title: "Test Error",
        description: "Failed to execute test",
        variant: "destructive"
      });
    } finally {
      setRunningTests(prev => {
        const next = new Set(prev);
        next.delete(testCase.id);
        return next;
      });
    }
  };

  const runAllTests = async () => {
    setBulkRunning(true);
    const results = { passed: 0, failed: 0 };
    
    for (const testCase of testCases) {
      await runSingleTest(testCase);
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setBulkRunning(false);
    toast({
      title: "Bulk Test Complete",
      description: `${results.passed} passed, ${results.failed} failed`,
    });
  };

  const createTestCase = () => {
    if (!newTest.name || !newTest.agentId) {
      toast({
        title: "Validation Error",
        description: "Name and Agent ID are required",
        variant: "destructive"
      });
      return;
    }

    const testCase: TestCase = {
      id: `test-${Date.now()}`,
      name: newTest.name!,
      agentId: newTest.agentId!,
      intent: newTest.intent || 'test',
      params: newTest.params || {},
      expectedResult: newTest.expectedResult || {},
      status: 'pending'
    };

    setTestCases(prev => [...prev, testCase]);
    setNewTest({ name: '', agentId: '', intent: '', params: {}, expectedResult: {} });
    setNewTestDialog(false);
    
    toast({
      title: "Test Created",
      description: `Test case "${testCase.name}" has been created`,
    });
  };

  const exportTests = () => {
    const dataStr = JSON.stringify(testCases, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agent-tests.json';
    link.click();
  };

  const importTests = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setTestCases(prev => [...prev, ...imported]);
        toast({
          title: "Tests Imported",
          description: `${imported.length} test cases imported`,
        });
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to parse test file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pass': return <Badge className="bg-green-500 text-white">Pass</Badge>;
      case 'fail': return <Badge variant="destructive">Fail</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      default: return <Badge variant="secondary">Not Run</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Testing Suite</h1>
          <p className="text-muted-foreground">Create, manage, and execute comprehensive tests for all agents</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importTests}
            className="hidden"
            id="import-tests"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-tests')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={exportTests}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={newTestDialog} onOpenChange={setNewTestDialog}>
            <DialogTrigger asChild>
              <Button>Create Test</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Test Case</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Test Name</label>
                  <Input
                    value={newTest.name || ''}
                    onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter test name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Agent ID</label>
                  <Input
                    value={newTest.agentId || ''}
                    onChange={(e) => setNewTest(prev => ({ ...prev, agentId: e.target.value }))}
                    placeholder="Enter agent ID"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Intent</label>
                  <Input
                    value={newTest.intent || ''}
                    onChange={(e) => setNewTest(prev => ({ ...prev, intent: e.target.value }))}
                    placeholder="test"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Parameters (JSON)</label>
                  <Textarea
                    value={JSON.stringify(newTest.params, null, 2)}
                    onChange={(e) => {
                      try {
                        setNewTest(prev => ({ ...prev, params: JSON.parse(e.target.value) }));
                      } catch (error) {
                        console.error("Invalid JSON provided for test parameters", error);
                      }
                    }}
                    placeholder="{}"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewTestDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTestCase}>
                    <Save className="h-4 w-4 mr-2" />
                    Create Test
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Test Execution Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Execution</span>
            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={bulkRunning || testCases.length === 0}
                className="flex items-center gap-2"
              >
                {bulkRunning ? <LoadingSpinner size="sm" /> : <Play className="h-4 w-4" />}
                Run All Tests ({testCases.length})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{testCases.length}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {testCases.filter(t => t.status === 'pass').length}
              </div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {testCases.filter(t => t.status === 'fail').length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {testCases.filter(t => !t.status || t.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases List */}
      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {testCases.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Test Cases</h3>
              <p className="text-muted-foreground">Create your first test case to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testCases.map((testCase) => (
                <div key={testCase.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{testCase.name}</h4>
                      {getStatusBadge(testCase.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Agent: {testCase.agentId}</span>
                      <span>Intent: {testCase.intent}</span>
                      {testCase.executionTime && <span>Duration: {testCase.executionTime}ms</span>}
                      {testCase.lastRun && <span>Last Run: {new Date(testCase.lastRun).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTest(testCase)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => runSingleTest(testCase)}
                      disabled={runningTests.has(testCase.id)}
                    >
                      {runningTests.has(testCase.id) ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTestCases(prev => prev.filter(t => t.id !== testCase.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Detail Dialog */}
      <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Test Case Details: {selectedTest?.name}</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="params">Parameters</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Test Name</label>
                    <p className="text-sm mt-1">{selectedTest.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedTest.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Agent ID</label>
                    <p className="text-sm mt-1">{selectedTest.agentId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Intent</label>
                    <p className="text-sm mt-1">{selectedTest.intent}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="params" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Input Parameters</label>
                  <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-auto">
                    {JSON.stringify(selectedTest.params, null, 2)}
                  </pre>
                </div>
                <div>
                  <label className="text-sm font-medium">Expected Result</label>
                  <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-auto">
                    {JSON.stringify(selectedTest.expectedResult, null, 2)}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="results" className="space-y-4">
                {selectedTest.actualResult ? (
                  <div>
                    <label className="text-sm font-medium">Actual Result</label>
                    <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-auto max-h-64">
                      {JSON.stringify(selectedTest.actualResult, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No results yet. Run the test to see results.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};