import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, RotateCcw, Download, Settings, TestTube2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { correlationId } from '@/utils/correlationId';

interface TestScenario {
  id: string;
  name: string;
  type: 'hotel' | 'flight' | 'activity' | 'multi-service';
  parameters: Record<string, any>;
  expectedOutcome: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number;
}

interface TestResult {
  id: string;
  scenarioId: string;
  provider: string;
  status: 'running' | 'passed' | 'failed' | 'timeout';
  duration: number;
  startTime: Date;
  endTime?: Date;
  logs: string[];
  error?: string;
  responseData?: any;
}

interface BatchTestRun {
  id: string;
  name: string;
  scenarios: string[];
  providers: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  results: TestResult[];
  startTime?: Date;
  endTime?: Date;
}

export const UnifiedTestSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scenarios');
  const [scenarios] = useState<TestScenario[]>([
    {
      id: 'hotel-basic-search',
      name: 'Basic Hotel Search',
      type: 'hotel',
      parameters: { 
        city: 'SYD', 
        checkIn: '2024-12-01', 
        checkOut: '2024-12-03',
        adults: 2,
        rooms: 1
      },
      expectedOutcome: 'Returns 10+ hotel offers',
      complexity: 'simple',
      estimatedDuration: 30
    },
    {
      id: 'flight-roundtrip',
      name: 'Round-trip Flight Search',
      type: 'flight',
      parameters: {
        origin: 'SYD',
        destination: 'MEL',
        departureDate: '2024-12-15',
        returnDate: '2024-12-20',
        adults: 1,
        cabin: 'ECONOMY'
      },
      expectedOutcome: 'Returns valid flight combinations',
      complexity: 'medium',
      estimatedDuration: 45
    },
    {
      id: 'activity-search',
      name: 'Activity Search in Sydney',
      type: 'activity',
      parameters: {
        city: 'SYD',
        dateFrom: '2024-12-01',
        dateTo: '2024-12-07'
      },
      expectedOutcome: 'Returns local activities',
      complexity: 'simple',
      estimatedDuration: 25
    },
    {
      id: 'multi-service-booking',
      name: 'Complete Trip Booking',
      type: 'multi-service',
      parameters: {
        hotel: { city: 'SYD', checkIn: '2024-12-01', checkOut: '2024-12-03' },
        flight: { origin: 'MEL', destination: 'SYD', departureDate: '2024-12-01' },
        activity: { city: 'SYD', date: '2024-12-02' }
      },
      expectedOutcome: 'Successful end-to-end booking flow',
      complexity: 'complex',
      estimatedDuration: 120
    }
  ]);

  const [batchRuns, setBatchRuns] = useState<BatchTestRun[]>([]);
  const [individualResults, setIndividualResults] = useState<Record<string, TestResult>>({});
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['amadeus', 'sabre', 'hotelbeds']);
  const [isRunning, setIsRunning] = useState(false);

  const runBatchTest = useCallback(async () => {
    if (selectedScenarios.length === 0 || selectedProviders.length === 0) return;

    const batchId = `batch-${Date.now()}`;
    const newBatch: BatchTestRun = {
      id: batchId,
      name: `Batch Test - ${new Date().toLocaleString()}`,
      scenarios: selectedScenarios,
      providers: selectedProviders,
      status: 'running',
      progress: 0,
      results: [],
      startTime: new Date()
    };

    setBatchRuns(prev => [newBatch, ...prev]);
    setIsRunning(true);

    try {
      const { data, error } = await supabase.functions.invoke('deployment-validator', {
        body: {
          batchTest: true,
          scenarios: selectedScenarios.map(id => scenarios.find(s => s.id === id)),
          providers: selectedProviders,
          correlationId: correlationId.getCurrentId()
        },
        headers: correlationId.getHeaders()
      });

      if (error) throw error;

      // Update batch with results
      setBatchRuns(prev => prev.map(batch => 
        batch.id === batchId 
          ? { 
              ...batch, 
              status: 'completed', 
              progress: 100, 
              results: data.results || [],
              endTime: new Date()
            }
          : batch
      ));
    } catch (err) {
      console.error('Batch test failed:', err);
      setBatchRuns(prev => prev.map(batch => 
        batch.id === batchId 
          ? { ...batch, status: 'failed', endTime: new Date() }
          : batch
      ));
    } finally {
      setIsRunning(false);
    }
  }, [selectedScenarios, selectedProviders, scenarios]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <TestTube2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getComplexityBadge = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return <Badge variant="outline" className="text-green-600 border-green-200">Simple</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Medium</Badge>;
      case 'complex':
        return <Badge variant="outline" className="text-red-600 border-red-200">Complex</Badge>;
      default:
        return <Badge variant="outline">{complexity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5 text-primary" />
            Unified Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
              <TabsTrigger value="batch">Batch Testing</TabsTrigger>
              <TabsTrigger value="history">Test History</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map(scenario => (
                  <Card key={scenario.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{scenario.name}</h4>
                          <p className="text-sm text-muted-foreground">{scenario.type}</p>
                        </div>
                        {getComplexityBadge(scenario.complexity)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Expected: </span>
                          <span>{scenario.expectedOutcome}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          <span>{scenario.estimatedDuration}s</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          disabled={individualResults[scenario.id]?.status === 'running'}
                          onClick={async () => {
                            console.log('Running individual test:', scenario.name);
                            
                            // Set running state
                            setIndividualResults(prev => ({
                              ...prev,
                              [scenario.id]: {
                                id: `individual-${scenario.id}-${Date.now()}`,
                                scenarioId: scenario.id,
                                provider: 'multi',
                                status: 'running',
                                duration: 0,
                                startTime: new Date(),
                                logs: ['Starting test...']
                              }
                            }));

                            try {
                              const { data, error } = await supabase.functions.invoke('deployment-validator', {
                                body: {
                                  singleTest: true,
                                  scenario: scenario,
                                  correlationId: correlationId.getCurrentId()
                                },
                                headers: correlationId.getHeaders()
                              });
                              
                              const endTime = new Date();
                              const result = {
                                id: `individual-${scenario.id}-${Date.now()}`,
                                scenarioId: scenario.id,
                                provider: 'multi',
                                status: error ? 'failed' : 'passed',
                                duration: endTime.getTime() - (individualResults[scenario.id]?.startTime?.getTime() || Date.now()),
                                startTime: individualResults[scenario.id]?.startTime || new Date(),
                                endTime,
                                logs: [
                                  'Starting test...',
                                  ...(data?.logs || []),
                                  error ? `Error: ${error.message}` : 'Test completed successfully'
                                ],
                                error: error?.message,
                                responseData: data
                              } as TestResult;

                              setIndividualResults(prev => ({
                                ...prev,
                                [scenario.id]: result
                              }));
                              
                              console.log('Test result:', data || error);
                            } catch (err: any) {
                              const endTime = new Date();
                              setIndividualResults(prev => ({
                                ...prev,
                                [scenario.id]: {
                                  ...prev[scenario.id],
                                  status: 'failed',
                                  endTime,
                                  duration: endTime.getTime() - (prev[scenario.id]?.startTime?.getTime() || Date.now()),
                                  error: err.message || 'Test execution failed',
                                  logs: [...(prev[scenario.id]?.logs || []), `Error: ${err.message || 'Test execution failed'}`]
                                }
                              }));
                              console.error('Test failed:', err);
                            }
                          }}
                        >
                          {individualResults[scenario.id]?.status === 'running' ? (
                            <>
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Run
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Individual Test Results */}
                      {individualResults[scenario.id] && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-md border">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(individualResults[scenario.id].status)}
                            <span className="text-sm font-medium">
                              {individualResults[scenario.id].status === 'running' ? 'Running...' : 
                               individualResults[scenario.id].status === 'passed' ? 'Test Passed' :
                               'Test Failed'}
                            </span>
                            {individualResults[scenario.id].endTime && (
                              <span className="text-xs text-muted-foreground">
                                ({individualResults[scenario.id].duration}ms)
                              </span>
                            )}
                          </div>
                          
                          {individualResults[scenario.id].error && (
                            <div className="text-xs text-red-600 mb-2">
                              Error: {individualResults[scenario.id].error}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            <div>Started: {individualResults[scenario.id].startTime.toLocaleTimeString()}</div>
                            {individualResults[scenario.id].endTime && (
                              <div>Completed: {individualResults[scenario.id].endTime?.toLocaleTimeString()}</div>
                            )}
                          </div>
                          
                          {individualResults[scenario.id].logs.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                                View Logs ({individualResults[scenario.id].logs.length})
                              </summary>
                              <div className="mt-1 text-xs bg-black/5 p-2 rounded max-h-32 overflow-y-auto">
                                {individualResults[scenario.id].logs.map((log, index) => (
                                  <div key={index} className="font-mono">{log}</div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Test Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Test Scenarios</label>
                    <div className="grid grid-cols-2 gap-2">
                      {scenarios.map(scenario => (
                        <label key={scenario.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedScenarios.includes(scenario.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScenarios(prev => [...prev, scenario.id]);
                              } else {
                                setSelectedScenarios(prev => prev.filter(id => id !== scenario.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{scenario.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Providers</label>
                    <div className="flex gap-2">
                      {['amadeus', 'sabre', 'hotelbeds'].map(provider => (
                        <label key={provider} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedProviders.includes(provider)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProviders(prev => [...prev, provider]);
                              } else {
                                setSelectedProviders(prev => prev.filter(p => p !== provider));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm capitalize">{provider}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={runBatchTest} 
                    disabled={isRunning || selectedScenarios.length === 0}
                    className="w-full"
                  >
                    {isRunning ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Batch Test
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-4">
                {batchRuns.map(batch => (
                  <Card key={batch.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{batch.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {batch.scenarios.length} scenarios across {batch.providers.length} providers
                          </p>
                        </div>
                        <Badge 
                          variant={batch.status === 'completed' ? 'default' : batch.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {batch.status}
                        </Badge>
                      </div>

                      {batch.status === 'running' && (
                        <div className="mb-3">
                          <Progress value={batch.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {batch.progress}% complete
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Started: {batch.startTime?.toLocaleString()}</span>
                        {batch.endTime && (
                          <span>
                            Duration: {Math.round((batch.endTime.getTime() - batch.startTime!.getTime()) / 1000)}s
                          </span>
                        )}
                      </div>

                      {batch.results.length > 0 && (
                        <div className="mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Test</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Duration</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batch.results.map(result => (
                                <TableRow key={result.id}>
                                  <TableCell className="text-sm">
                                    {scenarios.find(s => s.id === result.scenarioId)?.name}
                                  </TableCell>
                                  <TableCell className="text-sm capitalize">
                                    {result.provider}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(result.status)}
                                      <span className="text-sm">{result.status}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {result.duration}ms
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {batchRuns.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <TestTube2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No test runs yet. Start a batch test to see results here.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Default Timeout (seconds)</label>
                      <Input type="number" defaultValue="60" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Retry Attempts</label>
                      <Input type="number" defaultValue="3" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Parallel Execution Limit</label>
                      <Input type="number" defaultValue="5" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Environment</label>
                      <Select defaultValue="staging">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button className="w-full">Save Configuration</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};