import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, Download, Filter, Calendar, Clock, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: any;
  correlation_id?: string;
  function_name?: string;
}

const AdminLogsPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recent');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // For now, create mock logs from edge function logs in useful context
      const mockLogs: LogEntry[] = [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          level: 'info',
          source: 'provider_quota_monitor',
          message: 'Quota check completed - 3 providers checked, no issues detected',
          metadata: { totalProviders: 3, warningCount: 0, criticalCount: 0 }
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warning',
          source: 'provider_quota_monitor',
          message: 'Sabre API error 401 - authentication issue (not quota related)',
          metadata: { provider: 'sabre', statusCode: 401 }
        },
        {
          id: 'log-3',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'warning',
          source: 'provider_quota_monitor',
          message: 'HotelBeds API error 403 - access forbidden (not quota related)',
          metadata: { provider: 'hotelbeds', statusCode: 403 }
        },
        {
          id: 'log-4',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'info',
          source: 'health_check',
          message: 'Health check stored successfully',
          metadata: { component: 'system_health' }
        },
        {
          id: 'log-5',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'info',
          source: 'foundation_repair_test',
          message: 'Foundation repair tests completed - 4 passed, 0 failed',
          metadata: { passed: 4, failed: 0 }
        },
        {
          id: 'log-6',
          timestamp: new Date(Date.now() - 400000).toISOString(),
          level: 'error',
          source: 'deployment_validator',
          message: 'Failed to send request to Edge Function - network connectivity issue',
          metadata: { error: 'FunctionsFetchError', context: 'Failed to fetch' }
        }
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Logs</h1>
          <p className="text-muted-foreground">
            System and provider performance monitoring logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
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
                        <TableHead className="w-24">Actions</TableHead>
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
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Info className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                      <TableHead>Actions</TableHead>
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
                          <TableCell className="text-sm text-red-600">
                            {log.message}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <AlertTriangle className="h-3 w-3" />
                            </Button>
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
                    <div className="text-2xl font-bold text-red-600">
                      {logs.filter(log => log.level === 'error').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Errors</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {logs.filter(log => log.level === 'warning').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
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