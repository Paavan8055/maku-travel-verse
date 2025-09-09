import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  Wifi,
  WifiOff,
  Radio,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface RealtimeEvent {
  id: string;
  type: 'bot_result' | 'admin_command' | 'dashboard_update' | 'system_alert';
  source: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  processed: boolean;
}

interface ConnectionMetrics {
  status: 'connected' | 'disconnected' | 'reconnecting';
  connectedUsers: number;
  activeChannels: number;
  messageQueue: number;
  lastHeartbeat: Date;
  latency: number;
  totalMessages: number;
  errorRate: number;
}

export const RealTimeUpdatesManager: React.FC = () => {
  const {
    isConnected,
    events,
    metrics,
    markEventAsProcessed,
    clearAllEvents,
    reconnect
  } = useRealTimeData();
  
  const [autoScroll, setAutoScroll] = useState(true);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Real-time connection is now handled by useRealTimeData hook

  // Auto-scroll to latest events
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  // Event handling is now managed by useRealTimeData hook

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bot_result': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'admin_command': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'dashboard_update': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'system_alert': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="secondary">High</Badge>;
      case 'medium': return <Badge variant="outline">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'reconnecting': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="h-5 w-5" />
              <span>Real-time Updates Manager</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${getStatusColor(metrics.status)}`}>
                  {metrics.status.toUpperCase()}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                disabled={isConnected}
              >
                Reconnect
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Live monitoring of bot results, admin commands, and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Real-time Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{metrics.connectedUsers}</span>
              </div>
              <p className="text-xs text-muted-foreground">Connected Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Radio className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{metrics.activeChannels}</span>
              </div>
              <p className="text-xs text-muted-foreground">Active Channels</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold">{metrics.messageQueue}</span>
              </div>
              <p className="text-xs text-muted-foreground">Queue Length</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-2xl font-bold">{metrics.latency}ms</span>
              </div>
              <p className="text-xs text-muted-foreground">Latency</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{metrics.totalMessages}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Messages</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Error Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Events Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Events Stream</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
              >
                Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllEvents}
              >
                Clear All
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time feed of all bot operations and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4 bg-muted/20">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for real-time events...</p>
                <p className="text-sm">Connected and monitoring all channels</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                    event.processed 
                      ? 'bg-muted/50 border-muted' 
                      : 'bg-background border-border shadow-sm'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {event.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {getPriorityBadge(event.priority)}
                        {event.processed && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Source: {event.source}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-2 rounded">
                      {JSON.stringify(event.data, null, 2).slice(0, 200)}
                      {JSON.stringify(event.data).length > 200 && '...'}
                    </div>
                    {!event.processed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-6 text-xs"
                        onClick={() => markEventAsProcessed(event.id)}
                      >
                        Mark as Processed
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={eventsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Connection Health Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection Status</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Heartbeat</span>
              <span className="text-sm text-muted-foreground">
                {metrics.lastHeartbeat.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Uptime</span>
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Network Quality</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.latency < 50 ? 'Excellent' :
                   metrics.latency < 100 ? 'Good' :
                   metrics.latency < 200 ? 'Fair' : 'Poor'}
                </span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, 100 - (metrics.latency / 5)))} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};