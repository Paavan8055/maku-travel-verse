import { supabase } from '@/integrations/supabase/client';

export interface LearningEvent {
  id: string;
  event_type: 'user_feedback' | 'task_completion' | 'error_correction' | 'performance_metric';
  agent_id: string;
  event_data: any;
  outcome_rating: number; // -1 to 1 scale
  context: {
    task_type?: string;
    complexity_level?: number;
    user_satisfaction?: number;
    execution_time?: number;
    resource_usage?: number;
  };
  learning_signals: {
    reinforcement_value: number;
    confidence_delta: number;
    pattern_strength: number;
  };
  timestamp: string;
}

export interface ModelUpdate {
  id: string;
  agent_id: string;
  update_type: 'strategy_weight' | 'parameter_adjustment' | 'pattern_learning' | 'bias_correction';
  before_state: any;
  after_state: any;
  improvement_metric: number;
  validation_score: number;
  update_confidence: number;
  applied_at: string;
}

export interface PerformanceMetric {
  metric_name: string;
  current_value: number;
  historical_average: number;
  trend_direction: 'improving' | 'declining' | 'stable';
  confidence_interval: [number, number];
  last_updated: string;
}

export interface ABTestConfiguration {
  test_id: string;
  test_name: string;
  control_version: string;
  treatment_versions: string[];
  traffic_split: number; // 0-1 representing percentage to treatment
  success_metrics: string[];
  minimum_sample_size: number;
  max_duration_days: number;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface ABTestResult {
  test_id: string;
  version_id: string;
  sample_size: number;
  success_rate: number;
  performance_metrics: Map<string, PerformanceMetric>;
  confidence_level: number;
  statistical_significance: boolean;
  recommendation: 'adopt' | 'reject' | 'continue_testing';
}

export class ContinuousLearningPipeline {
  private learningEvents: LearningEvent[] = [];
  private modelUpdates: Map<string, ModelUpdate[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetric> = new Map();
  private abTests: Map<string, ABTestConfiguration> = new Map();
  private learningRate = 0.01;
  private updateThreshold = 0.1;

  constructor() {
    this.initializePipeline();
  }

  private async initializePipeline(): Promise<void> {
    await this.loadHistoricalData();
    this.startContinuousProcessing();
  }

  async recordLearningEvent(
    eventType: LearningEvent['event_type'],
    agentId: string,
    eventData: any,
    outcomeRating: number,
    context: LearningEvent['context'] = {}
  ): Promise<string> {
    const learningSignals = this.calculateLearningSignals(eventData, outcomeRating, context);
    
    const event: LearningEvent = {
      id: crypto.randomUUID(),
      event_type: eventType,
      agent_id: agentId,
      event_data: eventData,
      outcome_rating: Math.max(-1, Math.min(1, outcomeRating)), // Clamp to [-1, 1]
      context,
      learning_signals: learningSignals,
      timestamp: new Date().toISOString()
    };

    this.learningEvents.push(event);
    await this.persistLearningEvent(event);

    // Trigger immediate learning if event is significant
    if (Math.abs(learningSignals.reinforcement_value) > 0.7) {
      await this.processImmediateLearning(event);
    }

    return event.id;
  }

  private calculateLearningSignals(
    eventData: any,
    outcomeRating: number,
    context: LearningEvent['context']
  ): LearningEvent['learning_signals'] {
    // Calculate reinforcement learning signal
    const reinforcementValue = outcomeRating; // Direct mapping for now
    
    // Calculate confidence delta based on context
    let confidenceDelta = 0;
    if (context.user_satisfaction !== undefined) {
      confidenceDelta += (context.user_satisfaction - 0.5) * 0.3;
    }
    if (context.execution_time !== undefined && eventData.expected_time) {
      const timeEfficiency = eventData.expected_time / context.execution_time;
      confidenceDelta += (timeEfficiency - 1) * 0.2;
    }

    // Calculate pattern strength based on frequency and consistency
    const patternStrength = this.calculatePatternStrength(eventData, outcomeRating);

    return {
      reinforcement_value: reinforcementValue,
      confidence_delta: Math.max(-1, Math.min(1, confidenceDelta)),
      pattern_strength: patternStrength
    };
  }

  private calculatePatternStrength(eventData: any, outcomeRating: number): number {
    // Find similar events in recent history
    const recentEvents = this.learningEvents
      .filter(event => 
        event.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const similarEvents = recentEvents.filter(event => 
      this.areEventsSimilar(event.event_data, eventData)
    );

    if (similarEvents.length < 2) return 0.1;

    // Calculate consistency of outcomes
    const outcomes = similarEvents.map(event => event.outcome_rating);
    const avgOutcome = outcomes.reduce((sum, o) => sum + o, 0) / outcomes.length;
    const variance = outcomes.reduce((sum, o) => sum + Math.pow(o - avgOutcome, 2), 0) / outcomes.length;
    
    // Pattern is stronger when there are more similar events with consistent outcomes
    const frequency = Math.min(similarEvents.length / 10, 1);
    const consistency = Math.max(0, 1 - variance);
    
    return (frequency * 0.6 + consistency * 0.4);
  }

  private areEventsSimilar(eventData1: any, eventData2: any): boolean {
    // Simple similarity check - in production this would be more sophisticated
    if (eventData1.task_type && eventData2.task_type) {
      return eventData1.task_type === eventData2.task_type;
    }
    
    if (eventData1.action && eventData2.action) {
      return eventData1.action === eventData2.action;
    }
    
    return false;
  }

  private async processImmediateLearning(event: LearningEvent): Promise<void> {
    const updates = await this.generateModelUpdates(event);
    
    for (const update of updates) {
      await this.applyModelUpdate(update);
    }
  }

  private async generateModelUpdates(event: LearningEvent): Promise<ModelUpdate[]> {
    const updates: ModelUpdate[] = [];
    
    // Strategy weight updates based on outcome
    if (event.event_data.strategy_used && Math.abs(event.learning_signals.reinforcement_value) > 0.5) {
      const strategyUpdate = await this.generateStrategyWeightUpdate(event);
      if (strategyUpdate) updates.push(strategyUpdate);
    }

    // Parameter adjustments based on performance
    if (event.context.execution_time && event.context.resource_usage) {
      const parameterUpdate = await this.generateParameterAdjustment(event);
      if (parameterUpdate) updates.push(parameterUpdate);
    }

    // Pattern learning from repeated behaviors
    if (event.learning_signals.pattern_strength > 0.7) {
      const patternUpdate = await this.generatePatternLearning(event);
      if (patternUpdate) updates.push(patternUpdate);
    }

    return updates;
  }

  private async generateStrategyWeightUpdate(event: LearningEvent): Promise<ModelUpdate | null> {
    const strategyId = event.event_data.strategy_used;
    const currentWeight = event.event_data.strategy_weight || 0.5;
    
    // Adjust weight based on reinforcement signal
    const adjustment = event.learning_signals.reinforcement_value * this.learningRate;
    const newWeight = Math.max(0.1, Math.min(0.9, currentWeight + adjustment));
    
    if (Math.abs(newWeight - currentWeight) < this.updateThreshold) {
      return null; // Change too small to matter
    }

    return {
      id: crypto.randomUUID(),
      agent_id: event.agent_id,
      update_type: 'strategy_weight',
      before_state: { strategy_id: strategyId, weight: currentWeight },
      after_state: { strategy_id: strategyId, weight: newWeight },
      improvement_metric: Math.abs(adjustment),
      validation_score: event.learning_signals.pattern_strength,
      update_confidence: Math.abs(event.learning_signals.reinforcement_value),
      applied_at: new Date().toISOString()
    };
  }

  private async generateParameterAdjustment(event: LearningEvent): Promise<ModelUpdate | null> {
    const executionTime = event.context.execution_time!;
    const resourceUsage = event.context.resource_usage!;
    const expectedTime = event.event_data.expected_time || executionTime;
    
    // If we're consistently over/under time, adjust parameters
    const timeRatio = executionTime / expectedTime;
    
    if (timeRatio > 1.2) { // 20% slower than expected
      return {
        id: crypto.randomUUID(),
        agent_id: event.agent_id,
        update_type: 'parameter_adjustment',
        before_state: { timeout_multiplier: 1.0, resource_limit: 1.0 },
        after_state: { timeout_multiplier: 1.1, resource_limit: 1.05 },
        improvement_metric: timeRatio - 1.0,
        validation_score: event.learning_signals.confidence_delta,
        update_confidence: 0.7,
        applied_at: new Date().toISOString()
      };
    }
    
    if (timeRatio < 0.8) { // 20% faster than expected
      return {
        id: crypto.randomUUID(),
        agent_id: event.agent_id,
        update_type: 'parameter_adjustment',
        before_state: { timeout_multiplier: 1.0, resource_limit: 1.0 },
        after_state: { timeout_multiplier: 0.95, resource_limit: 0.98 },
        improvement_metric: 1.0 - timeRatio,
        validation_score: event.learning_signals.confidence_delta,
        update_confidence: 0.7,
        applied_at: new Date().toISOString()
      };
    }
    
    return null;
  }

  private async generatePatternLearning(event: LearningEvent): Promise<ModelUpdate | null> {
    // Learn from recurring successful patterns
    const patternData = {
      event_type: event.event_type,
      context_signature: this.generateContextSignature(event.context),
      success_indicators: event.outcome_rating > 0.5 ? event.event_data : null
    };

    return {
      id: crypto.randomUUID(),
      agent_id: event.agent_id,
      update_type: 'pattern_learning',
      before_state: { patterns: [] },
      after_state: { patterns: [patternData] },
      improvement_metric: event.learning_signals.pattern_strength,
      validation_score: event.learning_signals.reinforcement_value,
      update_confidence: event.learning_signals.pattern_strength,
      applied_at: new Date().toISOString()
    };
  }

  private generateContextSignature(context: LearningEvent['context']): string {
    const keys = ['task_type', 'complexity_level'];
    return keys
      .map(key => `${key}:${context[key as keyof typeof context] || 'null'}`)
      .join('|');
  }

  private async applyModelUpdate(update: ModelUpdate): Promise<void> {
    // Store the update
    if (!this.modelUpdates.has(update.agent_id)) {
      this.modelUpdates.set(update.agent_id, []);
    }
    this.modelUpdates.get(update.agent_id)!.push(update);

    // Persist the update
    await this.persistModelUpdate(update);

    // Apply the update to the live system (would integrate with actual model)
    await this.applyUpdateToLiveSystem(update);
  }

  private async applyUpdateToLiveSystem(update: ModelUpdate): Promise<void> {
    try {
      // Call the continuous-learning-service edge function
      await supabase.functions.invoke('continuous-learning-service', {
        body: {
          action: 'apply_update',
          update
        }
      });
    } catch (error) {
      console.error('Error applying update to live system:', error);
    }
  }

  async trackPerformanceMetric(
    metricName: string,
    value: number,
    agentId?: string
  ): Promise<void> {
    const key = agentId ? `${agentId}_${metricName}` : metricName;
    const existingMetric = this.performanceMetrics.get(key);
    
    const newMetric: PerformanceMetric = {
      metric_name: metricName,
      current_value: value,
      historical_average: existingMetric ? 
        (existingMetric.historical_average * 0.9 + value * 0.1) : value,
      trend_direction: existingMetric ? 
        this.calculateTrendDirection(existingMetric.current_value, value) : 'stable',
      confidence_interval: this.calculateConfidenceInterval(value, existingMetric),
      last_updated: new Date().toISOString()
    };

    this.performanceMetrics.set(key, newMetric);
    await this.persistPerformanceMetric(key, newMetric);

    // Trigger learning if significant change
    if (existingMetric && Math.abs(value - existingMetric.current_value) > 0.2) {
      await this.recordLearningEvent(
        'performance_metric',
        agentId || 'system',
        { metric_name: metricName, previous_value: existingMetric.current_value, new_value: value },
        value > existingMetric.current_value ? 0.5 : -0.5,
        { user_satisfaction: value }
      );
    }
  }

  private calculateTrendDirection(oldValue: number, newValue: number): PerformanceMetric['trend_direction'] {
    const change = newValue - oldValue;
    const threshold = Math.abs(oldValue) * 0.05; // 5% threshold
    
    if (change > threshold) return 'improving';
    if (change < -threshold) return 'declining';
    return 'stable';
  }

  private calculateConfidenceInterval(value: number, existingMetric?: PerformanceMetric): [number, number] {
    // Simple confidence interval calculation
    const variance = existingMetric ? Math.abs(value - existingMetric.current_value) : value * 0.1;
    const margin = variance * 1.96; // 95% confidence interval
    return [value - margin, value + margin];
  }

  async createABTest(
    testName: string,
    controlVersion: string,
    treatmentVersions: string[],
    successMetrics: string[],
    trafficSplit: number = 0.5,
    maxDurationDays: number = 14
  ): Promise<string> {
    const testId = crypto.randomUUID();
    
    const abTest: ABTestConfiguration = {
      test_id: testId,
      test_name: testName,
      control_version: controlVersion,
      treatment_versions: treatmentVersions,
      traffic_split: trafficSplit,
      success_metrics: successMetrics,
      minimum_sample_size: 100,
      max_duration_days: maxDurationDays,
      status: 'active',
      created_at: new Date().toISOString()
    };

    this.abTests.set(testId, abTest);
    await this.persistABTest(abTest);

    return testId;
  }

  async recordABTestResult(
    testId: string,
    versionId: string,
    success: boolean,
    performanceData: Record<string, number>
  ): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'active') return;

    // Record the result (in practice, this would aggregate with existing results)
    const result: ABTestResult = {
      test_id: testId,
      version_id: versionId,
      sample_size: 1, // Would be aggregated
      success_rate: success ? 1.0 : 0.0,
      performance_metrics: new Map(),
      confidence_level: 0.95,
      statistical_significance: false, // Would be calculated
      recommendation: 'continue_testing'
    };

    // Convert performance data to metrics
    Object.entries(performanceData).forEach(([name, value]) => {
      result.performance_metrics.set(name, {
        metric_name: name,
        current_value: value,
        historical_average: value,
        trend_direction: 'stable',
        confidence_interval: [value * 0.9, value * 1.1],
        last_updated: new Date().toISOString()
      });
    });

    await this.persistABTestResult(result);

    // Check if we should conclude the test
    await this.evaluateABTestCompletion(testId);
  }

  private async evaluateABTestCompletion(testId: string): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) return;

    // Simple completion logic - in practice this would be more sophisticated
    const testAge = Date.now() - new Date(test.created_at).getTime();
    const maxAge = test.max_duration_days * 24 * 60 * 60 * 1000;

    if (testAge >= maxAge) {
      test.status = 'completed';
      await this.persistABTest(test);
      
      // Generate final recommendations
      await this.generateABTestRecommendations(testId);
    }
  }

  private async generateABTestRecommendations(testId: string): Promise<void> {
    // In practice, this would analyze all results and provide statistical recommendations
    console.log(`Generating recommendations for A/B test ${testId}`);
    
    // Create a learning event based on test results
    await this.recordLearningEvent(
      'task_completion',
      'ab_test_system',
      { test_id: testId, completed: true },
      0.7, // Assume positive outcome for completing test
      { task_type: 'ab_testing' }
    );
  }

  async getBatchUpdates(
    agentId: string,
    since?: string
  ): Promise<ModelUpdate[]> {
    const updates = this.modelUpdates.get(agentId) || [];
    
    if (since) {
      return updates.filter(update => update.applied_at > since);
    }
    
    return updates.slice(-10); // Last 10 updates
  }

  async getFeedbackIntegrationData(agentId: string): Promise<any> {
    const recentEvents = this.learningEvents
      .filter(event => 
        event.agent_id === agentId &&
        event.event_type === 'user_feedback' &&
        event.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const avgRating = recentEvents.length > 0 
      ? recentEvents.reduce((sum, e) => sum + e.outcome_rating, 0) / recentEvents.length
      : 0;

    const feedbackTrends = this.analyzeFeedbackTrends(recentEvents);

    return {
      total_feedback_events: recentEvents.length,
      average_rating: avgRating,
      feedback_trends: feedbackTrends,
      top_improvement_areas: this.identifyImprovementAreas(recentEvents),
      recent_positive_patterns: this.identifyPositivePatterns(recentEvents)
    };
  }

  private analyzeFeedbackTrends(events: LearningEvent[]): any {
    if (events.length < 2) return { trend: 'insufficient_data' };

    const sortedEvents = events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstHalf = sortedEvents.slice(0, Math.floor(sortedEvents.length / 2));
    const secondHalf = sortedEvents.slice(Math.floor(sortedEvents.length / 2));

    const firstAvg = firstHalf.reduce((sum, e) => sum + e.outcome_rating, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.outcome_rating, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    
    return {
      trend: change > 0.1 ? 'improving' : change < -0.1 ? 'declining' : 'stable',
      change_magnitude: Math.abs(change),
      confidence: Math.min(events.length / 10, 1.0)
    };
  }

  private identifyImprovementAreas(events: LearningEvent[]): string[] {
    const negativeEvents = events.filter(e => e.outcome_rating < 0);
    const areas = new Map<string, number>();

    negativeEvents.forEach(event => {
      const taskType = event.context.task_type || 'unknown';
      areas.set(taskType, (areas.get(taskType) || 0) + 1);
    });

    return Array.from(areas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area);
  }

  private identifyPositivePatterns(events: LearningEvent[]): any[] {
    const positiveEvents = events.filter(e => e.outcome_rating > 0.5);
    
    return positiveEvents
      .slice(-5)
      .map(event => ({
        pattern: event.event_data.strategy_used || 'unknown_strategy',
        success_rating: event.outcome_rating,
        context: event.context.task_type
      }));
  }

  private startContinuousProcessing(): void {
    // Process learning events every 5 minutes
    setInterval(async () => {
      await this.processBatchLearning();
    }, 5 * 60 * 1000);

    // Cleanup old events every hour
    setInterval(async () => {
      await this.cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  private async processBatchLearning(): Promise<void> {
    // Process accumulated learning events
    const recentEvents = this.learningEvents.filter(event =>
      new Date(event.timestamp).getTime() > Date.now() - 5 * 60 * 1000
    );

    if (recentEvents.length < 3) return;

    // Look for batch patterns
    const batchInsights = await this.analyzeBatchPatterns(recentEvents);
    
    for (const insight of batchInsights) {
      await this.recordLearningEvent(
        'task_completion',
        'batch_processor',
        insight,
        insight.confidence,
        { task_type: 'batch_analysis' }
      );
    }
  }

  private async analyzeBatchPatterns(events: LearningEvent[]): Promise<any[]> {
    const patterns: any[] = [];
    
    // Group by agent
    const agentGroups = new Map<string, LearningEvent[]>();
    events.forEach(event => {
      if (!agentGroups.has(event.agent_id)) {
        agentGroups.set(event.agent_id, []);
      }
      agentGroups.get(event.agent_id)!.push(event);
    });

    // Analyze each agent's batch
    agentGroups.forEach((agentEvents, agentId) => {
      if (agentEvents.length >= 2) {
        const avgOutcome = agentEvents.reduce((sum, e) => sum + e.outcome_rating, 0) / agentEvents.length;
        
        patterns.push({
          agent_id: agentId,
          pattern_type: 'batch_performance',
          average_outcome: avgOutcome,
          event_count: agentEvents.length,
          confidence: Math.min(agentEvents.length / 5, 1.0)
        });
      }
    });

    return patterns;
  }

  private async cleanupOldEvents(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    this.learningEvents = this.learningEvents.filter(event => 
      event.timestamp > cutoff
    );

    // Cleanup from database
    try {
      await supabase
        .from('agentic_memory')
        .delete()
        .like('memory_key', 'learning_event_%')
        .lt('created_at', cutoff);
    } catch (error) {
      console.error('Error cleaning up old learning events:', error);
    }
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('agentic_memory')
        .select('*')
        .like('memory_key', 'learning_event_%')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error loading historical data:', error);
        return;
      }

      for (const record of data || []) {
        const eventData = record.memory_data as any;
        if (eventData?.id && eventData?.event_type) {
          this.learningEvents.push(eventData);
        }
      }
    } catch (error) {
      console.error('Error loading historical learning data:', error);
    }
  }

  private async persistLearningEvent(event: LearningEvent): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: event.agent_id,
        user_id: event.agent_id,
        memory_key: `learning_event_${event.id}`,
        memory_data: JSON.parse(JSON.stringify(event)) as any,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error persisting learning event:', error);
    }
  }

  private async persistModelUpdate(update: ModelUpdate): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: update.agent_id,
        user_id: update.agent_id,
        memory_key: `model_update_${update.id}`,
        memory_data: JSON.parse(JSON.stringify(update)) as any,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error persisting model update:', error);
    }
  }

  private async persistPerformanceMetric(key: string, metric: PerformanceMetric): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: 'performance_system',
        user_id: 'system',
        memory_key: `performance_metric_${key}`,
        memory_data: JSON.parse(JSON.stringify(metric)) as any,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error persisting performance metric:', error);
    }
  }

  private async persistABTest(abTest: ABTestConfiguration): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: 'ab_test_system',
        user_id: 'system',
        memory_key: `ab_test_${abTest.test_id}`,
        memory_data: JSON.parse(JSON.stringify(abTest)) as any,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error persisting A/B test:', error);
    }
  }

  private async persistABTestResult(result: ABTestResult): Promise<void> {
    try {
      const resultData = {
        ...result,
        performance_metrics: Object.fromEntries(result.performance_metrics)
      };
      
      await supabase.from('agentic_memory').insert({
        agent_id: 'ab_test_system',
        user_id: 'system',
        memory_key: `ab_test_result_${result.test_id}_${result.version_id}_${Date.now()}`,
        memory_data: JSON.parse(JSON.stringify(resultData)) as any,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error persisting A/B test result:', error);
    }
  }

  async getLearningStats(agentId?: string): Promise<any> {
    const relevantEvents = this.learningEvents
      .filter(event => !agentId || event.agent_id === agentId);

    const updates = agentId ? (this.modelUpdates.get(agentId) || []) : 
      Array.from(this.modelUpdates.values()).flat();

    return {
      total_learning_events: relevantEvents.length,
      total_model_updates: updates.length,
      average_outcome_rating: relevantEvents.length > 0 
        ? relevantEvents.reduce((sum, e) => sum + e.outcome_rating, 0) / relevantEvents.length 
        : 0,
      learning_velocity: this.calculateLearningVelocity(relevantEvents),
      active_ab_tests: Array.from(this.abTests.values()).filter(t => t.status === 'active').length,
      performance_metrics_tracked: this.performanceMetrics.size
    };
  }

  private calculateLearningVelocity(events: LearningEvent[]): number {
    if (events.length < 2) return 0;

    const recentEvents = events.filter(event =>
      new Date(event.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    return recentEvents.length / 7; // Events per day
  }
}

export const continuousLearningPipeline = new ContinuousLearningPipeline();