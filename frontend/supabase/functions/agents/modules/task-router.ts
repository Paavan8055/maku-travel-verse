import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseAgent, StructuredLogger, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory
) => {
  const agent = new BaseAgent(supabaseClient, 'task-router');
  
  try {
    StructuredLogger.info('Task router processing request', {
      userId,
      intent,
      agentId: 'task-router'
    });

    switch (intent) {
      case 'route_task':
        return await routeTask(agent, userId, params);
      
      case 'create_routing_rule':
        return await createRoutingRule(agent, userId, params);
      
      case 'analyze_routing_patterns':
        return await analyzeRoutingPatterns(agent, userId, params);
      
      case 'update_routing_priorities':
        return await updateRoutingPriorities(agent, userId, params);
      
      default:
        StructuredLogger.warn('Unknown intent for task router', { intent });
        return {
          success: false,
          error: 'Unknown intent for task router'
        };
    }
  } catch (error) {
    StructuredLogger.error('Task router error', { error: error.message, userId });
    return {
      success: false,
      error: error.message
    };
  }
};

async function routeTask(
  agent: BaseAgent,
  userId: string,
  params: { 
    userIntent: string; 
    taskParams: any; 
    userContext?: any;
    priority?: number;
  }
): Promise<any> {
  try {
    // Get matching routing rules
    const { data: routingRules, error: rulesError } = await agent['supabase']
      .from('intent_routing_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (rulesError) throw rulesError;

    // Find the best matching rule
    const matchedRule = findBestMatch(params.userIntent, routingRules || [], params.userContext);
    
    if (!matchedRule) {
      StructuredLogger.warn('No routing rule found for intent', { 
        intent: params.userIntent,
        userId 
      });
      
      // Create alert for unrouted task
      await agent.createAlert(
        userId,
        'unrouted_task',
        `No agent found for intent: ${params.userIntent}`,
        'medium',
        { intent: params.userIntent, params: params.taskParams }
      );
      
      return {
        success: false,
        error: 'No suitable agent found for this request',
        result: {
          intent: params.userIntent,
          suggestedAgent: 'general-assistant'
        }
      };
    }

    // Create task in agentic_tasks table
    const { data: newTask, error: taskError } = await agent['supabase']
      .from('agentic_tasks')
      .insert({
        user_id: userId,
        agent_id: matchedRule.agent_id,
        intent: params.userIntent,
        params: params.taskParams,
        status: 'pending',
        progress: 0
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Update routing rule success count
    await agent['supabase']
      .from('intent_routing_rules')
      .update({ 
        success_count: matchedRule.success_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchedRule.id);

    await agent.logActivity(userId, 'task_routed', {
      taskId: newTask.id,
      routedToAgent: matchedRule.agent_id,
      intent: params.userIntent,
      ruleId: matchedRule.id
    });

    StructuredLogger.info('Task successfully routed', {
      taskId: newTask.id,
      agentId: matchedRule.agent_id,
      intent: params.userIntent,
      userId
    });

    return {
      success: true,
      result: {
        taskId: newTask.id,
        routedToAgent: matchedRule.agent_id,
        priority: matchedRule.priority,
        estimatedCompletionTime: estimateCompletionTime(matchedRule.agent_id, params.userIntent),
        routingConfidence: calculateRoutingConfidence(matchedRule, params.userIntent)
      },
      memoryUpdates: [{
        key: 'routing_history',
        data: {
          taskId: newTask.id,
          intent: params.userIntent,
          routedTo: matchedRule.agent_id,
          timestamp: new Date().toISOString()
        }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to route task', { error: error.message, userId });
    throw error;
  }
}

async function createRoutingRule(
  agent: BaseAgent,
  userId: string,
  params: {
    intentPattern: string;
    agentId: string;
    priority: number;
    conditions?: any;
  }
): Promise<any> {
  try {
    const { data: newRule, error } = await agent['supabase']
      .from('intent_routing_rules')
      .insert({
        intent_pattern: params.intentPattern,
        agent_id: params.agentId,
        priority: params.priority,
        conditions: params.conditions || {},
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    await agent.logActivity(userId, 'routing_rule_created', {
      ruleId: newRule.id,
      intentPattern: params.intentPattern,
      agentId: params.agentId
    });

    return {
      success: true,
      result: { routingRule: newRule }
    };
  } catch (error) {
    StructuredLogger.error('Failed to create routing rule', { error: error.message, userId });
    throw error;
  }
}

async function analyzeRoutingPatterns(
  agent: BaseAgent,
  userId: string,
  params: { timeframe?: string }
): Promise<any> {
  try {
    // Get routing history from activity logs
    const { data: routingActivities, error } = await agent['supabase']
      .from('user_activity_logs')
      .select('*')
      .eq('activity_type', 'task_routed')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Get routing rules performance
    const { data: routingRules, error: rulesError } = await agent['supabase']
      .from('intent_routing_rules')
      .select('*')
      .order('success_count', { ascending: false });

    if (rulesError) throw rulesError;

    const analysis = {
      totalRoutedTasks: routingActivities?.length || 0,
      mostUsedAgents: analyzeMostUsedAgents(routingActivities || []),
      routingSuccessRate: calculateOverallSuccessRate(routingRules || []),
      patternTrends: analyzePatternTrends(routingActivities || []),
      underperformingRules: routingRules?.filter(rule => 
        rule.success_count > 0 && 
        (rule.failure_count / (rule.success_count + rule.failure_count)) > 0.2
      ) || []
    };

    return {
      success: true,
      result: { analysis }
    };
  } catch (error) {
    StructuredLogger.error('Failed to analyze routing patterns', { error: error.message, userId });
    throw error;
  }
}

async function updateRoutingPriorities(
  agent: BaseAgent,
  userId: string,
  params: { ruleId: string; newPriority: number }
): Promise<any> {
  try {
    const { data: updatedRule, error } = await agent['supabase']
      .from('intent_routing_rules')
      .update({ 
        priority: params.newPriority,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.ruleId)
      .select()
      .single();

    if (error) throw error;

    await agent.logActivity(userId, 'routing_priority_updated', {
      ruleId: params.ruleId,
      newPriority: params.newPriority
    });

    return {
      success: true,
      result: { updatedRule }
    };
  } catch (error) {
    StructuredLogger.error('Failed to update routing priorities', { error: error.message, userId });
    throw error;
  }
}

function findBestMatch(intent: string, rules: any[], userContext?: any): any {
  // Implement pattern matching logic
  for (const rule of rules) {
    if (matchesPattern(intent, rule.intent_pattern)) {
      // Check additional conditions if they exist
      if (rule.conditions && !evaluateConditions(rule.conditions, userContext)) {
        continue;
      }
      return rule;
    }
  }
  return null;
}

function matchesPattern(intent: string, pattern: string): boolean {
  // Simple pattern matching - could be enhanced with regex or fuzzy matching
  const intentLower = intent.toLowerCase();
  const patternLower = pattern.toLowerCase();
  
  // Exact match
  if (intentLower === patternLower) return true;
  
  // Contains match
  if (intentLower.includes(patternLower) || patternLower.includes(intentLower)) return true;
  
  // Keyword matching
  const intentWords = intentLower.split(/\s+/);
  const patternWords = patternLower.split(/\s+/);
  
  const matchingWords = intentWords.filter(word => 
    patternWords.some(patternWord => word.includes(patternWord) || patternWord.includes(word))
  );
  
  return matchingWords.length >= Math.min(2, patternWords.length);
}

function evaluateConditions(conditions: any, userContext?: any): boolean {
  if (!userContext) return true;
  
  // Implement condition evaluation logic
  // This is a simplified version - could be enhanced with more complex logic
  for (const [key, value] of Object.entries(conditions)) {
    if (userContext[key] !== value) {
      return false;
    }
  }
  
  return true;
}

function estimateCompletionTime(agentId: string, intent: string): number {
  // Estimated completion time in minutes based on agent and intent type
  const timeEstimates: Record<string, number> = {
    'trip-planner': 15,
    'booking-specialist': 10,
    'customer-service': 5,
    'travel-advisor': 20,
    'finance-processor': 8,
    'onboarding-coordinator': 30,
    'documentation-curator': 25,
    'compliance-trainer': 45,
    'default': 10
  };
  
  return timeEstimates[agentId] || timeEstimates['default'];
}

function calculateRoutingConfidence(rule: any, intent: string): number {
  // Calculate confidence score based on rule performance and pattern match quality
  const successRate = rule.success_count / Math.max(1, rule.success_count + rule.failure_count);
  const patternMatchQuality = calculatePatternMatchQuality(intent, rule.intent_pattern);
  
  return Math.round((successRate * 0.7 + patternMatchQuality * 0.3) * 100);
}

function calculatePatternMatchQuality(intent: string, pattern: string): number {
  const intentWords = intent.toLowerCase().split(/\s+/);
  const patternWords = pattern.toLowerCase().split(/\s+/);
  
  const matchingWords = intentWords.filter(word => 
    patternWords.some(patternWord => word.includes(patternWord))
  );
  
  return matchingWords.length / Math.max(intentWords.length, patternWords.length);
}

function analyzeMostUsedAgents(activities: any[]): any[] {
  const agentCounts: Record<string, number> = {};
  
  activities.forEach(activity => {
    const agentId = activity.item_data?.routedToAgent;
    if (agentId) {
      agentCounts[agentId] = (agentCounts[agentId] || 0) + 1;
    }
  });
  
  return Object.entries(agentCounts)
    .map(([agentId, count]) => ({ agentId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateOverallSuccessRate(rules: any[]): number {
  const totalSuccess = rules.reduce((sum, rule) => sum + rule.success_count, 0);
  const totalFailure = rules.reduce((sum, rule) => sum + rule.failure_count, 0);
  
  if (totalSuccess + totalFailure === 0) return 0;
  
  return Math.round((totalSuccess / (totalSuccess + totalFailure)) * 100);
}

function analyzePatternTrends(activities: any[]): any {
  // Analyze trends in routing patterns over time
  const daily: Record<string, number> = {};
  const intentCounts: Record<string, number> = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.created_at).toISOString().split('T')[0];
    daily[date] = (daily[date] || 0) + 1;
    
    const intent = activity.item_data?.intent;
    if (intent) {
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    }
  });
  
  return {
    dailyVolume: daily,
    topIntents: Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  };
}