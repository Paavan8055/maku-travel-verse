
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Search, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Bot, Activity, TrendingUp, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedLogging } from '@/hooks/useEnhancedLogging';
import { useMasterBotAnalysis } from '@/hooks/useMasterBotAnalysis';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { correlationId } from '@/utils/correlationId';

interface CorrelationData {
  id: string;
  correlation_id: string;
  request_type: string;
  status: string;
  created_at: string;
  completed_at?: string;
  duration_ms?: number;
  request_data: any;
  response_data?: any;
  user_id?: string;
  service_name?: string;
  error_message?: string;
  metadata?: any;
}

interface CorrelationPattern {
  pattern_type: string;
  frequency: number;
  avg_duration: number;
  success_rate: number;
  recommendations: string[];
}

interface MasterBotInsight {
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  confidence: number;
}

export const CorrelationTracker = () => {
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'failed'>('all');
  const [error, setError] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<CorrelationPattern[]>([]);
  const [insights, setInsights] = useState<MasterBotInsight[]>([]);
  const [activeTab, setActiveTab] = useState('tracking');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { toast } = useToast();
  const { logSingle } = useEnhancedLogging();
  const { 
    requestAnalysis, 
    isAnalyzing: botAnalyzing, 
    latestAnalysis 
  } = useMasterBotAnalysis();
  const { isConnected, events } = useRealTimeData();

  // Auto-populate correlation data from enhanced logging
  const populateCorrelationData = useCallback(async () => {
    try {
      // Log the correlation tracking activity
      await logSingle({
        service_name: 'correlation_tracker',
        log_level: 'info',
        message: 'Auto-populating correlation data from system operations',
        request_id: correlationId.getCurrentId()
      });

      // Generate sample correlation data for testing
      const sampleData = [
        {
          correlation_id: correlationId.generateId(),
          request_type: 'hotel_search',
          status: 'completed',
          service_name: 'booking_engine',
          duration_ms: 1250,
          request_data: { city: 'Sydney', checkin: '2024-02-15', checkout: '2024-02-18' },
          response_data: { results: 45, cached: false },
          user_id: 'user-123'
        },
        {
          correlation_id: correlationId.generateId(),
          request_type: 'flight_booking',
          status: 'in_progress',
          service_name: 'amadeus_api',
          duration_ms: null,
          request_data: { origin: 'SYD', destination: 'LAX', passengers: 2 },
          user_id: 'user-456'
        },
        {
          correlation_id: correlationId.generateId(),
          request_type: 'payment_processing',
          status: 'failed',
          service_name: 'stripe_api',
          duration_ms: 3400,
          request_data: { amount: 1250.00, currency: 'AUD' },
          error_message: 'Card declined',
          user_id: 'user-789'
        }
      ];

      // Insert sample data into correlation_tracking table
      for (const item of sampleData) {
        const { error } = await supabase
          .from('correlation_tracking')
          .upsert({
            ...item,
            created_at: new Date().toISOString(),
            completed_at: item.status === 'completed' ? new Date().toISOString() : null
          });
        
        if (error) {
          console.error('Failed to insert correlation data:', error);
        }
      }
    } catch (error) {
      console.error('Error populating correlation data:', error);
    }
  }, [logSingle]);

  const fetchCorrelations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('correlation_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (searchId.trim()) {
        query = query.or(`correlation_id.ilike.%${searchId}%,user_id.eq.${searchId}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Failed to fetch correlation data:', fetchError);
        setError('Unable to connect to correlation database');
        setCorrelations([]);
        toast({
          title: "Connection Error",
          description: "Could not load correlation tracking data",
          variant: "destructive"
        });
      } else {
        setCorrelations(data || []);
        
        // If no data found, show empty state; do not auto-populate
        if (!data || data.length === 0) {
          setCorrelations([]);
        } else {
          analyzeCorrelationPatterns(data);
        }
      }
    } catch (error) {
      console.error('Correlation fetch error:', error);
      setError('Failed to fetch correlation data');
      setCorrelations([]);
      toast({
        title: "Database Error",
        description: "Unable to load correlation tracking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Analyze patterns using Master Bot
  const analyzeCorrelationPatterns = useCallback(async (data: CorrelationData[]) => {
    if (!data || data.length === 0) return;

    setIsAnalyzing(true);
    
    try {
      // Generate pattern analysis
      const patternData = {
        total_requests: data.length,
        success_rate: (data.filter(d => d.status === 'completed').length / data.length) * 100,
        avg_duration: data.reduce((acc, d) => acc + (d.duration_ms || 0), 0) / data.length,
        common_failures: data.filter(d => d.status === 'failed').map(d => d.error_message || d.request_data?.error_message || d.response_data?.error_message || 'Unknown error'),
        request_types: [...new Set(data.map(d => d.request_type))],
        services: [...new Set(data.map(d => (d.service_name || d.request_data?.service_name || d.request_data?.service || d.response_data?.service_name)).filter(Boolean))]
      };

      // Request Master Bot analysis
      await requestAnalysis(
        'system_health',
        patternData,
        `Analyze correlation tracking patterns and identify performance bottlenecks, failure patterns, and optimization opportunities for ${data.length} tracked requests.`
      );

      // Generate local insights
      const newInsights: MasterBotInsight[] = [];
      
      if (patternData.success_rate < 90) {
        newInsights.push({
          pattern: 'low_success_rate',
          severity: 'high',
          message: `Success rate is ${patternData.success_rate.toFixed(1)}%, below optimal threshold`,
          recommendation: 'Investigate failed requests and implement retry mechanisms',
          confidence: 0.95
        });
      }

      if (patternData.avg_duration > 2000) {
        newInsights.push({
          pattern: 'high_latency',
          severity: 'medium',
          message: `Average response time ${(patternData.avg_duration / 1000).toFixed(2)}s exceeds target`,
          recommendation: 'Optimize service calls and implement caching strategies',
          confidence: 0.87
        });
      }

      setInsights(newInsights);
      
    } catch (error) {
      console.error('Error analyzing correlation patterns:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [requestAnalysis]);

  // Real-time subscription for correlation updates
  useEffect(() => {
    const channel = supabase
      .channel('correlation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'correlation_tracking'
        },
        (payload) => {
          console.log('Real-time correlation update:', payload);
          fetchCorrelations(); // Refresh data on any change
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Correlation Tracked",
              description: `New ${payload.new.request_type} request being tracked`,
              variant: "default"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Auto-refresh based on real-time events
  useEffect(() => {
    if (events.length > 0) {
      const relevantEvents = events.filter(event => 
        event.source === 'correlation_tracking' || 
        event.type === 'system_alert'
      );
      
      if (relevantEvents.length > 0) {
        fetchCorrelations();
      }
    }
  }, [events]);

  useEffect(() => {
    fetchCorrelations();
  }, [filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDateTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Australia/Sydney',
        hour12: false
      }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCorrelations();
  };

  const handleRefresh = () => {
    setSearchId('');
    setFilter('all');
    fetchCorrelations();
  };

  const triggerMasterBotAnalysis = async () => {
    if (correlations.length === 0) {
      toast({
        title: "No Data Available",
        description: "Cannot analyze correlation patterns without data",
        variant: "destructive"
      });
      return;
    }

    await analyzeCorrelationPatterns(correlations);
    toast({
      title: "Analysis Triggered",
      description: "Master Bot is analyzing correlation patterns",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-foreground">Correlation Tracker</h2>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Real-time Active' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={triggerMasterBotAnalysis}
              disabled={isAnalyzing || botAnalyzing || correlations.length === 0}
              variant="outline"
              size="sm"
            >
              <Bot className={`h-4 w-4 mr-2 ${(isAnalyzing || botAnalyzing) ? 'animate-pulse' : ''}`} />
              Analyze Patterns
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Search by correlation ID or user ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tracking">
              <Activity className="h-4 w-4 mr-2" />
              Tracking ({correlations.length})
            </TabsTrigger>
            <TabsTrigger value="patterns">
              <TrendingUp className="h-4 w-4 mr-2" />
              Patterns & Analytics
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Bot className="h-4 w-4 mr-2" />
              Master Bot Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-4">
            {/* Filter Tabs for Tracking */}
            <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({correlations.length})</TabsTrigger>
                <TabsTrigger value="in_progress">
                  In Progress ({correlations.filter(c => c.status === 'in_progress').length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({correlations.filter(c => c.status === 'completed').length})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Failed ({correlations.filter(c => c.status === 'failed').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Correlations List */}
            <div className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading correlations...</p>
                  </CardContent>
                </Card>
              ) : correlations.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No correlations found</p>
                    <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                correlations.map((correlation) => (
                  <Card key={correlation.id} className="border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(correlation.status)}
                          <CardTitle className="text-lg font-semibold">
                            {correlation.request_type.replace(/_/g, ' ').toUpperCase()}
                          </CardTitle>
                          <Badge className={`${getStatusColor(correlation.status)} border`}>
                            {correlation.status.toUpperCase()}
                          </Badge>
                          {(correlation.service_name ||
                            correlation.request_data?.service_name ||
                            correlation.request_data?.service ||
                            correlation.response_data?.service_name) && (
                            <Badge variant="outline" className="text-xs">
                              {correlation.service_name ||
                                correlation.request_data?.service_name ||
                                correlation.request_data?.service ||
                                correlation.response_data?.service_name}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {formatDuration(correlation.duration_ms)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1 text-foreground">Correlation ID</p>
                          <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded border">
                            {correlation.correlation_id}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-1 text-foreground">Timestamps</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Started: {formatDateTime(correlation.created_at)}</p>
                            {correlation.completed_at && (
                              <p>Completed: {formatDateTime(correlation.completed_at)}</p>
                            )}
                          </div>
                        </div>

                        {correlation.user_id && (
                          <div>
                            <p className="text-sm font-medium mb-1 text-foreground">User ID</p>
                            <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded border">
                              {correlation.user_id}
                            </p>
                          </div>
                        )}

                        {(correlation.error_message ||
                          correlation.request_data?.error_message ||
                          correlation.response_data?.error_message) && (
                          <div>
                            <p className="text-sm font-medium mb-1 text-foreground">Error Message</p>
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                              {correlation.error_message ||
                                correlation.request_data?.error_message ||
                                correlation.response_data?.error_message}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium mb-1 text-foreground">Request Data</p>
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded border max-h-20 overflow-y-auto">
                            <pre>{JSON.stringify(correlation.request_data, null, 2)}</pre>
                          </div>
                        </div>

                        {correlation.response_data && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium mb-1 text-foreground">Response Data</p>
                            <div className="text-xs text-muted-foreground bg-muted p-2 rounded border max-h-32 overflow-y-auto">
                              <pre>{JSON.stringify(correlation.response_data, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Correlation Patterns & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {correlations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {((correlations.filter(c => c.status === 'completed').length / correlations.length) * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(correlations.reduce((acc, c) => acc + (c.duration_ms || 0), 0) / correlations.length)}ms
                        </div>
                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">
                          {[...new Set(correlations.map(c => c.request_type))].length}
                        </div>
                        <p className="text-sm text-muted-foreground">Request Types</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data available for pattern analysis</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Master Bot Insights
                  {(isAnalyzing || botAnalyzing) && <Zap className="h-4 w-4 animate-pulse text-yellow-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <Alert key={index} variant={insight.severity === 'high' || insight.severity === 'critical' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">{insight.message}</p>
                            <p className="text-sm">{insight.recommendation}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Pattern: {insight.pattern}</span>
                              <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No insights available yet</p>
                    <Button onClick={triggerMasterBotAnalysis} disabled={isAnalyzing || botAnalyzing || correlations.length === 0}>
                      Generate Insights
                    </Button>
                  </div>
                )}
                
                {latestAnalysis && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Latest Master Bot Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">{latestAnalysis.summary || 'Analysis in progress...'}</p>
                        {latestAnalysis.actionItems && latestAnalysis.actionItems.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Action Items:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                              {latestAnalysis.actionItems.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Analysis Complete | Generated: {new Date().toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
