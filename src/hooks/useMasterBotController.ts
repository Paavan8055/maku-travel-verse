import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BotResult {
  id: string;
  bot_id: string;
  bot_type: string;
  result_type: string;
  result_data: any;
  confidence_score?: number;
  actionability_rating?: string;
  target_dashboard: string;
  created_at: string;
  metadata?: any;
}

export interface AdminCommand {
  id: string;
  command_text: string;
  command_type: string;
  execution_status: string;
  response_data?: any;
  created_at: string;
  completed_at?: string;
}

export interface DashboardContext {
  dashboard_type: string;
  context_key: string;
  context_data: any;
  relevance_score?: number;
}

export const useMasterBotController = (dashboardType: 'user' | 'partner' | 'admin') => {
  const [botResults, setBotResults] = useState<BotResult[]>([]);
  const [adminCommands, setAdminCommands] = useState<AdminCommand[]>([]);
  const [dashboardContext, setDashboardContext] = useState<DashboardContext[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const { toast } = useToast();

  // Fetch bot results based on dashboard type
  const fetchBotResults = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bot_result_aggregation')
        .select('*')
        .or(`target_dashboard.eq.${dashboardType},target_dashboard.eq.all`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBotResults(data || []);
    } catch (error) {
      console.error('Error fetching bot results:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bot results',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dashboardType, toast]);

  // Fetch admin commands (admin dashboard only)
  const fetchAdminCommands = useCallback(async () => {
    if (dashboardType !== 'admin') return;

    try {
      const { data, error } = await supabase
        .from('admin_bot_commands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAdminCommands(data || []);
    } catch (error) {
      console.error('Error fetching admin commands:', error);
    }
  }, [dashboardType]);

  // Fetch dashboard context
  const fetchDashboardContext = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_context_store')
        .select('*')
        .eq('dashboard_type', dashboardType)
        .order('last_accessed', { ascending: false })
        .limit(10);

      if (error) throw error;
      setDashboardContext(data || []);
    } catch (error) {
      console.error('Error fetching dashboard context:', error);
    }
  }, [dashboardType]);

  // Execute admin command
  const executeAdminCommand = useCallback(async (
    commandText: string,
    commandType: 'query' | 'control' | 'analysis' | 'optimization',
    targetBots: string[] = [],
    parameters: any = {}
  ) => {
    if (dashboardType !== 'admin') {
      toast({
        title: 'Unauthorized',
        description: 'Only admins can execute commands',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setIsExecutingCommand(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('admin_bot_commands')
        .insert({
          admin_user_id: userData.user.id,
          command_text: commandText,
          command_type: commandType,
          target_bots: targetBots,
          command_parameters: parameters,
        })
        .select()
        .single();

      if (error) throw error;

      // Call the master bot controller edge function
      const { data: response, error: functionError } = await supabase.functions.invoke(
        'master-bot-controller',
        {
          body: {
            command_id: data.id,
            command_text: commandText,
            command_type: commandType,
            target_bots: targetBots,
            parameters: parameters,
          },
        }
      );

      if (functionError) throw functionError;

      toast({
        title: 'Command Executed',
        description: 'Bot command has been processed',
      });

      // Refresh commands and results
      await Promise.all([fetchAdminCommands(), fetchBotResults()]);
      
      return response;
    } catch (error) {
      console.error('Error executing admin command:', error);
      toast({
        title: 'Command Failed',
        description: 'Failed to execute bot command',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsExecutingCommand(false);
    }
  }, [dashboardType, toast, fetchAdminCommands, fetchBotResults]);

  // Update dashboard context
  const updateDashboardContext = useCallback(async (
    contextKey: string,
    contextData: any,
    relevanceScore?: number
  ) => {
    try {
      const { error } = await supabase
        .from('dashboard_context_store')
        .upsert({
          dashboard_type: dashboardType,
          context_key: contextKey,
          context_data: contextData,
          relevance_score: relevanceScore,
          last_accessed: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchDashboardContext();
    } catch (error) {
      console.error('Error updating dashboard context:', error);
    }
  }, [dashboardType, fetchDashboardContext]);

  // Get results by type
  const getResultsByType = useCallback((resultType: string) => {
    return botResults.filter(result => result.result_type === resultType);
  }, [botResults]);

  // Get high-priority results
  const getHighPriorityResults = useCallback(() => {
    return botResults.filter(result => result.actionability_rating === 'critical' || result.actionability_rating === 'high');
  }, [botResults]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('master-bot-controller')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bot_result_aggregation',
          filter: `target_dashboard=eq.${dashboardType}`,
        },
        () => {
          fetchBotResults();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_bot_commands',
        },
        () => {
          if (dashboardType === 'admin') {
            fetchAdminCommands();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dashboardType, fetchBotResults, fetchAdminCommands]);

  // Initial data fetch
  useEffect(() => {
    fetchBotResults();
    if (dashboardType === 'admin') {
      fetchAdminCommands();
    }
    fetchDashboardContext();
  }, [fetchBotResults, fetchAdminCommands, fetchDashboardContext, dashboardType]);

  return {
    botResults,
    adminCommands,
    dashboardContext,
    isLoading,
    isExecutingCommand,
    executeAdminCommand,
    updateDashboardContext,
    getResultsByType,
    getHighPriorityResults,
    refreshData: () => {
      fetchBotResults();
      if (dashboardType === 'admin') {
        fetchAdminCommands();
      }
      fetchDashboardContext();
    },
  };
};