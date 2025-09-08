import type { SupabaseClient } from '@supabase/supabase-js';

export interface TravelConstraint {
  type: 'budget' | 'time' | 'location' | 'preferences' | 'accessibility' | 'policy';
  value: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  flexibility: number; // 0-1, how flexible this constraint is
  impact_score: number; // How much this affects the overall plan
}

export interface TravelDecisionNode {
  id: string;
  decision_type: 'destination' | 'timing' | 'accommodation' | 'transport' | 'activities';
  options: Array<{
    id: string;
    name: string;
    cost: number;
    time_required: number;
    satisfaction_score: number;
    constraints_met: string[];
    trade_offs: Record<string, any>;
  }>;
  selected_option?: string;
  reasoning: string;
  confidence: number;
  dependencies: string[];
}

export interface ItineraryOptimization {
  original_plan: any;
  optimized_plan: any;
  improvements: Array<{
    type: 'cost_reduction' | 'time_efficiency' | 'experience_enhancement' | 'risk_mitigation';
    description: string;
    impact: number;
    trade_offs: string[];
  }>;
  optimization_score: number;
  total_savings: number;
  efficiency_gain: number;
}

export class TravelReasoningModules {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async analyzeDestinationSuitability(
    destinations: string[],
    constraints: TravelConstraint[],
    userPreferences: Record<string, any>
  ): Promise<{
    rankings: Array<{
      destination: string;
      suitability_score: number;
      reasoning: string;
      pros: string[];
      cons: string[];
      constraint_compliance: Record<string, boolean>;
    }>;
    recommendation: string;
    confidence: number;
  }> {
    const rankings = [];

    for (const destination of destinations) {
      const analysis = await this.evaluateDestination(destination, constraints, userPreferences);
      rankings.push(analysis);
    }

    // Sort by suitability score
    rankings.sort((a, b) => b.suitability_score - a.suitability_score);

    const topDestination = rankings[0];
    const avgScore = rankings.reduce((sum, r) => sum + r.suitability_score, 0) / rankings.length;
    const confidence = topDestination.suitability_score / avgScore;

    return {
      rankings,
      recommendation: topDestination.destination,
      confidence: Math.min(confidence, 1.0)
    };
  }

  private async evaluateDestination(
    destination: string,
    constraints: TravelConstraint[],
    preferences: Record<string, any>
  ): Promise<{
    destination: string;
    suitability_score: number;
    reasoning: string;
    pros: string[];
    cons: string[];
    constraint_compliance: Record<string, boolean>;
  }> {
    // Simulate destination evaluation logic
    const budgetConstraint = constraints.find(c => c.type === 'budget');
    const timeConstraint = constraints.find(c => c.type === 'time');
    const preferenceConstraints = constraints.filter(c => c.type === 'preferences');

    const baseScore = Math.random() * 0.4 + 0.6; // Base score 0.6-1.0
    let adjustedScore = baseScore;
    const pros: string[] = [];
    const cons: string[] = [];
    const compliance: Record<string, boolean> = {};

    // Budget compliance
    if (budgetConstraint) {
      const destinationCost = this.estimateDestinationCost(destination);
      const budgetRatio = destinationCost / budgetConstraint.value;
      compliance['budget'] = budgetRatio <= 1.1; // 10% tolerance
      
      if (budgetRatio <= 0.8) {
        pros.push(`Well within budget (${(budgetRatio * 100).toFixed(0)}% of budget)`);
        adjustedScore += 0.1;
      } else if (budgetRatio > 1.1) {
        cons.push(`Exceeds budget by ${((budgetRatio - 1) * 100).toFixed(0)}%`);
        adjustedScore -= 0.2;
      }
    }

    // Time constraints
    if (timeConstraint) {
      const optimalDuration = this.getOptimalDuration(destination);
      const availableDays = timeConstraint.value;
      compliance['time'] = availableDays >= optimalDuration * 0.8;
      
      if (availableDays >= optimalDuration) {
        pros.push(`Sufficient time for comprehensive experience`);
        adjustedScore += 0.05;
      } else if (availableDays < optimalDuration * 0.6) {
        cons.push(`Limited time may compromise experience quality`);
        adjustedScore -= 0.15;
      }
    }

    // Preference matching
    const preferenceMatch = this.calculatePreferenceMatch(destination, preferences);
    compliance['preferences'] = preferenceMatch > 0.7;
    
    if (preferenceMatch > 0.8) {
      pros.push(`Excellent match for your interests`);
      adjustedScore += 0.1;
    } else if (preferenceMatch < 0.5) {
      cons.push(`Limited options for your preferred activities`);
      adjustedScore -= 0.1;
    }

    const reasoning = this.generateDestinationReasoning(destination, adjustedScore, pros, cons);

    return {
      destination,
      suitability_score: Math.max(0, Math.min(1, adjustedScore)),
      reasoning,
      pros,
      cons,
      constraint_compliance: compliance
    };
  }

  async optimizeItinerary(
    baseItinerary: any,
    constraints: TravelConstraint[],
    objectives: string[] = ['cost', 'time', 'satisfaction']
  ): Promise<ItineraryOptimization> {
    const startTime = Date.now();

    try {
      const optimizedPlan = await this.performItineraryOptimization(baseItinerary, constraints, objectives);
      const improvements = await this.identifyImprovements(baseItinerary, optimizedPlan);
      
      const costSavings = this.calculateCostSavings(baseItinerary, optimizedPlan);
      const efficiencyGain = this.calculateEfficiencyGain(baseItinerary, optimizedPlan);
      const optimizationScore = this.calculateOptimizationScore(improvements);

      return {
        original_plan: baseItinerary,
        optimized_plan: optimizedPlan,
        improvements,
        optimization_score: optimizationScore,
        total_savings: costSavings,
        efficiency_gain: efficiencyGain
      };

    } catch (error) {
      console.error('Itinerary optimization failed:', error);
      return {
        original_plan: baseItinerary,
        optimized_plan: baseItinerary,
        improvements: [],
        optimization_score: 0,
        total_savings: 0,
        efficiency_gain: 0
      };
    }
  }

  private async performItineraryOptimization(
    baseItinerary: any,
    constraints: TravelConstraint[],
    objectives: string[]
  ): Promise<any> {
    // Create a copy for optimization
    const optimized = JSON.parse(JSON.stringify(baseItinerary));

    // Cost optimization
    if (objectives.includes('cost')) {
      optimized.accommodation = await this.optimizeAccommodation(optimized.accommodation, constraints);
      optimized.transportation = await this.optimizeTransportation(optimized.transportation, constraints);
      optimized.activities = await this.optimizeActivities(optimized.activities, constraints);
    }

    // Time optimization
    if (objectives.includes('time')) {
      optimized.schedule = await this.optimizeSchedule(optimized.schedule, constraints);
      optimized.routing = await this.optimizeRouting(optimized.routing);
    }

    // Satisfaction optimization
    if (objectives.includes('satisfaction')) {
      optimized.experiences = await this.enhanceExperiences(optimized.experiences);
      optimized.personalization = await this.addPersonalization(optimized.personalization, constraints);
    }

    return optimized;
  }

  async createDecisionTree(
    problemType: 'booking_conflict' | 'budget_overflow' | 'timing_issue' | 'preference_conflict',
    context: Record<string, any>
  ): Promise<TravelDecisionNode> {
    const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    switch (problemType) {
      case 'booking_conflict':
        return this.createBookingConflictDecision(decisionId, context);
      case 'budget_overflow':
        return this.createBudgetDecision(decisionId, context);
      case 'timing_issue':
        return this.createTimingDecision(decisionId, context);
      case 'preference_conflict':
        return this.createPreferenceDecision(decisionId, context);
      default:
        throw new Error(`Unknown problem type: ${problemType}`);
    }
  }

  private createBookingConflictDecision(id: string, context: Record<string, any>): TravelDecisionNode {
    return {
      id,
      decision_type: 'accommodation',
      options: [
        {
          id: 'alternative_dates',
          name: 'Adjust travel dates',
          cost: 0,
          time_required: 30,
          satisfaction_score: 0.7,
          constraints_met: ['availability'],
          trade_offs: { flexibility: 'Required', convenience: 'Reduced' }
        },
        {
          id: 'alternative_location',
          name: 'Choose alternative accommodation',
          cost: context.price_difference || 50,
          time_required: 60,
          satisfaction_score: 0.6,
          constraints_met: ['budget', 'timing'],
          trade_offs: { location: 'Compromise', amenities: 'Different' }
        },
        {
          id: 'premium_option',
          name: 'Accept premium pricing',
          cost: context.premium_cost || 200,
          time_required: 0,
          satisfaction_score: 0.9,
          constraints_met: ['timing', 'preferences'],
          trade_offs: { budget: 'Increased', satisfaction: 'High' }
        }
      ],
      reasoning: 'Booking conflict requires trade-off between cost, convenience, and preferences',
      confidence: 0.8,
      dependencies: ['budget_constraint', 'timing_flexibility']
    };
  }

  private createBudgetDecision(id: string, context: Record<string, any>): TravelDecisionNode {
    return {
      id,
      decision_type: 'accommodation',
      options: [
        {
          id: 'reduce_accommodation',
          name: 'Downgrade accommodation',
          cost: -200,
          time_required: 45,
          satisfaction_score: 0.6,
          constraints_met: ['budget'],
          trade_offs: { comfort: 'Reduced', savings: 'Significant' }
        },
        {
          id: 'reduce_activities',
          name: 'Cut optional activities',
          cost: -150,
          time_required: 30,
          satisfaction_score: 0.7,
          constraints_met: ['budget'],
          trade_offs: { experiences: 'Fewer', schedule: 'More relaxed' }
        },
        {
          id: 'extend_budget',
          name: 'Increase travel budget',
          cost: context.budget_increase || 300,
          time_required: 0,
          satisfaction_score: 0.9,
          constraints_met: ['preferences'],
          trade_offs: { cost: 'Higher', satisfaction: 'Maintained' }
        }
      ],
      reasoning: 'Budget constraint requires balancing cost savings with experience quality',
      confidence: 0.85,
      dependencies: ['financial_flexibility', 'priority_preferences']
    };
  }

  private createTimingDecision(id: string, context: Record<string, any>): TravelDecisionNode {
    return {
      id,
      decision_type: 'timing',
      options: [
        {
          id: 'compress_schedule',
          name: 'Tighter schedule',
          cost: 0,
          time_required: 0,
          satisfaction_score: 0.6,
          constraints_met: ['timing'],
          trade_offs: { pace: 'Faster', stress: 'Higher' }
        },
        {
          id: 'prioritize_activities',
          name: 'Focus on top priorities',
          cost: -50,
          time_required: 0,
          satisfaction_score: 0.8,
          constraints_met: ['timing', 'preferences'],
          trade_offs: { variety: 'Reduced', quality: 'Enhanced' }
        },
        {
          id: 'extend_trip',
          name: 'Add extra day',
          cost: 200,
          time_required: 1440, // 24 hours in minutes
          satisfaction_score: 0.9,
          constraints_met: ['preferences'],
          trade_offs: { cost: 'Increased', schedule: 'Relaxed' }
        }
      ],
      reasoning: 'Timing constraints require optimizing schedule density vs. experience quality',
      confidence: 0.75,
      dependencies: ['schedule_flexibility', 'activity_priorities']
    };
  }

  private createPreferenceDecision(id: string, context: Record<string, any>): TravelDecisionNode {
    return {
      id,
      decision_type: 'activities',
      options: [
        {
          id: 'compromise_solution',
          name: 'Balanced compromise',
          cost: context.average_cost || 100,
          time_required: 180,
          satisfaction_score: 0.75,
          constraints_met: ['budget', 'timing'],
          trade_offs: { satisfaction: 'Moderate', balance: 'Good' }
        },
        {
          id: 'preference_priority',
          name: 'Prioritize main preference',
          cost: context.preferred_cost || 150,
          time_required: 240,
          satisfaction_score: 0.9,
          constraints_met: ['preferences'],
          trade_offs: { cost: 'Higher', satisfaction: 'High' }
        },
        {
          id: 'alternative_experience',
          name: 'Similar alternative',
          cost: context.alternative_cost || 80,
          time_required: 120,
          satisfaction_score: 0.65,
          constraints_met: ['budget'],
          trade_offs: { specificity: 'Reduced', value: 'Good' }
        }
      ],
      reasoning: 'Conflicting preferences require prioritization and trade-off analysis',
      confidence: 0.7,
      dependencies: ['preference_priorities', 'flexibility_tolerance']
    };
  }

  // Helper methods for calculations
  private estimateDestinationCost(destination: string): number {
    const costMap: Record<string, number> = {
      'Tokyo': 2500,
      'Paris': 2200,
      'New York': 2000,
      'Bangkok': 1200,
      'Sydney': 1800,
      'London': 2400
    };
    return costMap[destination] || 1500;
  }

  private getOptimalDuration(destination: string): number {
    const durationMap: Record<string, number> = {
      'Tokyo': 7,
      'Paris': 5,
      'New York': 6,
      'Bangkok': 8,
      'Sydney': 6,
      'London': 5
    };
    return durationMap[destination] || 5;
  }

  private calculatePreferenceMatch(destination: string, preferences: Record<string, any>): number {
    // Simulate preference matching logic
    return Math.random() * 0.4 + 0.6; // 0.6-1.0
  }

  private generateDestinationReasoning(destination: string, score: number, pros: string[], cons: string[]): string {
    let reasoning = `${destination} scores ${(score * 100).toFixed(0)}% suitability. `;
    
    if (pros.length > 0) {
      reasoning += `Strengths: ${pros.join(', ')}. `;
    }
    
    if (cons.length > 0) {
      reasoning += `Considerations: ${cons.join(', ')}.`;
    }
    
    return reasoning;
  }

  private async optimizeAccommodation(accommodation: any, constraints: TravelConstraint[]): Promise<any> {
    // Simulate accommodation optimization
    return { ...accommodation, optimized: true, cost_reduction: 0.15 };
  }

  private async optimizeTransportation(transportation: any, constraints: TravelConstraint[]): Promise<any> {
    return { ...transportation, optimized: true, efficiency_gain: 0.20 };
  }

  private async optimizeActivities(activities: any, constraints: TravelConstraint[]): Promise<any> {
    return { ...activities, optimized: true, value_enhancement: 0.10 };
  }

  private async optimizeSchedule(schedule: any, constraints: TravelConstraint[]): Promise<any> {
    return { ...schedule, optimized: true, time_efficiency: 0.25 };
  }

  private async optimizeRouting(routing: any): Promise<any> {
    return { ...routing, optimized: true, travel_time_reduction: 0.18 };
  }

  private async enhanceExperiences(experiences: any): Promise<any> {
    return { ...experiences, enhanced: true, satisfaction_boost: 0.12 };
  }

  private async addPersonalization(personalization: any, constraints: TravelConstraint[]): Promise<any> {
    return { ...personalization, personalized: true, preference_alignment: 0.30 };
  }

  private async identifyImprovements(original: any, optimized: any): Promise<ItineraryOptimization['improvements']> {
    return [
      {
        type: 'cost_reduction',
        description: 'Optimized accommodation and transportation choices',
        impact: 0.15,
        trade_offs: ['Some amenity changes']
      },
      {
        type: 'time_efficiency',
        description: 'Improved routing and schedule optimization',
        impact: 0.20,
        trade_offs: ['More structured schedule']
      },
      {
        type: 'experience_enhancement',
        description: 'Better activity selection and personalization',
        impact: 0.12,
        trade_offs: ['Requires advance booking']
      }
    ];
  }

  private calculateCostSavings(original: any, optimized: any): number {
    return 250; // Simulate cost savings
  }

  private calculateEfficiencyGain(original: any, optimized: any): number {
    return 0.18; // 18% efficiency improvement
  }

  private calculateOptimizationScore(improvements: ItineraryOptimization['improvements']): number {
    const totalImpact = improvements.reduce((sum, imp) => sum + imp.impact, 0);
    return Math.min(totalImpact, 1.0);
  }
}