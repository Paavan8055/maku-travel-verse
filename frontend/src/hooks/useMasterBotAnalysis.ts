import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BotResult {
  id: string;
  bot_id: string;
  bot_type: string;
  result_type: string;
  result_data: any;
  confidence_score: number;
  actionability_rating: string;
  target_dashboard: string;
  correlation_id?: string;
  created_at: string;
}

interface MasterBotAnalysis {
  summary: string;
  recommendations: string[];
  actionItems: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  metrics?: any;
  rawBotResult?: BotResult;
}

export const useMasterBotAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<MasterBotAnalysis | null>(null);
  const { toast } = useToast();

  const requestAnalysis = useCallback(async (
    analysisType: 'provider_diagnostics' | 'system_health' | 'performance' | 'custom',
    data: any,
    customPrompt?: string
  ): Promise<MasterBotAnalysis | null> => {
    try {
      setIsAnalyzing(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      // Create analysis command
      const commandPrompt = customPrompt || generateAnalysisPrompt(analysisType, data);
      
      const analysisCommand = {
        admin_user_id: userData.user.id,
        command_text: commandPrompt,
        command_type: 'analysis' as const,
        target_bots: getTargetBots(analysisType),
        command_parameters: {
          analysis_type: analysisType,
          data: data,
          timestamp: new Date().toISOString(),
          priority: determinePriority(data)
        }
      };

      // Insert command into admin_bot_commands
      const { data: commandData, error: commandError } = await supabase
        .from('admin_bot_commands')
        .insert(analysisCommand)
        .select()
        .single();

      if (commandError) throw commandError;

      // Invoke Master Bot Controller
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

      if (invokeError) throw invokeError;

      // Wait briefly and fetch AI analysis result
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: botResults, error: resultsError } = await supabase
        .from('bot_result_aggregation')
        .select('*')
        .eq('correlation_id', commandData.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (resultsError || !botResults?.length) {
        throw new Error('No AI analysis results available');
      }

      const botResult = botResults[0];
      const analysis = processAIResult(botResult);
      
      setLatestAnalysis(analysis);
      
      toast({
        title: "AI Analysis Complete",
        description: `Master Bot provided ${analysis.recommendations.length} recommendations`,
        variant: "default"
      });

      return analysis;

    } catch (error: any) {
      console.error('Master Bot analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || 'Failed to get AI analysis',
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const fetchLatestBotResults = useCallback(async (
    dashboardType: 'user' | 'partner' | 'admin' = 'admin',
    limit: number = 20
  ): Promise<BotResult[]> => {
    try {
      const { data, error } = await supabase
        .from('bot_result_aggregation')
        .select('*')
        .or(`target_dashboard.eq.${dashboardType},target_dashboard.eq.all`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bot results:', error);
      return [];
    }
  }, []);

  const subscribeToRealTimeResults = useCallback((
    dashboardType: 'user' | 'partner' | 'admin',
    onNewResult: (result: BotResult) => void
  ) => {
    const channel = supabase
      .channel(`bot-results-${dashboardType}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bot_result_aggregation',
          filter: `target_dashboard=eq.${dashboardType}`,
        },
        (payload) => {
          onNewResult(payload.new as BotResult);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    isAnalyzing,
    latestAnalysis,
    requestAnalysis,
    fetchLatestBotResults,
    subscribeToRealTimeResults,
    setLatestAnalysis
  };
};

// Helper functions
function generateAnalysisPrompt(type: string, data: any): string {
  switch (type) {
    case 'provider_diagnostics':
      return `Analyze provider test results: ${data.length || 0} tests with detailed performance metrics. Provide comprehensive health assessment, identify bottlenecks, and generate actionable optimization recommendations.`;
    
    case 'system_health':
      return `Evaluate overall system health across all components. Review performance metrics, error rates, and user experience indicators. Provide strategic recommendations for system optimization.`;
    
    case 'performance':
      return `Conduct detailed performance analysis of booking flow, provider response times, and user journey optimization. Identify performance bottlenecks and recommend improvements.`;
    
    default:
      return `Analyze system data and provide comprehensive insights with actionable recommendations.`;
  }
}

function getTargetBots(analysisType: string): string[] {
  switch (analysisType) {
    case 'provider_diagnostics':
      return ['provider-health-analyzer', 'system-optimizer'];
    case 'system_health':
      return ['system-monitor', 'performance-analyzer'];
    case 'performance':
      return ['performance-optimizer', 'user-experience-analyzer'];
    default:
      return ['general-analyzer'];
  }
}

function determinePriority(data: any): 'low' | 'medium' | 'high' | 'critical' {
  if (Array.isArray(data)) {
    const failureCount = data.filter((item: any) => !item.success).length;
    const failureRate = failureCount / data.length;
    
    if (failureRate >= 1) return 'critical';
    if (failureRate > 0.5) return 'high';
    if (failureRate > 0.2) return 'medium';
  }
  return 'low';
}

function processAIResult(botResult: BotResult): MasterBotAnalysis {
  const resultData = botResult.result_data;
  
  return {
    summary: resultData.summary || 'AI analysis completed',
    recommendations: resultData.recommendations || resultData.optimization_suggestions || [],
    actionItems: resultData.action_items || resultData.actionItems || [],
    severity: determineSeverityFromResult(resultData, botResult.confidence_score),
    metrics: resultData.metrics || {},
    rawBotResult: botResult
  };
}

function determineSeverityFromResult(data: any, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
  if (data.severity) return data.severity;
  
  // Use confidence score and other indicators
  if (confidence < 0.5) return 'low';
  if (data.metrics?.failure_rate > 0.8) return 'critical';
  if (data.metrics?.failure_rate > 0.5) return 'high';
  if (data.metrics?.failure_rate > 0.2) return 'medium';
  
  return 'low';
}