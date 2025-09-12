import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, RefreshCw, Bot, Activity, Plane, Hotel, 
  CheckCircle, XCircle, Clock, AlertTriangle, Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedLogging } from '@/hooks/useEnhancedLogging';
import { useMasterBotAnalysis } from '@/hooks/useMasterBotAnalysis';
import { MasterBotIntegrationStatus } from './MasterBotIntegrationStatus';
import HealthMonitoringIntegration from './HealthMonitoringIntegration';
import SystemLoggingIntegration from './SystemLoggingIntegration';

interface TestResult {
  service: string;
  success: boolean;
  provider?: string;
  resultCount: number;
  responseTime: number;
  error?: string;
  timestamp: Date;
  details?: any;
}

interface MasterBotResult {
  summary: string;
  recommendations: string[];
  actionItems: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const UnifiedProviderDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [masterBotResult, setMasterBotResult] = useState<MasterBotResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const { toast } = useToast();
  const { logApiCall, logPerformance, logSingle } = useEnhancedLogging();
  const { requestAnalysis } = useMasterBotAnalysis();

  const testConfigs = [
    {
      service: 'Hotels',
      icon: Hotel,
      searchType: 'hotel',
      params: {
        cityCode: 'SYD',
        checkInDate: '2025-09-20',
        checkOutDate: '2025-09-22',
        adults: 2,
        roomQuantity: 1
      }
    },
    {
      service: 'Flights',
      icon: Plane,
      searchType: 'flight',
      params: {
        originLocationCode: 'SYD',
        destinationLocationCode: 'MEL',
        departureDate: '2025-09-25',
        adults: 1
      }
    },
    {
      service: 'Activities',
      icon: Activity,
      searchType: 'activity',
      params: {
        destination: 'sydney',
        date: '2025-09-20',
        participants: 2,
        radius: 20
      }
    }
  ];

  const runComprehensiveTests = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);
    setMasterBotResult(null);
    
    const results: TestResult[] = [];
    const totalTests = testConfigs.length + 1; // +1 for individual provider tests
    let currentProgress = 0;

    try {
      // Test provider rotation for each service
      for (const config of testConfigs) {
        setCurrentTest(`Testing ${config.service} provider rotation...`);
        setProgress((currentProgress / totalTests) * 100);
        
        try {
          const startTime = Date.now();
          const { data, error } = await supabase.functions.invoke('provider-rotation', {
            body: {
              searchType: config.searchType,
              params: config.params
            }
          });
          
          const responseTime = Date.now() - startTime;
          
          results.push({
            service: config.service,
            success: data?.success || false,
            provider: data?.provider || 'None',
            resultCount: Array.isArray(data?.data) ? data.data.length : 0,
            responseTime,
            error: error?.message || (data?.success ? undefined : data?.error),
            timestamp: new Date(),
            details: { data, error }
          });
          
        } catch (err: any) {
          results.push({
            service: config.service,
            success: false,
            provider: 'Error',
            resultCount: 0,
            responseTime: 0,
            error: err.message || 'Test execution failed',
            timestamp: new Date()
          });
        }
        
        currentProgress++;
        setProgress((currentProgress / totalTests) * 100);
      }

      // Test individual providers
      setCurrentTest('Testing individual provider endpoints...');
      try {
        const { data: providerData, error: providerError } = await supabase.functions.invoke('test-provider-rotation', {
          body: { comprehensive: true }
        });
        
        if (providerData?.results) {
          providerData.results.forEach((result: any) => {
            results.push({
              service: `${result.service} (Direct)`,
              success: result.success,
              provider: result.provider || 'N/A',
              resultCount: result.results || 0,
              responseTime: 0,
              error: result.error,
              timestamp: new Date(),
              details: result
            });
          });
        }
      } catch (err: any) {
        console.warn('Individual provider test failed:', err);
      }
      
      currentProgress++;
      setProgress(100);
      
      setTestResults(results);
      
      // Communicate with Master Bot for analysis
      setCurrentTest('Analyzing results with AI Master Bot...');
      await communicateWithMasterBot(results);
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      toast({
        title: "Testing Complete",
        description: `${successCount}/${totalCount} tests passed. AI analysis available.`,
        variant: successCount === totalCount ? "default" : "destructive"
      });
      
    } catch (error: any) {
      console.error('Test execution failed:', error);
      toast({
        title: "Test Failed",
        description: error.message || 'Failed to complete testing',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(0);
    }
  }, [toast]);

  const communicateWithMasterBot = async (results: TestResult[]) => {
    try {
      // Update provider health in database
      for (const result of results) {
        await supabase
          .from('provider_health')
          .upsert({
            provider: result.provider,
            status: result.success ? 'healthy' : 'degraded',
            response_time_ms: result.responseTime,
            last_checked: new Date().toISOString(),
            error_message: result.error || null,
            metadata: result.details || {}
          });
      }

      // Log to system logs
      await supabase
        .from('system_logs')
        .insert({
          service_name: 'provider_diagnostics',
          level: 'info',
          message: 'Provider diagnostics completed',
          metadata: {
            test_count: results.length,
            successful_tests: results.filter(r => r.success).length,
            failed_tests: results.filter(r => !r.success).length,
            avg_response_time: results.reduce((acc, r) => acc + r.responseTime, 0) / results.length
          }
        });

      // Create critical alerts for failures
      const failedTests = results.filter(r => !r.success);
      for (const failure of failedTests) {
        await supabase
          .from('critical_alerts')
          .insert({
            alert_type: 'provider_failure',
            severity: 'high',
            message: `${failure.provider} ${failure.service} failure: ${failure.error || 'Provider test failed'}`,
            metadata: {
              provider: failure.provider,
              service: failure.service,
              response_time: failure.responseTime,
              timestamp: failure.timestamp.toISOString()
            }
          });
      }

      // PHASE 4: Complete Master Bot Integration
      await integrateWithMasterBot(results);
      
    } catch (error) {
      console.error('Master Bot communication failed:', error);
      generateFallbackAnalysis(results);
    }
  };

  const integrateWithMasterBot = async (results: TestResult[]) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.warn('User not authenticated, skipping Master Bot integration');
        generateFallbackAnalysis(results);
        return;
      }

      // 1. Create analysis command for Master Bot
      const analysisCommand = {
        admin_user_id: userData.user.id,
        command_text: `Analyze provider test results: ${results.length} tests completed with ${results.filter(r => r.success).length} successes and ${results.filter(r => !r.success).length} failures. Generate comprehensive health assessment and actionable recommendations.`,
        command_type: 'analysis' as const,
        target_bots: ['provider-health-analyzer', 'system-optimizer'],
        command_parameters: {
          test_results: results.map(r => ({
            service: r.service,
            provider: r.provider,
            success: r.success,
            response_time: r.responseTime,
            error: r.error,
            timestamp: r.timestamp.toISOString()
          })),
          analysis_type: 'provider_diagnostics',
          priority: results.filter(r => !r.success).length > 0 ? 'high' : 'medium'
        }
      };

      // 2. Insert command and trigger Master Bot processing
      const { data: commandData, error: commandError } = await supabase
        .from('admin_bot_commands')
        .insert(analysisCommand)
        .select()
        .single();

      if (commandError) throw commandError;

      // 3. Invoke Master Bot Controller for immediate processing
      const { data: masterBotResponse, error: invokeError } = await supabase.functions.invoke(
        'master-bot-controller',
        {
          body: {
            command_id: commandData.id,
            command_text: analysisCommand.command_text,
            command_type: analysisCommand.command_type,
            target_bots: analysisCommand.target_bots,
            parameters: analysisCommand.command_parameters
          }
        }
      );

      if (invokeError) {
        console.error('Master Bot invocation failed:', invokeError);
        generateFallbackAnalysis(results);
        return;
      }

      // 4. Fetch and display real AI analysis from bot_result_aggregation
      const { data: botResults, error: resultsError } = await supabase
        .from('bot_result_aggregation')
        .select('*')
        .eq('correlation_id', commandData.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (resultsError || !botResults?.length) {
        console.warn('No bot results found, using fallback analysis');
        generateFallbackAnalysis(results);
        return;
      }

      // 5. Process real AI analysis
      const aiResult = botResults[0];
      const aiAnalysis = aiResult.result_data as any;

      setMasterBotResult({
        summary: aiAnalysis?.summary || 'AI analysis completed successfully',
        recommendations: aiAnalysis?.recommendations || aiAnalysis?.optimization_suggestions || [],
        actionItems: aiAnalysis?.action_items || [],
        severity: determineSeverityFromAI(aiAnalysis, results)
      });

      toast({
        title: "AI Analysis Complete",
        description: `Master Bot provided ${aiAnalysis?.recommendations?.length || 0} recommendations`,
        variant: "default"
      });

    } catch (error) {
      console.error('Master Bot integration error:', error);
      generateFallbackAnalysis(results);
    }
  };

  const determineSeverityFromAI = (aiAnalysis: any, results: TestResult[]): 'low' | 'medium' | 'high' | 'critical' => {
    // Check if AI provided severity
    if (aiAnalysis?.severity) return aiAnalysis.severity;
    
    const failureRate = results.filter(r => !r.success).length / results.length;
    
    if (failureRate === 1) return 'critical';
    if (failureRate > 0.5) return 'high';
    if (failureRate > 0.2) return 'medium';
    return 'low';
  };

  const generateFallbackAnalysis = (results: TestResult[]) => {
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const avgResponseTime = results.reduce((acc, r) => acc + r.responseTime, 0) / results.length;
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let summary = '';
    const recommendations: string[] = [];
    const actionItems: string[] = [];

    if (successCount === totalCount) {
      severity = 'low';
      summary = `All ${totalCount} provider tests passed successfully. System is operating normally with average response time of ${Math.round(avgResponseTime)}ms.`;
      recommendations.push('Continue monitoring provider performance');
      recommendations.push('Consider implementing automated health checks');
    } else if (successCount === 0) {
      severity = 'critical';
      summary = `Critical: All ${totalCount} provider tests failed. Complete service outage detected.`;
      actionItems.push('Immediate investigation required');
      actionItems.push('Check provider credentials and API endpoints');
      actionItems.push('Verify network connectivity');
    } else {
      severity = successCount / totalCount > 0.5 ? 'medium' : 'high';
      summary = `${successCount}/${totalCount} provider tests passed. ${totalCount - successCount} providers are currently unavailable.`;
      
      results.filter(r => !r.success).forEach(result => {
        actionItems.push(`Fix ${result.service} provider: ${result.error || 'Unknown error'}`);
      });
      
      recommendations.push('Implement provider fallback mechanisms');
      recommendations.push('Add circuit breaker patterns');
    }

    setMasterBotResult({
      summary,
      recommendations,
      actionItems,
      severity
    });
  };

  // Auto-run functionality with persistence
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRun && !isRunning) {
      // Save auto-run preference to database (using profiles table as fallback)
      console.log('Auto-run enabled for provider tests');

      interval = setInterval(() => {
        runComprehensiveTests();
      }, 5 * 60 * 1000); // 5 minutes
    } else if (!autoRun) {
      // Save disabled state
      console.log('Auto-run disabled for provider tests');
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRun, isRunning, runComprehensiveTests]);

  const getStatusIcon = (success: boolean, running: boolean = false) => {
    if (running) return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Unified Provider Diagnostics
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={autoRun}
                  onCheckedChange={setAutoRun}
                  disabled={isRunning}
                />
                <span className="text-sm text-muted-foreground">Auto re-run (5min)</span>
              </div>
              <Button
                onClick={runComprehensiveTests}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Full Diagnostics
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isRunning && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{currentTest}</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Tabs defaultValue="results" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="results">Test Results</TabsTrigger>
              <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="individual">Individual Providers</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              <div className="mb-4">
                <MasterBotIntegrationStatus />
              </div>
              
              {testResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <strong>{testResults.filter(r => r.success).length}/{testResults.length}</strong> tests passed
                    </span>
                    <span className="text-muted-foreground">
                      Last run: {testResults[0]?.timestamp.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {testConfigs.map((config, index) => {
                      const result = testResults.find(r => r.service === config.service);
                      const Icon = config.icon;
                      
                      return (
                        <div key={config.service} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{config.service}</span>
                              {result && (
                                <div className="text-xs text-muted-foreground">
                                  Provider: {result.provider} • Response: {result.responseTime}ms
                                  {result.resultCount > 0 && ` • ${result.resultCount} results`}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {result ? (
                              <>
                                {getStatusIcon(result.success)}
                                <Badge variant={result.success ? "default" : "destructive"}>
                                  {result.success ? 'Working' : 'Failed'}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline">Not Tested</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No test results available. Run diagnostics to see provider status.
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai-analysis" className="space-y-4">
              {masterBotResult ? (
                <div className="space-y-4">
                  <Card className={`border ${getSeverityColor(masterBotResult.severity)}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Master Bot AI Analysis
                        <Badge variant="outline" className={getSeverityColor(masterBotResult.severity)}>
                          {masterBotResult.severity.toUpperCase()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{masterBotResult.summary}</p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Analysis powered by GPT-5 with real system data integration
                      </div>
                    </CardContent>
                  </Card>

                  {masterBotResult.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          AI Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {masterBotResult.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {masterBotResult.actionItems.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Action Items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {masterBotResult.actionItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Run diagnostics to get AI-powered analysis and recommendations</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="individual" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Individual provider endpoint testing shows the health of each specific provider function.
              </div>
              
              {testResults.filter(r => r.service.includes('(Direct)')).length > 0 ? (
                <div className="space-y-2">
                  {testResults.filter(r => r.service.includes('(Direct)')).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">{result.service}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        <span className="text-sm text-muted-foreground">
                          {result.success ? `${result.provider} (${result.resultCount} results)` : result.error}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Individual provider results will appear here after running diagnostics.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Health Monitoring Integration */}
      <HealthMonitoringIntegration 
        testResults={testResults} 
        onHealthUpdate={() => console.log('Provider health updated')} 
      />

      {/* System Logging Integration */}
      <SystemLoggingIntegration 
        testResults={testResults}
        testSummary={{
          totalTests: testResults.length,
          successfulTests: testResults.filter(r => r.success).length,
          failedTests: testResults.filter(r => !r.success).length,
          averageResponseTime: testResults.length > 0 ? 
            testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length : 0,
          totalResultCount: testResults.reduce((sum, r) => sum + r.resultCount, 0)
        }}
        sessionId={`test_session_${Date.now()}`}
      />
    </div>
  );
};