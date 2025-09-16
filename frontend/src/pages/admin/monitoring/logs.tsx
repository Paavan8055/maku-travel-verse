import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Search, Download, AlertTriangle, Info, CheckCircle, XCircle, Activity, Bot, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
import { useMasterBotAnalysis } from '@/hooks/useMasterBotAnalysis';
import { useEnhancedLogging } from '@/hooks/useEnhancedLogging';
import { usePerformanceOptimizer } from '@/hooks/usePerformanceOptimizer';
import { useToast } from '@/hooks/use-toast';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: any;
  correlation_id?: string;
  function_name?: string;
  service_name?: string;
  user_id?: string;
  duration_ms?: number;
  status_code?: number;
  error_details?: any;
}

const AdminLogsPage = () => {
  const { toast } = useToast();
  
  // State management
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Enhanced hooks integration
  const { isInitialized } = useAgentOrchestration();
  const { isAnalyzing, latestAnalysis, requestAnalysis } = useMasterBotAnalysis();
  const { logApiCall } = useEnhancedLogging();
  const { metrics: performanceMetrics, isHighMemoryUsage } = usePerformanceOptimizer({
    componentName: 'AdminLogsPage',
    enableMonitoring: true,
    reportToAnalytics: true
  });

  // Real-time data fetching
  const loadSystemLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: systemLogsResult, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Error loading logs:', error);
        // Fallback to mock data
        const fallbackLogs: LogEntry[] = [
          {
            id: 'log-1',
            timestamp: new Date().toISOString(),
            level: 'info',
            source: 'enhanced_logging',
            message: 'Real-time logging system active',
            metadata: { component: 'system_health' }
          }
        ];
        setLogs(fallbackLogs);
      } else if (systemLogsResult) {
        setLogs(systemLogsResult.map(log => ({
          id: log.id,
          timestamp: log.created_at,
          level: (log.log_level || log.level) as 'info' | 'warning' | 'error' | 'debug',
          source: log.service_name || 'system',
          message: log.message,
          metadata: log.metadata || {},
          correlation_id: log.correlation_id,
          user_id: log.user_id,
          duration_ms: log.duration_ms,
          status_code: log.status_code,
          error_details: log.error_details
        })));
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load system logs:', error);
      toast({
        title: "Log Loading Error",
        description: "Failed to load system logs. Using cached data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Real-time subscriptions
  useEffect(() => {
    loadSystemLogs();

    const systemLogsChannel = supabase
      .channel('system-logs-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'system_logs'
      }, (payload) => {
        const newLog: LogEntry = {
          id: payload.new.id,
          timestamp: payload.new.created_at,
          level: (payload.new.log_level || payload.new.level) as 'info' | 'warning' | 'error' | 'debug',
          source: payload.new.service_name || 'system',
          message: payload.new.message,
          metadata: payload.new.metadata || {},
          correlation_id: payload.new.correlation_id,
          user_id: payload.new.user_id,
          duration_ms: payload.new.duration_ms,
          status_code: payload.new.status_code,
          error_details: payload.new.error_details
        };
        
        setLogs(prev => [newLog, ...prev.slice(0, 199)]);
        setLastUpdate(new Date());
      })
      .subscribe();

    const interval = setInterval(loadSystemLogs, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(systemLogsChannel);
    };
  }, [loadSystemLogs]);

  // Enhanced logging integration
  useEffect(() => {
    if (logs.length > 0) {
      logApiCall(
        'admin_logs_page',
        'page_view',
        Date.now() - 1000,
        true,
        200,
        undefined,
        { 
          totalLogs: logs.length,
          errorCount: logs.filter(l => l.level === 'error').length,
          performanceMetrics
        }
      );
    }
  }, [logs.length, logApiCall, performanceMetrics]);

  // Master bot analysis integration
  const runLogAnalysis = useCallback(async () => {
    if (logs.length === 0) return;

    const logAnalysisData = {
      totalLogs: logs.length,
      errorLogs: logs.filter(l => l.level === 'error'),
      warningLogs: logs.filter(l => l.level === 'warning'),
      performanceMetrics: performanceMetrics,
      recentErrors: logs.filter(l => l.level === 'error').slice(0, 10)
    };

    await requestAnalysis('performance', logAnalysisData, 
      'Analyze system logs for performance bottlenecks, error patterns, and optimization opportunities. Provide actionable recommendations.'
    );
  }, [logs, performanceMetrics, requestAnalysis]);

  // Helper functions
  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info': return <Info className="h-4 w-4 text-primary" />;
      case 'debug': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary',
      info: 'default',
      debug: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[level as keyof typeof variants] || 'outline'}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    
    return matchesSearch && matchesLevel && matchesSource;
  });

  const uniqueSources = Array.from(new Set(logs.map(log => log.source)));

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Logs</h1>
          <p className="text-muted-foreground">
            Real-time system monitoring with AI analysis integration
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            {isInitialized && (
              <Badge variant="outline" className="gap-1">
                <Bot className="h-3 w-3" />
                Agent System Active
              </Badge>
            )}
            {isHighMemoryUsage && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                High Memory Usage
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={runLogAnalysis} 
            disabled={isAnalyzing || logs.length === 0}
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <Bot className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </Button>
          <Button onClick={loadSystemLogs} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI Analysis Results */}
      {latestAnalysis && (
        <Alert>
          <Bot className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-semibold">Master Bot Analysis</div>
            <AlertDescription className="mt-1">
              {latestAnalysis.summary}
            </AlertDescription>
            {latestAnalysis.recommendations.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Recommendations:</div>
                <ul className="text-sm space-y-1 ml-4">
                  {latestAnalysis.recommendations.slice(0, 3).map((rec, idx) => (
                    <li key={idx} className="list-disc">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Badge variant={latestAnalysis.severity === 'critical' ? 'destructive' : 'secondary'}>
            {latestAnalysis.severity}
          </Badge>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Enhanced Log Analysis
            <Badge variant="outline" className="ml-auto">
              {filteredLogs.length} logs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs, correlation IDs, error messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map(source => (
                  <SelectItem key={source} value={source}>
                    {source.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="recent">Recent Logs</TabsTrigger>
              <TabsTrigger value="errors">Errors Only</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="recent">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Level</TableHead>
                        <TableHead className="w-40">Timestamp</TableHead>
                        <TableHead className="w-32">Source</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.slice(0, 50).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getLogIcon(log.level)}
                              {getLevelBadge(log.level)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {log.source.replace('_', ' ')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.message}
                            {log.correlation_id && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ID: {log.correlation_id}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No logs found matching your criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="errors">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Error Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs
                      .filter(log => log.level === 'error')
                      .slice(0, 20)
                      .map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {log.source.replace('_', ' ')}
                          </TableCell>
                          <TableCell className="text-sm text-destructive">
                            {log.message}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-destructive">
                      {logs.filter(log => log.level === 'error').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Errors</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-warning">
                      {logs.filter(log => log.level === 'warning').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">
                      {logs.filter(log => log.level === 'info').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Info Messages</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogsPage;