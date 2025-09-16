import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SolutionFeedback {
  id: string;
  issueType: string;
  issueDescription: string;
  solutionApplied: string;
  success: boolean;
  timeToResolve: number; // in minutes
  adminFeedback?: 'helpful' | 'not_helpful' | 'partially_helpful';
  additionalNotes?: string;
  createdAt: Date;
  adminId?: string;
}

interface KnowledgeEntry {
  id: string;
  issuePattern: string;
  successfulSolutions: string[];
  successRate: number;
  avgResolutionTime: number;
  commonCauses: string[];
  preventiveMeasures: string[];
  lastUpdated: Date;
  usageCount: number;
}

interface LearningInsights {
  mostCommonIssues: Array<{ issue: string; frequency: number }>;
  mostEffectiveSolutions: Array<{ solution: string; successRate: number }>;
  improvingTrends: Array<{ issue: string; improvement: number }>;
  recommendedActions: string[];
}

export const useLearningSystem = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [insights, setInsights] = useState<LearningInsights | null>(null);

  const logSolutionFeedback = useCallback(async (feedback: Omit<SolutionFeedback, 'id' | 'createdAt'>) => {
    try {
      // Log to system logs for now until dedicated tables are created
      const { error } = await supabase.functions.invoke('log-system-event', {
        body: {
          correlation_id: crypto.randomUUID(),
          service_name: 'learning-system',
          log_level: 'info',
          message: `Solution feedback: ${feedback.issueType}`,
          metadata: feedback
        }
      });

      if (error) throw error;

      // Update local knowledge base
      await updateKnowledgeBase(feedback);
      
      return { success: true, id: crypto.randomUUID() };
    } catch (error) {
      console.error('Failed to log solution feedback:', error);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const updateKnowledgeBase = useCallback(async (feedback: Omit<SolutionFeedback, 'id' | 'createdAt'>) => {
    setIsLearning(true);
    
    try {
      // Check if we have an existing knowledge entry for this issue pattern
      const existingEntry = knowledgeBase.find(entry => 
        entry.issuePattern.toLowerCase().includes(feedback.issueType.toLowerCase()) ||
        feedback.issueDescription.toLowerCase().includes(entry.issuePattern.toLowerCase())
      );

      if (existingEntry) {
        // Update existing entry
        const updatedEntry: KnowledgeEntry = {
          ...existingEntry,
          usageCount: existingEntry.usageCount + 1,
          lastUpdated: new Date()
        };

        if (feedback.success) {
          // Add successful solution if not already present
          if (!updatedEntry.successfulSolutions.includes(feedback.solutionApplied)) {
            updatedEntry.successfulSolutions.push(feedback.solutionApplied);
          }
          
          // Recalculate success rate
          const totalAttempts = await getTotalAttempts(feedback.issueType);
          const successfulAttempts = await getSuccessfulAttempts(feedback.issueType);
          updatedEntry.successRate = (successfulAttempts / totalAttempts) * 100;
          
          // Update average resolution time
          updatedEntry.avgResolutionTime = await getAverageResolutionTime(feedback.issueType);
        }

        // Update knowledge base
        setKnowledgeBase(prev => 
          prev.map(entry => entry.id === existingEntry.id ? updatedEntry : entry)
        );

        // Update local knowledge base only for now
        setKnowledgeBase(prev => 
          prev.map(entry => entry.id === existingEntry.id ? updatedEntry : entry)
        );

      } else {
        // Create new knowledge entry locally
        const newEntry: KnowledgeEntry = {
          id: crypto.randomUUID(),
          issuePattern: feedback.issueType,
          successfulSolutions: feedback.success ? [feedback.solutionApplied] : [],
          successRate: feedback.success ? 100 : 0,
          avgResolutionTime: feedback.timeToResolve,
          commonCauses: extractCommonCauses(feedback.issueDescription),
          preventiveMeasures: suggestPreventiveMeasures(feedback.issueType),
          lastUpdated: new Date(),
          usageCount: 1
        };

        setKnowledgeBase(prev => [...prev, newEntry]);
      }
    } catch (error) {
      console.error('Failed to update knowledge base:', error);
    } finally {
      setIsLearning(false);
    }
  }, [knowledgeBase]);

  const getSolutionRecommendations = useCallback((issueDescription: string): string[] => {
    const recommendations: string[] = [];
    
    // Find matching knowledge entries
    const matchingEntries = knowledgeBase.filter(entry => {
      const issueWords = issueDescription.toLowerCase().split(' ');
      const patternWords = entry.issuePattern.toLowerCase().split(' ');
      
      // Simple keyword matching - can be improved with more sophisticated NLP
      return issueWords.some(word => 
        patternWords.some(patternWord => 
          word.includes(patternWord) || patternWord.includes(word)
        )
      );
    });

    // Sort by success rate and usage count
    matchingEntries
      .sort((a, b) => (b.successRate * b.usageCount) - (a.successRate * a.usageCount))
      .forEach(entry => {
        entry.successfulSolutions.forEach(solution => {
          if (!recommendations.includes(solution)) {
            recommendations.push(solution);
          }
        });
      });

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }, [knowledgeBase]);

  const generateInsights = useCallback(async () => {
    try {
      // Generate insights from local knowledge base
      const mostCommonIssues = knowledgeBase
        .map(entry => ({ issue: entry.issuePattern, frequency: entry.usageCount }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      const mostEffectiveSolutions = knowledgeBase
        .flatMap(entry => 
          entry.successfulSolutions.map(solution => ({
            solution,
            successRate: entry.successRate
          }))
        )
        .filter(item => item.successRate > 70)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      const recommendedActions = [
        'Review high-frequency issues for automation opportunities',
        'Update training materials based on effective solutions',
        'Schedule regular knowledge base maintenance'
      ];

      const newInsights: LearningInsights = {
        mostCommonIssues,
        mostEffectiveSolutions,
        improvingTrends: [],
        recommendedActions
      };

      setInsights(newInsights);
      return newInsights;
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return null;
    }
  }, [knowledgeBase]);

  const loadKnowledgeBase = useCallback(async () => {
    try {
      // Initialize with default knowledge base entries
      const defaultEntries: KnowledgeEntry[] = [
        {
          id: '1',
          issuePattern: 'payment_issues',
          successfulSolutions: ['Check Stripe webhooks', 'Restart payment service', 'Verify API keys'],
          successRate: 85,
          avgResolutionTime: 15,
          commonCauses: ['Webhook failures', 'API timeouts', 'Invalid credentials'],
          preventiveMeasures: ['Regular webhook testing', 'Monitor API health'],
          lastUpdated: new Date(),
          usageCount: 12
        },
        {
          id: '2',
          issuePattern: 'booking_failures',
          successfulSolutions: ['Reset provider connections', 'Clear booking cache', 'Check inventory'],
          successRate: 78,
          avgResolutionTime: 22,
          commonCauses: ['Provider timeouts', 'Inventory issues', 'Cache problems'],
          preventiveMeasures: ['Provider monitoring', 'Cache optimization'],
          lastUpdated: new Date(),
          usageCount: 8
        }
      ];

      setKnowledgeBase(defaultEntries);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }, []);

  // Helper functions
  const getTotalAttempts = async (issueType: string): Promise<number> => {
    const entry = knowledgeBase.find(e => e.issuePattern === issueType);
    return entry ? entry.usageCount : 0;
  };

  const getSuccessfulAttempts = async (issueType: string): Promise<number> => {
    const entry = knowledgeBase.find(e => e.issuePattern === issueType);
    return entry ? Math.round(entry.usageCount * (entry.successRate / 100)) : 0;
  };

  const getAverageResolutionTime = async (issueType: string): Promise<number> => {
    const entry = knowledgeBase.find(e => e.issuePattern === issueType);
    return entry ? entry.avgResolutionTime : 0;
  };

  const extractCommonCauses = (description: string): string[] => {
    // Simple keyword extraction - can be improved with NLP
    const causes = [];
    if (description.toLowerCase().includes('timeout')) causes.push('Network timeouts');
    if (description.toLowerCase().includes('connection')) causes.push('Connection issues');
    if (description.toLowerCase().includes('api')) causes.push('API problems');
    if (description.toLowerCase().includes('database')) causes.push('Database issues');
    return causes;
  };

  const suggestPreventiveMeasures = (issueType: string): string[] => {
    const measures: Record<string, string[]> = {
      'payment_issues': [
        'Regular webhook endpoint testing',
        'Payment system monitoring',
        'Backup payment provider setup'
      ],
      'booking_failures': [
        'Provider health monitoring',
        'Timeout configuration optimization',
        'Inventory cache management'
      ],
      'provider_connectivity': [
        'Regular API health checks',
        'Failover provider configuration',
        'Rate limiting optimization'
      ]
    };
    
    return measures[issueType] || ['Regular system monitoring', 'Proactive health checks'];
  };

  const generateRecommendedActions = (feedbackData: any[], knowledgeBase: KnowledgeEntry[]): string[] => {
    const actions = [];
    
    // Analyze patterns and suggest improvements
    const failurePatterns = feedbackData.filter(f => !f.success);
    if (failurePatterns.length > feedbackData.length * 0.3) {
      actions.push('Review and update troubleshooting procedures');
    }
    
    if (knowledgeBase.some(entry => entry.usageCount > 10 && entry.successRate < 70)) {
      actions.push('Investigate frequently failing solution patterns');
    }
    
    actions.push('Schedule monthly knowledge base review');
    actions.push('Update admin training based on common issues');
    
    return actions;
  };

  useEffect(() => {
    loadKnowledgeBase();
  }, [loadKnowledgeBase]);

  return {
    knowledgeBase,
    insights,
    isLearning,
    logSolutionFeedback,
    getSolutionRecommendations,
    generateInsights,
    loadKnowledgeBase
  };
};