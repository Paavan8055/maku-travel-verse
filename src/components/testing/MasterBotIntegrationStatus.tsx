import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Bot, Activity, CheckCircle, Clock, AlertTriangle, 
  Brain, Zap, Database, Settings
} from 'lucide-react';
import { useMasterBotAnalysis } from '@/hooks/useMasterBotAnalysis';
import { supabase } from '@/integrations/supabase/client';

interface MasterBotStatus {
  isConnected: boolean;
  lastActivity: Date | null;
  activeCommands: number;
  completedAnalyses: number;
  averageResponseTime: number;
  aiModelStatus: 'active' | 'degraded' | 'offline';
}

export const MasterBotIntegrationStatus = () => {
  const [status, setStatus] = useState<MasterBotStatus>({
    isConnected: false,
    lastActivity: null,
    activeCommands: 0,
    completedAnalyses: 0,
    averageResponseTime: 0,
    aiModelStatus: 'offline'
  });
  const [isLoading, setIsLoading] = useState(true);
  const { isAnalyzing, latestAnalysis, requestAnalysis } = useMasterBotAnalysis();

  useEffect(() => {
    fetchMasterBotStatus();
    const interval = setInterval(fetchMasterBotStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMasterBotStatus = async () => {
    try {
      setIsLoading(true);

      // Check recent bot activity
      const { data: recentCommands } = await supabase
        .from('admin_bot_commands')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Check active commands
      const { data: activeCommands } = await supabase
        .from('admin_bot_commands')
        .select('*')
        .in('execution_status', ['pending', 'processing']);

      // Check recent bot results
      const { data: botResults } = await supabase
        .from('bot_result_aggregation')
        .select('*')
        .eq('bot_id', 'master-bot-controller')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate metrics
      const completedCommands = recentCommands?.filter(cmd => cmd.execution_status === 'completed') || [];
      const avgResponseTime = completedCommands.length > 0 
        ? completedCommands.reduce((acc, cmd) => acc + (cmd.actual_duration_minutes || 0), 0) / completedCommands.length
        : 0;

      const lastActivity = recentCommands?.[0]?.created_at 
        ? new Date(recentCommands[0].created_at) 
        : null;

      // Determine AI model status
      let aiModelStatus: 'active' | 'degraded' | 'offline' = 'offline';
      if (botResults && botResults.length > 0) {
        const recentSuccess = botResults.some(result => 
          result.created_at > new Date(Date.now() - 60 * 60 * 1000).toISOString()
        );
        aiModelStatus = recentSuccess ? 'active' : 'degraded';
      }

      setStatus({
        isConnected: (activeCommands?.length || 0) > 0 || (completedCommands.length > 0),
        lastActivity,
        activeCommands: activeCommands?.length || 0,
        completedAnalyses: botResults?.length || 0,
        averageResponseTime: avgResponseTime,
        aiModelStatus
      });

    } catch (error) {
      console.error('Error fetching Master Bot status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testMasterBotConnection = async () => {
    await requestAnalysis('system_health', {
      timestamp: new Date().toISOString(),
      test_type: 'connection_test',
      services: ['provider_diagnostics', 'system_health', 'performance']
    }, 'Test Master Bot connection and AI analysis capabilities. Verify all systems are operational.');
  };

  const getStatusColor = (isConnected: boolean, aiStatus: string) => {
    if (!isConnected) return 'text-red-500';
    if (aiStatus === 'active') return 'text-green-500';
    if (aiStatus === 'degraded') return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getStatusBadge = (isConnected: boolean, aiStatus: string) => {
    if (!isConnected) return <Badge variant="destructive">Offline</Badge>;
    if (aiStatus === 'active') return <Badge variant="default">Active</Badge>;
    if (aiStatus === 'degraded') return <Badge variant="secondary">Degraded</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 animate-pulse" />
            <span>Checking Master Bot status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className={`h-5 w-5 ${getStatusColor(status.isConnected, status.aiModelStatus)}`} />
            Master Bot Integration Status
          </div>
          {getStatusBadge(status.isConnected, status.aiModelStatus)}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Connection:</span>
            <Badge variant={status.isConnected ? "default" : "destructive"}>
              {status.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">AI Model:</span>
            <Badge variant={
              status.aiModelStatus === 'active' ? 'default' : 
              status.aiModelStatus === 'degraded' ? 'secondary' : 'destructive'
            }>
              {status.aiModelStatus}
            </Badge>
          </div>
        </div>

        {/* Activity Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Active Commands:</span>
            </div>
            <Badge variant="outline">{status.activeCommands}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Completed (24h):</span>
            </div>
            <Badge variant="outline">{status.completedAnalyses}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Avg Response Time:</span>
            </div>
            <Badge variant="outline">{status.averageResponseTime.toFixed(1)}min</Badge>
          </div>
        </div>

        {/* Last Activity */}
        {status.lastActivity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>Last activity: {status.lastActivity.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</span>
          </div>
        )}

        {/* Latest Analysis Preview */}
        {latestAnalysis && (
          <div className="border rounded-lg p-3 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Latest AI Analysis</span>
              <Badge variant="outline" className={
                latestAnalysis.severity === 'critical' ? 'text-red-600' :
                latestAnalysis.severity === 'high' ? 'text-orange-600' :
                latestAnalysis.severity === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }>
                {latestAnalysis.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {latestAnalysis.summary.slice(0, 120)}...
            </p>
          </div>
        )}

        {/* Test Connection */}
        <Button 
          onClick={testMasterBotConnection}
          disabled={isAnalyzing}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Test Master Bot Connection
            </>
          )}
        </Button>

        {/* Health Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Integration Health</span>
            <span className="font-medium">
              {status.isConnected && status.aiModelStatus === 'active' ? '100%' : 
               status.isConnected ? '70%' : '0%'}
            </span>
          </div>
          <Progress 
            value={
              status.isConnected && status.aiModelStatus === 'active' ? 100 : 
              status.isConnected ? 70 : 0
            } 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};