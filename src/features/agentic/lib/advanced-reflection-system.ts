import { supabase } from '@/integrations/supabase/client';

export interface ReflectionLevel {
  level: 'task' | 'strategy' | 'meta_strategy';
  description: string;
  focus_areas: string[];
}

export interface ReflectionInsight {
  id: string;
  level: ReflectionLevel['level'];
  insight_type: 'success_factor' | 'failure_point' | 'improvement_opportunity' | 'pattern_recognition';
  content: string;
  confidence: number;
  impact_score: number;
  actionable_recommendations: string[];
  evidence: any[];
  created_at: string;
}

export interface CrossAgentReflection {
  participating_agents: string[];
  shared_insights: ReflectionInsight[];
  collaborative_improvements: string[];
  consensus_level: number;
  next_steps: string[];
}

export interface TemporalPattern {
  pattern_id: string;
  pattern_type: 'recurring_success' | 'recurring_failure' | 'seasonal_trend' | 'learning_curve';
  description: string;
  frequency: number;
  trend_direction: 'improving' | 'declining' | 'stable' | 'cyclical';
  confidence: number;
  time_span_days: number;
}

export class AdvancedReflectionSystem {
  private reflectionHistory: Map<string, ReflectionInsight[]> = new Map();
  private temporalPatterns: TemporalPattern[] = [];
  private crossAgentInsights: CrossAgentReflection[] = [];

  constructor() {
    this.initializeReflectionLevels();
  }

  private reflectionLevels: ReflectionLevel[] = [
    {
      level: 'task',
      description: 'Reflection on specific task execution and outcomes',
      focus_areas: ['execution_quality', 'resource_usage', 'time_efficiency', 'goal_achievement']
    },
    {
      level: 'strategy',
      description: 'Reflection on strategy selection and effectiveness',
      focus_areas: ['strategy_appropriateness', 'adaptation_quality', 'decision_accuracy', 'planning_effectiveness']
    },
    {
      level: 'meta_strategy',
      description: 'Reflection on how we reflect and improve our reflection processes',
      focus_areas: ['reflection_quality', 'insight_generation', 'learning_rate', 'pattern_recognition']
    }
  ];

  private initializeReflectionLevels(): void {
    // Pre-populate with system insights
    this.reflectionLevels.forEach(level => {
      if (!this.reflectionHistory.has(level.level)) {
        this.reflectionHistory.set(level.level, []);
      }
    });
  }

  async performMultiLevelReflection(
    taskContext: any,
    executionResults: any,
    agentId: string = 'default'
  ): Promise<Map<string, ReflectionInsight[]>> {
    const allInsights = new Map<string, ReflectionInsight[]>();

    for (const level of this.reflectionLevels) {
      const insights = await this.generateReflectionInsights(
        level,
        taskContext,
        executionResults,
        agentId
      );
      
      allInsights.set(level.level, insights);
      
      // Store in history
      const existingInsights = this.reflectionHistory.get(level.level) || [];
      this.reflectionHistory.set(level.level, [...existingInsights, ...insights]);
    }

    // Generate cross-level connections
    await this.connectReflectionLevels(allInsights, agentId);
    
    // Update temporal patterns
    await this.updateTemporalPatterns(allInsights, agentId);

    await this.logReflectionSession(allInsights, agentId, taskContext);

    return allInsights;
  }

  private async generateReflectionInsights(
    level: ReflectionLevel,
    taskContext: any,
    executionResults: any,
    agentId: string
  ): Promise<ReflectionInsight[]> {
    const insights: ReflectionInsight[] = [];

    for (const focusArea of level.focus_areas) {
      const insight = await this.analyzeSpecificArea(
        level.level,
        focusArea,
        taskContext,
        executionResults,
        agentId
      );
      
      if (insight) {
        insights.push(insight);
      }
    }

    return insights;
  }

  private async analyzeSpecificArea(
    level: ReflectionLevel['level'],
    focusArea: string,
    taskContext: any,
    executionResults: any,
    agentId: string
  ): Promise<ReflectionInsight | null> {
    const analysis = this.getAreaSpecificAnalysis(focusArea, taskContext, executionResults);
    
    if (analysis.significance < 0.3) {
      return null; // Not significant enough for reflection
    }

    const insight: ReflectionInsight = {
      id: crypto.randomUUID(),
      level,
      insight_type: analysis.type,
      content: analysis.content,
      confidence: analysis.confidence,
      impact_score: analysis.impact,
      actionable_recommendations: analysis.recommendations,
      evidence: analysis.evidence,
      created_at: new Date().toISOString()
    };

    return insight;
  }

  private getAreaSpecificAnalysis(
    focusArea: string,
    taskContext: any,
    executionResults: any
  ): any {
    switch (focusArea) {
      case 'execution_quality':
        return this.analyzeExecutionQuality(taskContext, executionResults);
      case 'resource_usage':
        return this.analyzeResourceUsage(taskContext, executionResults);
      case 'time_efficiency':
        return this.analyzeTimeEfficiency(taskContext, executionResults);
      case 'goal_achievement':
        return this.analyzeGoalAchievement(taskContext, executionResults);
      case 'strategy_appropriateness':
        return this.analyzeStrategyAppropriatenss(taskContext, executionResults);
      case 'adaptation_quality':
        return this.analyzeAdaptationQuality(taskContext, executionResults);
      case 'reflection_quality':
        return this.analyzeReflectionQuality(taskContext, executionResults);
      default:
        return { significance: 0, content: 'No analysis available' };
    }
  }

  private analyzeExecutionQuality(taskContext: any, executionResults: any): any {
    const successRate = executionResults.success_rate || 0;
    const errorRate = executionResults.error_rate || 0;
    
    let type: ReflectionInsight['insight_type'] = 'pattern_recognition';
    let content = '';
    let recommendations: string[] = [];
    
    if (successRate > 0.9) {
      type = 'success_factor';
      content = `Excellent execution quality with ${(successRate * 100).toFixed(1)}% success rate`;
      recommendations = ['Maintain current approach', 'Document best practices'];
    } else if (successRate < 0.7) {
      type = 'failure_point';
      content = `Low execution quality with ${(successRate * 100).toFixed(1)}% success rate`;
      recommendations = ['Review error patterns', 'Enhance validation steps', 'Add fallback mechanisms'];
    } else {
      type = 'improvement_opportunity';
      content = `Moderate execution quality with room for improvement`;
      recommendations = ['Analyze successful cases', 'Optimize error handling'];
    }

    return {
      significance: Math.abs(successRate - 0.8) + 0.3,
      type,
      content,
      confidence: 0.85,
      impact: successRate < 0.7 ? 0.9 : 0.6,
      recommendations,
      evidence: [{ success_rate: successRate, error_rate: errorRate }]
    };
  }

  private analyzeResourceUsage(taskContext: any, executionResults: any): any {
    const resourceEfficiency = executionResults.resource_efficiency || 0.7;
    const resourceType = taskContext.primary_resource || 'computational';
    
    return {
      significance: Math.abs(resourceEfficiency - 0.8) + 0.2,
      type: resourceEfficiency > 0.8 ? 'success_factor' : 'improvement_opportunity',
      content: `${resourceType} resource efficiency: ${(resourceEfficiency * 100).toFixed(1)}%`,
      confidence: 0.75,
      impact: 0.7,
      recommendations: resourceEfficiency < 0.7 ? 
        ['Optimize resource allocation', 'Consider alternative approaches'] :
        ['Maintain efficient patterns', 'Share optimization strategies'],
      evidence: [{ resource_efficiency: resourceEfficiency, resource_type: resourceType }]
    };
  }

  private analyzeTimeEfficiency(taskContext: any, executionResults: any): any {
    const expectedDuration = taskContext.expected_duration || 60;
    const actualDuration = executionResults.actual_duration || 90;
    const efficiency = expectedDuration / actualDuration;
    
    return {
      significance: Math.abs(efficiency - 1.0) + 0.2,
      type: efficiency > 1.1 ? 'success_factor' : 'improvement_opportunity',
      content: `Time efficiency: ${(efficiency * 100).toFixed(1)}% (${actualDuration}s vs expected ${expectedDuration}s)`,
      confidence: 0.9,
      impact: efficiency < 0.7 ? 0.8 : 0.5,
      recommendations: efficiency < 0.8 ? 
        ['Identify bottlenecks', 'Optimize critical paths', 'Consider parallel execution'] :
        ['Document time-saving techniques', 'Apply to similar tasks'],
      evidence: [{ expected: expectedDuration, actual: actualDuration, efficiency }]
    };
  }

  private analyzeGoalAchievement(taskContext: any, executionResults: any): any {
    const goalsMet = executionResults.goals_achieved || [];
    const totalGoals = taskContext.objectives?.length || 1;
    const achievementRate = goalsMet.length / totalGoals;
    
    return {
      significance: Math.abs(achievementRate - 1.0) + 0.4,
      type: achievementRate > 0.9 ? 'success_factor' : 'failure_point',
      content: `Goal achievement: ${goalsMet.length}/${totalGoals} objectives met (${(achievementRate * 100).toFixed(1)}%)`,
      confidence: 0.95,
      impact: 1.0,
      recommendations: achievementRate < 0.8 ? 
        ['Review unmet objectives', 'Adjust goal prioritization', 'Improve planning accuracy'] :
        ['Replicate successful patterns', 'Set stretch goals'],
      evidence: [{ goals_met: goalsMet, total_goals: totalGoals, rate: achievementRate }]
    };
  }

  private analyzeStrategyAppropriatenss(taskContext: any, executionResults: any): any {
    const strategyUsed = executionResults.strategy_used || 'unknown';
    const contextComplexity = taskContext.complexity || 5;
    const outcome = executionResults.overall_success || 0.7;
    
    return {
      significance: 0.6,
      type: outcome > 0.8 ? 'success_factor' : 'improvement_opportunity',
      content: `Strategy '${strategyUsed}' for complexity level ${contextComplexity} yielded ${(outcome * 100).toFixed(1)}% success`,
      confidence: 0.7,
      impact: 0.8,
      recommendations: outcome < 0.7 ? 
        ['Consider alternative strategies', 'Adjust for context complexity'] :
        ['Validate strategy selection criteria', 'Apply to similar contexts'],
      evidence: [{ strategy: strategyUsed, complexity: contextComplexity, outcome }]
    };
  }

  private analyzeAdaptationQuality(taskContext: any, executionResults: any): any {
    const adaptationsMade = executionResults.adaptations_made || 0;
    const adaptationSuccess = executionResults.adaptation_success_rate || 0.7;
    
    return {
      significance: 0.5,
      type: adaptationSuccess > 0.8 ? 'success_factor' : 'improvement_opportunity',
      content: `Made ${adaptationsMade} adaptations with ${(adaptationSuccess * 100).toFixed(1)}% success rate`,
      confidence: 0.8,
      impact: 0.7,
      recommendations: adaptationSuccess < 0.6 ? 
        ['Improve adaptation triggers', 'Enhance decision criteria'] :
        ['Document successful adaptations', 'Share adaptation patterns'],
      evidence: [{ adaptations: adaptationsMade, success_rate: adaptationSuccess }]
    };
  }

  private analyzeReflectionQuality(taskContext: any, executionResults: any): any {
    const previousInsights = this.reflectionHistory.get('meta_strategy')?.length || 0;
    const insightUtilization = executionResults.insights_applied || 0;
    
    return {
      significance: 0.4,
      type: 'pattern_recognition',
      content: `Reflection system has generated ${previousInsights} meta-insights with ${insightUtilization} applied`,
      confidence: 0.6,
      impact: 0.5,
      recommendations: [
        'Increase insight application rate',
        'Improve insight quality metrics',
        'Enhance pattern recognition'
      ],
      evidence: [{ total_insights: previousInsights, applied: insightUtilization }]
    };
  }

  private async connectReflectionLevels(
    allInsights: Map<string, ReflectionInsight[]>,
    agentId: string
  ): Promise<void> {
    // Find connections between task-level and strategy-level insights
    const taskInsights = allInsights.get('task') || [];
    const strategyInsights = allInsights.get('strategy') || [];
    const metaInsights = allInsights.get('meta_strategy') || [];

    // Create cross-level patterns
    for (const taskInsight of taskInsights) {
      for (const strategyInsight of strategyInsights) {
        if (this.areInsightsRelated(taskInsight, strategyInsight)) {
          await this.createCrossLevelConnection(taskInsight, strategyInsight, agentId);
        }
      }
    }
  }

  private areInsightsRelated(insight1: ReflectionInsight, insight2: ReflectionInsight): boolean {
    // Simple similarity check based on content overlap
    const words1 = insight1.content.toLowerCase().split(' ');
    const words2 = insight2.content.toLowerCase().split(' ');
    const overlap = words1.filter(word => words2.includes(word)).length;
    
    return overlap >= 2 || insight1.insight_type === insight2.insight_type;
  }

  private async createCrossLevelConnection(
    insight1: ReflectionInsight,
    insight2: ReflectionInsight,
    agentId: string
  ): Promise<void> {
    const connection = {
      id: crypto.randomUUID(),
      insight1_id: insight1.id,
      insight2_id: insight2.id,
      connection_strength: 0.7,
      synthesis: `Connection between ${insight1.level} and ${insight2.level} insights`,
      created_at: new Date().toISOString()
    };

    await this.logInsightConnection(connection, agentId);
  }

  async performCrossAgentReflection(
    participatingAgents: string[],
    sharedContext: any
  ): Promise<CrossAgentReflection> {
    const agentInsights = await this.gatherInsightsFromAgents(participatingAgents);
    const sharedInsights = this.findSharedPatterns(agentInsights);
    const collaborativeImprovements = await this.generateCollaborativeImprovements(sharedInsights);

    const reflection: CrossAgentReflection = {
      participating_agents: participatingAgents,
      shared_insights: sharedInsights,
      collaborative_improvements: collaborativeImprovements,
      consensus_level: this.calculateConsensusLevel(agentInsights),
      next_steps: await this.generateNextSteps(sharedInsights, collaborativeImprovements)
    };

    this.crossAgentInsights.push(reflection);
    await this.logCrossAgentReflection(reflection);

    return reflection;
  }

  private async gatherInsightsFromAgents(agentIds: string[]): Promise<Map<string, ReflectionInsight[]>> {
    const agentInsights = new Map<string, ReflectionInsight[]>();
    
    for (const agentId of agentIds) {
      // In a real implementation, this would fetch from each agent's reflection history
      const insights = Array.from(this.reflectionHistory.values()).flat()
        .filter(insight => insight.confidence > 0.6);
      agentInsights.set(agentId, insights);
    }
    
    return agentInsights;
  }

  private findSharedPatterns(agentInsights: Map<string, ReflectionInsight[]>): ReflectionInsight[] {
    const allInsights = Array.from(agentInsights.values()).flat();
    const sharedPatterns: ReflectionInsight[] = [];
    
    // Group insights by type and find consensus
    const insightsByType = new Map<string, ReflectionInsight[]>();
    allInsights.forEach(insight => {
      const key = `${insight.insight_type}_${insight.level}`;
      if (!insightsByType.has(key)) {
        insightsByType.set(key, []);
      }
      insightsByType.get(key)!.push(insight);
    });
    
    // Identify patterns that appear across multiple agents
    insightsByType.forEach((insights, type) => {
      if (insights.length >= 2) { // At least 2 agents agree
        const consensusInsight: ReflectionInsight = {
          id: crypto.randomUUID(),
          level: insights[0].level,
          insight_type: insights[0].insight_type,
          content: `Shared pattern: ${insights.map(i => i.content).join('; ')}`,
          confidence: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length,
          impact_score: Math.max(...insights.map(i => i.impact_score)),
          actionable_recommendations: [...new Set(insights.flatMap(i => i.actionable_recommendations))],
          evidence: insights.flatMap(i => i.evidence),
          created_at: new Date().toISOString()
        };
        sharedPatterns.push(consensusInsight);
      }
    });
    
    return sharedPatterns;
  }

  private async generateCollaborativeImprovements(sharedInsights: ReflectionInsight[]): Promise<string[]> {
    const improvements: string[] = [];
    
    sharedInsights.forEach(insight => {
      improvements.push(...insight.actionable_recommendations);
    });
    
    // Add cross-agent specific improvements
    improvements.push('Establish regular cross-agent reflection sessions');
    improvements.push('Create shared knowledge base for insights');
    improvements.push('Implement collaborative decision-making protocols');
    
    return [...new Set(improvements)]; // Remove duplicates
  }

  private calculateConsensusLevel(agentInsights: Map<string, ReflectionInsight[]>): number {
    if (agentInsights.size < 2) return 1.0;
    
    const allInsights = Array.from(agentInsights.values()).flat();
    const uniquePatterns = new Set(allInsights.map(i => `${i.insight_type}_${i.level}`));
    const totalInsights = allInsights.length;
    
    // Consensus is higher when insights are more similar across agents
    return Math.min(uniquePatterns.size / totalInsights * 2, 1.0);
  }

  private async generateNextSteps(
    sharedInsights: ReflectionInsight[],
    improvements: string[]
  ): Promise<string[]> {
    const nextSteps: string[] = [];
    
    // Prioritize high-impact insights
    const highImpactInsights = sharedInsights.filter(i => i.impact_score > 0.7);
    highImpactInsights.forEach(insight => {
      nextSteps.push(`Implement: ${insight.actionable_recommendations[0]}`);
    });
    
    // Add improvement implementation
    improvements.slice(0, 3).forEach(improvement => {
      nextSteps.push(`Execute: ${improvement}`);
    });
    
    // Add monitoring steps
    nextSteps.push('Monitor implementation results');
    nextSteps.push('Schedule follow-up reflection session');
    
    return nextSteps;
  }

  async updateTemporalPatterns(
    insights: Map<string, ReflectionInsight[]>,
    agentId: string
  ): Promise<void> {
    const allInsights = Array.from(insights.values()).flat();
    
    // Analyze patterns over time
    for (const insight of allInsights) {
      await this.identifyTemporalPattern(insight, agentId);
    }
    
    // Clean up old patterns
    this.temporalPatterns = this.temporalPatterns.filter(
      pattern => Date.now() - new Date(pattern.pattern_id).getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
    );
  }

  private async identifyTemporalPattern(insight: ReflectionInsight, agentId: string): Promise<void> {
    const similarInsights = Array.from(this.reflectionHistory.values())
      .flat()
      .filter(i => i.insight_type === insight.insight_type && i.level === insight.level);
    
    if (similarInsights.length >= 3) {
      const pattern: TemporalPattern = {
        pattern_id: crypto.randomUUID(),
        pattern_type: this.classifyPattern(similarInsights),
        description: `Recurring ${insight.insight_type} pattern in ${insight.level} reflections`,
        frequency: similarInsights.length,
        trend_direction: this.analyzeTrend(similarInsights),
        confidence: Math.min(similarInsights.length / 10, 0.95),
        time_span_days: this.calculateTimeSpan(similarInsights)
      };
      
      this.temporalPatterns.push(pattern);
      await this.logTemporalPattern(pattern, agentId);
    }
  }

  private classifyPattern(insights: ReflectionInsight[]): TemporalPattern['pattern_type'] {
    const successCount = insights.filter(i => i.insight_type === 'success_factor').length;
    const failureCount = insights.filter(i => i.insight_type === 'failure_point').length;
    
    if (successCount > failureCount * 1.5) return 'recurring_success';
    if (failureCount > successCount * 1.5) return 'recurring_failure';
    
    return 'learning_curve';
  }

  private analyzeTrend(insights: ReflectionInsight[]): TemporalPattern['trend_direction'] {
    if (insights.length < 3) return 'stable';
    
    const sortedInsights = insights.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const firstHalf = sortedInsights.slice(0, Math.floor(sortedInsights.length / 2));
    const secondHalf = sortedInsights.slice(Math.floor(sortedInsights.length / 2));
    
    const firstAvgImpact = firstHalf.reduce((sum, i) => sum + i.impact_score, 0) / firstHalf.length;
    const secondAvgImpact = secondHalf.reduce((sum, i) => sum + i.impact_score, 0) / secondHalf.length;
    
    const difference = secondAvgImpact - firstAvgImpact;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private calculateTimeSpan(insights: ReflectionInsight[]): number {
    if (insights.length < 2) return 1;
    
    const dates = insights.map(i => new Date(i.created_at).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    return Math.ceil((maxDate - minDate) / (24 * 60 * 60 * 1000)); // Days
  }

  private async logReflectionSession(
    insights: Map<string, ReflectionInsight[]>,
    agentId: string,
    context: any
  ): Promise<void> {
    try {
      const sessionData = {
        agent_id: agentId,
        insights: Object.fromEntries(insights),
        context,
        timestamp: new Date().toISOString()
      };

      await supabase.from('agentic_memory').insert({
        agent_id: 'reflection_system',
        user_id: agentId,
        memory_key: `reflection_session_${Date.now()}`,
        memory_data: JSON.parse(JSON.stringify(sessionData)) as any,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error logging reflection session:', error);
    }
  }

  private async logInsightConnection(connection: any, agentId: string): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: 'reflection_system',
        user_id: agentId,
        memory_key: `insight_connection_${connection.id}`,
        memory_data: JSON.parse(JSON.stringify(connection)) as any,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error logging insight connection:', error);
    }
  }

  private async logCrossAgentReflection(reflection: CrossAgentReflection): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: 'reflection_system',
        user_id: 'cross_agent_system',
        memory_key: `cross_agent_reflection_${Date.now()}`,
        memory_data: JSON.parse(JSON.stringify(reflection)) as any,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error logging cross-agent reflection:', error);
    }
  }

  private async logTemporalPattern(pattern: TemporalPattern, agentId: string): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: 'reflection_system',
        user_id: agentId,
        memory_key: `temporal_pattern_${pattern.pattern_id}`,
        memory_data: JSON.parse(JSON.stringify(pattern)) as any,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error logging temporal pattern:', error);
    }
  }

  async getTemporalPatterns(agentId?: string): Promise<TemporalPattern[]> {
    return this.temporalPatterns
      .filter(p => !agentId || p.pattern_id.includes(agentId))
      .sort((a, b) => b.confidence - a.confidence);
  }

  async getCrossAgentInsights(): Promise<CrossAgentReflection[]> {
    return this.crossAgentInsights
      .sort((a, b) => b.consensus_level - a.consensus_level);
  }

  async getReflectionSummary(agentId: string): Promise<any> {
    const taskInsights = this.reflectionHistory.get('task') || [];
    const strategyInsights = this.reflectionHistory.get('strategy') || [];
    const metaInsights = this.reflectionHistory.get('meta_strategy') || [];
    
    return {
      total_insights: taskInsights.length + strategyInsights.length + metaInsights.length,
      by_level: {
        task: taskInsights.length,
        strategy: strategyInsights.length,
        meta_strategy: metaInsights.length
      },
      average_confidence: this.calculateAverageConfidence(),
      top_patterns: this.temporalPatterns.slice(0, 5),
      recent_cross_agent_insights: this.crossAgentInsights.slice(-3)
    };
  }

  private calculateAverageConfidence(): number {
    const allInsights = Array.from(this.reflectionHistory.values()).flat();
    if (allInsights.length === 0) return 0;
    
    return allInsights.reduce((sum, insight) => sum + insight.confidence, 0) / allInsights.length;
  }
}

export const advancedReflectionSystem = new AdvancedReflectionSystem();