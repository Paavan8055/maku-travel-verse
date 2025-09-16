import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RealtimeEvent {
  id: string;
  type: 'bot_result' | 'admin_command' | 'dashboard_update' | 'system_alert' | 'task_update';
  source: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  processed: boolean;
}

export interface ConnectionMetrics {
  status: 'connected' | 'disconnected' | 'reconnecting';
  connectedUsers: number;
  activeChannels: number;
  messageQueue: number;
  lastHeartbeat: Date;
  latency: number;
  totalMessages: number;
  errorRate: number;
}

export const useRealTimeData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    status: 'disconnected',
    connectedUsers: 0,
    activeChannels: 0,
    messageQueue: 0,
    lastHeartbeat: new Date(),
    latency: 0,
    totalMessages: 0,
    errorRate: 0
  });
  const channelRef = useRef<any>(null);
  const { toast } = useToast();

  // Handle real-time events from Supabase
  const handleRealtimeEvent = (event: RealtimeEvent) => {
    setEvents(prev => {
      const newEvents = [event, ...prev].slice(0, 100); // Keep last 100 events
      return newEvents;
    });

    // Show toast for critical events
    if (event.priority === 'critical') {
      toast({
        title: 'Critical Alert',
        description: `New ${event.type} received`,
        variant: 'destructive'
      });
    }

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      totalMessages: prev.totalMessages + 1,
      messageQueue: prev.messageQueue + (event.processed ? 0 : 1)
    }));
  };

  // Initialize real-time connections
  useEffect(() => {
    const initializeRealtimeConnection = async () => {
      try {
        // Create the master realtime channel
        const masterChannel = supabase
          .channel('master-bot-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'gpt_bot_registry'
            },
            (payload) => {
              handleRealtimeEvent({
                id: `bot_registry_${Date.now()}`,
                type: 'bot_result',
                source: 'gpt_bot_registry',
                data: payload,
                timestamp: new Date().toISOString(),
                priority: 'medium',
                processed: false
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'agentic_tasks'
            },
            (payload) => {
              handleRealtimeEvent({
                id: `task_${Date.now()}`,
                type: 'task_update',
                source: 'agentic_tasks',
                data: payload,
                timestamp: new Date().toISOString(),
                priority: 'high',
                processed: false
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'agent_performance_metrics'
            },
            (payload) => {
              handleRealtimeEvent({
                id: `performance_${Date.now()}`,
                type: 'dashboard_update',
                source: 'agent_performance_metrics',
                data: payload,
                timestamp: new Date().toISOString(),
                priority: 'medium',
                processed: false
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'admin_bot_commands'
            },
            (payload) => {
              handleRealtimeEvent({
                id: `admin_command_${Date.now()}`,
                type: 'admin_command',
                source: 'admin_bot_commands',
                data: payload,
                timestamp: new Date().toISOString(),
                priority: 'high',
                processed: false
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'agent_alerts'
            },
            (payload) => {
              handleRealtimeEvent({
                id: `alert_${Date.now()}`,
                type: 'system_alert',
                source: 'agent_alerts',
                data: payload,
                timestamp: new Date().toISOString(),
                priority: 'critical',
                processed: false
              });
            }
          )
          .on('presence', { event: 'sync' }, () => {
            const presenceState = masterChannel.presenceState();
            setMetrics(prev => ({
              ...prev,
              connectedUsers: Object.keys(presenceState).length
            }));
          })
          .on('broadcast', { event: 'heartbeat' }, (payload) => {
            setMetrics(prev => ({
              ...prev,
              lastHeartbeat: new Date(),
              latency: Date.now() - payload.timestamp
            }));
          });

        channelRef.current = masterChannel;

        // Subscribe to the channel
        const subscribeResult = await masterChannel.subscribe((status) => {
          console.log('Realtime subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          setMetrics(prev => ({
            ...prev,
            status: status === 'SUBSCRIBED' ? 'connected' : 
                   status === 'CHANNEL_ERROR' ? 'disconnected' : 'reconnecting'
          }));

          if (status === 'SUBSCRIBED') {
            toast({
              title: 'Real-time Connected',
              description: 'Live updates are now active'
            });

            // Send presence
            masterChannel.track({ 
              user: 'admin',
              online_at: new Date().toISOString() 
            });

            // Update metrics
            setMetrics(prev => ({
              ...prev,
              activeChannels: 1
            }));
          }
        });

      } catch (error) {
        console.error('Failed to initialize realtime connection:', error);
        toast({
          title: 'Connection Failed',
          description: 'Failed to establish real-time connection',
          variant: 'destructive'
        });
      }
    };

    initializeRealtimeConnection();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [toast]);

  // Update metrics when events change
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      totalMessages: events.length,
      messageQueue: events.filter(e => !e.processed).length
    }));
  }, [events]);

  const markEventAsProcessed = (eventId: string) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === eventId ? { ...event, processed: true } : event
      )
    );
  };

  const clearAllEvents = () => {
    setEvents([]);
  };

  const reconnect = async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
      await channelRef.current.subscribe();
    }
  };

  return {
    isConnected,
    events,
    metrics,
    markEventAsProcessed,
    clearAllEvents,
    reconnect
  };
};