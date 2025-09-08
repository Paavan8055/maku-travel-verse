import { supabase } from "@/integrations/supabase/client";

export interface LearningMetric {
  agentId: string;
  userId?: string;
  metricType: string;
  metricValue: number;
  context: Record<string, any>;
  feedbackScore?: number;
  improvementDelta?: number;
}

export interface HumanFeedback {
  agentId: string;
  userId: string;
  taskId?: string;
  interactionContext: Record<string, any>;
  feedbackType: 'rating' | 'correction' | 'preference' | 'suggestion';
  rating?: number;
  feedbackText?: string;
  improvementSuggestions?: string[];
}

export class LearningSystem {
  async recordMetric(metric: LearningMetric): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_learning_metrics')
        .insert({
          agent_id: metric.agentId,
          user_id: metric.userId,
          metric_type: metric.metricType,
          metric_value: metric.metricValue,
          context: metric.context,
          feedback_score: metric.feedbackScore,
          improvement_delta: metric.improvementDelta
        });

      return !error;
    } catch (error) {
      console.error('Learning metric recording error:', error);
      return false;
    }
  }

  async recordHumanFeedback(feedback: HumanFeedback): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_human_feedback')
        .insert({
          agent_id: feedback.agentId,
          user_id: feedback.userId,
          task_id: feedback.taskId,
          interaction_context: feedback.interactionContext,
          feedback_type: feedback.feedbackType,
          rating: feedback.rating,
          feedback_text: feedback.feedbackText,
          improvement_suggestions: feedback.improvementSuggestions || []
        });

      return !error;
    } catch (error) {
      console.error('Human feedback recording error:', error);
      return false;
    }
  }

  async getLearningInsights(agentId: string, userId?: string): Promise<any> {
    try {
      const { data: metrics } = await supabase
        .from('agent_learning_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', userId || '')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: feedback } = await supabase
        .from('agent_human_feedback')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', userId || '')
        .order('created_at', { ascending: false })
        .limit(50);

      return {
        metrics: metrics || [],
        feedback: feedback || [],
        insights: this.analyzePerformance(metrics || [], feedback || [])
      };
    } catch (error) {
      console.error('Learning insights error:', error);
      return { metrics: [], feedback: [], insights: {} };
    }
  }

  private analyzePerformance(metrics: any[], feedback: any[]): Record<string, any> {
    const insights: Record<string, any> = {
      averageRating: 0,
      improvementTrend: 0,
      commonIssues: [],
      strengths: [],
      recommendations: []
    };

    if (feedback.length > 0) {
      const ratings = feedback
        .filter(f => f.rating)
        .map(f => f.rating);
      
      if (ratings.length > 0) {
        insights.averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      }

      // Analyze feedback text for common themes
      const feedbackTexts = feedback
        .filter(f => f.feedback_text)
        .map(f => f.feedback_text.toLowerCase());
      
      insights.commonIssues = this.extractCommonThemes(feedbackTexts, 'negative');
      insights.strengths = this.extractCommonThemes(feedbackTexts, 'positive');
    }

    if (metrics.length > 1) {
      const recent = metrics.slice(0, 10);
      const older = metrics.slice(-10);
      
      const recentAvg = recent.reduce((sum, m) => sum + m.metric_value, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.metric_value, 0) / older.length;
      
      insights.improvementTrend = ((recentAvg - olderAvg) / olderAvg) * 100;
    }

    // Generate recommendations based on insights
    insights.recommendations = this.generateRecommendations(insights);

    return insights;
  }

  private extractCommonThemes(texts: string[], sentiment: 'positive' | 'negative'): string[] {
    const themes: Record<string, number> = {};
    const keywords = {
      positive: ['good', 'great', 'excellent', 'helpful', 'accurate', 'fast', 'clear'],
      negative: ['slow', 'incorrect', 'confusing', 'unhelpful', 'wrong', 'bad', 'unclear']
    };

    texts.forEach(text => {
      keywords[sentiment].forEach(keyword => {
        if (text.includes(keyword)) {
          themes[keyword] = (themes[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private generateRecommendations(insights: Record<string, any>): string[] {
    const recommendations: string[] = [];

    if (insights.averageRating < 3) {
      recommendations.push('Focus on improving response accuracy and relevance');
    }

    if (insights.improvementTrend < 0) {
      recommendations.push('Performance is declining - review recent changes');
    }

    if (insights.commonIssues.includes('slow')) {
      recommendations.push('Optimize response time and processing efficiency');
    }

    if (insights.commonIssues.includes('confusing')) {
      recommendations.push('Improve clarity and simplicity of responses');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current approach - performance is stable');
    }

    return recommendations;
  }

  async adaptBehavior(agentId: string, adaptationType: string, parameters: Record<string, any>): Promise<boolean> {
    try {
      // This would implement behavioral adaptation based on learning insights
      // For now, we'll record the adaptation request
      await this.recordMetric({
        agentId,
        metricType: 'behavioral_adaptation',
        metricValue: 1,
        context: {
          adaptationType,
          parameters,
          timestamp: new Date().toISOString()
        }
      });

      return true;
    } catch (error) {
      console.error('Behavior adaptation error:', error);
      return false;
    }
  }
}