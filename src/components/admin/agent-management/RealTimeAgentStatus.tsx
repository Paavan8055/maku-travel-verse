import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface AgentStatusData {
  agent_id: string;
  display_name: string;
  status: string;
  health_status: string;
  active_tasks: number;
  completed_today: number;
  success_rate: number;
  avg_response_time: number;
  last_activity: string;
}

interface RealTimeAgentStatusProps {
  agentId?: string;
}

export const RealTimeAgentStatus: React.FC<RealTimeAgentStatusProps> = ({ agentId }) => {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentStatuses = async () => {
      try {
        setLoading(true);
        
        // Fetch agent data
        let agentQuery = supabase
          .from('agent_management')
          .select('*');
        
        if (agentId) {
          agentQuery = agentQuery.eq('agent_id', agentId);
        }

        const { data: agents, error: agentError } = await agentQuery;
        if (agentError) throw agentError;

        // Fetch task data for each agent
        const statusPromises = (agents || []).map(async (agent) => {
          // Get active tasks
          const { data: activeTasks } = await supabase
            .from('agentic_tasks')
            .select('id')
            .eq('agent_id', agent.agent_id)
            .in('status', ['pending', 'running']);

          // Get completed tasks today
          const today = new Date().toISOString().split('T')[0];
          const { data: completedTasks } = await supabase
            .from('agentic_tasks')
            .select('id')
            .eq('agent_id', agent.agent_id)
            .eq('status', 'completed')
            .gte('updated_at', today);

          // Get performance metrics
          const { data: metrics } = await supabase
            .from('agent_performance_metrics')
            .select('*')
            .eq('agent_id', agent.agent_id)
            .order('metric_date', { ascending: false })
            .limit(7);

          // Get last activity
          const { data: lastTask } = await supabase
            .from('agentic_tasks')
            .select('updated_at')
            .eq('agent_id', agent.agent_id)
            .order('updated_at', { ascending: false })
            .limit(1);

          const weekMetrics = metrics || [];
          const totalTasks = weekMetrics.reduce((sum, m) => sum + m.total_tasks, 0);
          const successfulTasks = weekMetrics.reduce((sum, m) => sum + m.successful_tasks, 0);
          const avgResponseTime = weekMetrics.length > 0 
            ? weekMetrics.reduce((sum, m) => sum + m.average_response_time_ms, 0) / weekMetrics.length
            : 0;

          return {
            agent_id: agent.agent_id,
            display_name: agent.display_name,
            status: agent.status,
            health_status: agent.health_status,
            active_tasks: activeTasks?.length || 0,
            completed_today: completedTasks?.length || 0,
            success_rate: totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0,
            avg_response_time: Math.round(avgResponseTime),
            last_activity: lastTask?.[0]?.updated_at || agent.updated_at,
          };
        });

        const statuses = await Promise.all(statusPromises);
        setAgentStatuses(statuses);
      } catch (error) {
        console.error('Error fetching agent statuses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentStatuses();

    // Set up real-time subscription
    const channel = supabase
      .channel('agent-status-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agentic_tasks'
        },
        () => {
          fetchAgentStatuses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_management'
        },
        () => {
          fetchAgentStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Agent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Real-time Agent Status
          <Badge variant="secondary" className="ml-auto">
            {agentStatuses.length} agents
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agentStatuses.map((agent) => (
            <Card key={agent.agent_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                    <div>
                      <h3 className="font-medium">{agent.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.agent_id}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={agent.health_status === 'healthy' ? 'default' : 'destructive'}
                    className={getHealthColor(agent.health_status)}
                  >
                    {agent.health_status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-muted-foreground">Active Tasks</p>
                      <p className="font-medium">{agent.active_tasks}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-muted-foreground">Completed Today</p>
                      <p className="font-medium">{agent.completed_today}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-medium">{agent.success_rate.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-muted-foreground">Avg Response</p>
                      <p className="font-medium">{agent.avg_response_time}ms</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Performance</span>
                    <span>{agent.success_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={agent.success_rate} className="h-2" />
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  Last activity: {new Date(agent.last_activity).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};