import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

export interface CrossModuleContext {
  destination?: string;
  dates?: {
    checkIn: Date;
    checkOut?: Date;
  };
  travelers?: {
    adults: number;
    children: number;
  };
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  preferences?: {
    categories?: string[];
    accessibility?: string[];
    dietary?: string[];
  };
  searchHistory?: any[];
  userSegment?: string;
  sessionId?: string;
}

export interface ModuleData {
  moduleType: 'flight' | 'hotel' | 'activity';
  lastSearched?: Date;
  results?: any[];
  selectedItems?: any[];
  searchParams?: any;
  userInteractions?: any[];
}

export class CrossModuleContextManager {
  private static instance: CrossModuleContextManager;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): CrossModuleContextManager {
    if (!CrossModuleContextManager.instance) {
      CrossModuleContextManager.instance = new CrossModuleContextManager();
    }
    return CrossModuleContextManager.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store context data for cross-module sharing
   */
  async setModuleContext(
    moduleType: 'flight' | 'hotel' | 'activity',
    contextData: CrossModuleContext,
    moduleData: ModuleData
  ): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + (2 * 60 * 60 * 1000)); // 2 hours

      const { error } = await supabase
        .from('cross_module_context')
        .upsert({
          user_session_id: this.sessionId,
          module_type: moduleType,
          context_data: contextData as any,
          shared_parameters: {
            ...moduleData,
            lastUpdated: new Date().toISOString()
          } as any,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        logger.error('Context storage error:', error);
        return false;
      }

      // Trigger context synchronization for other modules
      await this.synchronizeContextAcrossModules(moduleType, contextData);

      return true;
    } catch (error) {
      logger.error('Set module context error:', error);
      return false;
    }
  }

  /**
   * Get context data from other modules
   */
  async getModuleContext(
    currentModule: 'flight' | 'hotel' | 'activity'
  ): Promise<{ context: CrossModuleContext; modules: ModuleData[] } | null> {
    try {
      const { data, error } = await supabase
        .from('cross_module_context')
        .select('*')
        .eq('user_session_id', this.sessionId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Context retrieval error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Merge context data from all modules
      const mergedContext = this.mergeContextData(data.map(d => d.context_data as CrossModuleContext));
      const moduleData = data.map(d => ({
        moduleType: d.module_type,
        ...(d.shared_parameters as any)
      }));

      return {
        context: mergedContext,
        modules: moduleData
      };
    } catch (error) {
      logger.error('Get module context error:', error);
      return null;
    }
  }

  /**
   * Merge context data from different modules intelligently
   */
  private mergeContextData(contextArray: CrossModuleContext[]): CrossModuleContext {
    const merged: CrossModuleContext = {};

    contextArray.forEach(context => {
      // Destination - use most recent non-empty value
      if (context.destination && !merged.destination) {
        merged.destination = context.destination;
      }

      // Dates - use most recent dates
      if (context.dates && (!merged.dates || 
          new Date(context.dates.checkIn) > new Date(merged.dates.checkIn))) {
        merged.dates = context.dates;
      }

      // Travelers - use most recent count
      if (context.travelers && !merged.travelers) {
        merged.travelers = context.travelers;
      }

      // Budget - merge min/max intelligently
      if (context.budget) {
        if (!merged.budget) {
          merged.budget = context.budget;
        } else {
          merged.budget = {
            min: Math.min(merged.budget.min, context.budget.min),
            max: Math.max(merged.budget.max, context.budget.max),
            currency: context.budget.currency || merged.budget.currency
          };
        }
      }

      // Preferences - merge arrays
      if (context.preferences) {
        if (!merged.preferences) {
          merged.preferences = context.preferences;
        } else {
          merged.preferences = {
            categories: [
              ...(merged.preferences.categories || []),
              ...(context.preferences.categories || [])
            ].filter((item, index, arr) => arr.indexOf(item) === index),
            accessibility: [
              ...(merged.preferences.accessibility || []),
              ...(context.preferences.accessibility || [])
            ].filter((item, index, arr) => arr.indexOf(item) === index),
            dietary: [
              ...(merged.preferences.dietary || []),
              ...(context.preferences.dietary || [])
            ].filter((item, index, arr) => arr.indexOf(item) === index)
          };
        }
      }

      // Session ID and user segment
      if (context.sessionId) merged.sessionId = context.sessionId;
      if (context.userSegment) merged.userSegment = context.userSegment;
    });

    return merged;
  }

  /**
   * Synchronize context across modules to enable smart prefetching
   */
  private async synchronizeContextAcrossModules(
    sourceModule: 'flight' | 'hotel' | 'activity',
    context: CrossModuleContext
  ): Promise<void> {
    try {
      // Generate predictive search parameters for other modules
      const predictions = this.generateCrossModulePredictions(sourceModule, context);

      // Store predictions for intelligent prefetching
      for (const prediction of predictions) {
        await this.storePredictiveContext(prediction);
      }
    } catch (error) {
      logger.error('Context synchronization error:', error);
    }
  }

  /**
   * Generate smart predictions for other modules based on current context
   */
  private generateCrossModulePredictions(
    sourceModule: 'flight' | 'hotel' | 'activity',
    context: CrossModuleContext
  ): Array<{ module: string; params: any; confidence: number }> {
    const predictions: Array<{ module: string; params: any; confidence: number }> = [];

    if (!context.destination || !context.dates) {
      return predictions;
    }

    const destination = context.destination;
    const checkIn = context.dates.checkIn;
    const checkOut = context.dates.checkOut || checkIn;
    const travelers = context.travelers || { adults: 1, children: 0 };

    switch (sourceModule) {
      case 'flight':
        // Predict hotel searches
        predictions.push({
          module: 'hotel',
          params: {
            destination,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            adults: travelers.adults,
            children: travelers.children,
            rooms: Math.ceil((travelers.adults + travelers.children) / 2)
          },
          confidence: 0.85
        });

        // Predict activity searches
        predictions.push({
          module: 'activity',
          params: {
            destination,
            date: checkIn,
            participants: travelers.adults + travelers.children
          },
          confidence: 0.75
        });
        break;

      case 'hotel':
        // Predict activity searches for the same location
        predictions.push({
          module: 'activity',
          params: {
            destination,
            date: checkIn,
            participants: travelers.adults + travelers.children
          },
          confidence: 0.90
        });
        break;

      case 'activity':
        // Predict hotel searches if no accommodation context exists
        predictions.push({
          module: 'hotel',
          params: {
            destination,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            adults: travelers.adults,
            children: travelers.children,
            rooms: 1
          },
          confidence: 0.70
        });
        break;
    }

    return predictions;
  }

  /**
   * Store predictive context for intelligent prefetching
   */
  private async storePredictiveContext(prediction: {
    module: string;
    params: any;
    confidence: number;
  }): Promise<void> {
    try {
      // This could be used by cache warming or predictive loading systems
      const { error } = await supabase
        .from('search_pattern_intelligence')
        .upsert({
          pattern_type: 'booking_behavior',
          pattern_data: {
            predictedModule: prediction.module,
            predictedParams: prediction.params,
            sourceContext: this.sessionId,
            predictionTime: new Date().toISOString()
          },
          confidence_score: prediction.confidence,
          usage_frequency: 1
        });

      if (error) {
        logger.warn('Predictive context storage error:', error);
      }
    } catch (error) {
      logger.warn('Store predictive context error:', error);
    }
  }

  /**
   * Get smart suggestions based on cross-module context
   */
  async getSmartSuggestions(
    currentModule: 'flight' | 'hotel' | 'activity'
  ): Promise<Array<{ type: string; suggestion: string; confidence: number }>> {
    const suggestions: Array<{ type: string; suggestion: string; confidence: number }> = [];

    try {
      const contextData = await this.getModuleContext(currentModule);
      
      if (!contextData) {
        return suggestions;
      }

      const { context } = contextData;

      // Generate context-aware suggestions
      if (context.destination) {
        suggestions.push({
          type: 'destination_insight',
          suggestion: `Based on your interest in ${context.destination}, consider exploring nearby attractions`,
          confidence: 0.75
        });
      }

      if (context.budget) {
        suggestions.push({
          type: 'budget_optimization',
          suggestion: `Your budget range suggests premium options. Consider bundle deals for better value`,
          confidence: 0.80
        });
      }

      if (context.preferences?.categories) {
        suggestions.push({
          type: 'preference_match',
          suggestion: `We found ${context.preferences.categories.length} preference matches for personalized recommendations`,
          confidence: 0.85
        });
      }

      return suggestions;
    } catch (error) {
      logger.error('Smart suggestions error:', error);
      return suggestions;
    }
  }

  /**
   * Clean up expired context data
   */
  async cleanupExpiredContext(): Promise<void> {
    try {
      const { error } = await supabase
        .from('cross_module_context')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Context cleanup error:', error);
      }
    } catch (error) {
      logger.error('Cleanup expired context error:', error);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Reset session (for new user sessions)
   */
  resetSession(): void {
    this.sessionId = this.generateSessionId();
  }
}

export const crossModuleContextManager = CrossModuleContextManager.getInstance();