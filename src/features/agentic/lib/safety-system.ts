import { supabase } from "@/integrations/supabase/client";

export interface SafetyValidationRequest {
  agentId: string;
  requestId: string;
  validationType: 'content' | 'bias' | 'ethics' | 'privacy' | 'factual';
  inputContent: Record<string, any>;
  outputContent?: Record<string, any>;
}

export interface SafetyViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export class SafetySystem {
  private readonly safetyRules = {
    content: {
      maxLength: 10000,
      prohibitedKeywords: ['harmful', 'illegal', 'dangerous'],
      requiredDisclaimer: true
    },
    bias: {
      checkGender: true,
      checkRace: true,
      checkAge: true
    },
    ethics: {
      respectHumanAutonomy: true,
      avoidHarm: true,
      fairness: true
    },
    privacy: {
      checkPII: true,
      dataMinimization: true
    }
  };

  async validateRequest(request: SafetyValidationRequest): Promise<{
    safe: boolean;
    score: number;
    violations: SafetyViolation[];
    actionTaken: string;
  }> {
    const violations: SafetyViolation[] = [];
    
    try {
      // Content validation
      if (request.validationType === 'content' || request.validationType === 'bias') {
        const contentViolations = await this.validateContent(request.inputContent);
        violations.push(...contentViolations);
      }

      // Bias detection
      if (request.validationType === 'bias') {
        const biasViolations = await this.detectBias(request.inputContent);
        violations.push(...biasViolations);
      }

      // Privacy check
      if (request.validationType === 'privacy') {
        const privacyViolations = await this.checkPrivacy(request.inputContent);
        violations.push(...privacyViolations);
      }

      // Ethics validation
      if (request.validationType === 'ethics') {
        const ethicsViolations = await this.validateEthics(request.inputContent);
        violations.push(...ethicsViolations);
      }

      // Calculate safety score
      const score = this.calculateSafetyScore(violations);
      const safe = score >= 0.7; // Threshold for safety
      
      // Determine action
      const actionTaken = this.determineAction(violations, score);
      
      // Log the validation
      await this.logSafetyValidation(request, score, violations, actionTaken);

      return {
        safe,
        score,
        violations,
        actionTaken
      };
    } catch (error) {
      console.error('Safety validation error:', error);
      return {
        safe: false,
        score: 0,
        violations: [{ 
          type: 'system_error', 
          severity: 'high', 
          description: 'Safety validation failed',
          recommendation: 'Retry validation or escalate to human review'
        }],
        actionTaken: 'block'
      };
    }
  }

  private async validateContent(content: Record<string, any>): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = [];
    const text = JSON.stringify(content).toLowerCase();

    // Check length
    if (text.length > this.safetyRules.content.maxLength) {
      violations.push({
        type: 'excessive_length',
        severity: 'medium',
        description: 'Content exceeds maximum length limit',
        recommendation: 'Truncate content or split into smaller parts'
      });
    }

    // Check prohibited keywords
    this.safetyRules.content.prohibitedKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        violations.push({
          type: 'prohibited_content',
          severity: 'high',
          description: `Contains prohibited keyword: ${keyword}`,
          recommendation: 'Remove or rephrase problematic content'
        });
      }
    });

    return violations;
  }

  private async detectBias(content: Record<string, any>): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = [];
    const text = JSON.stringify(content).toLowerCase();

    // Simple bias detection (in production, use more sophisticated ML models)
    const biasPatterns = {
      gender: ['he should', 'she should', 'men are', 'women are'],
      racial: ['people from', 'those people', 'they always'],
      age: ['too old', 'too young', 'millennials are', 'boomers are']
    };

    Object.entries(biasPatterns).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          violations.push({
            type: `${type}_bias`,
            severity: 'medium',
            description: `Potential ${type} bias detected`,
            recommendation: 'Review language for inclusive alternatives'
          });
        }
      });
    });

    return violations;
  }

  private async checkPrivacy(content: Record<string, any>): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = [];
    const text = JSON.stringify(content);

    // Check for PII patterns
    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}-\d{3}-\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g
    };

    Object.entries(piiPatterns).forEach(([type, pattern]) => {
      if (pattern.test(text)) {
        violations.push({
          type: `pii_${type}`,
          severity: 'high',
          description: `Potential ${type} information detected`,
          recommendation: 'Remove or mask personal information'
        });
      }
    });

    return violations;
  }

  private async validateEthics(content: Record<string, any>): Promise<SafetyViolation[]> {
    const violations: SafetyViolation[] = [];
    const text = JSON.stringify(content).toLowerCase();

    // Check for unethical content patterns
    const unethicalPatterns = [
      'manipulate', 'deceive', 'lie to', 'trick', 'exploit'
    ];

    unethicalPatterns.forEach(pattern => {
      if (text.includes(pattern)) {
        violations.push({
          type: 'ethical_concern',
          severity: 'high',
          description: `Potential ethical violation: ${pattern}`,
          recommendation: 'Review content for ethical considerations'
        });
      }
    });

    return violations;
  }

  private calculateSafetyScore(violations: SafetyViolation[]): number {
    if (violations.length === 0) return 1.0;

    const severityWeights = {
      low: 0.1,
      medium: 0.3,
      high: 0.6,
      critical: 1.0
    };

    const totalDeduction = violations.reduce((sum, violation) => {
      return sum + severityWeights[violation.severity];
    }, 0);

    return Math.max(0, 1.0 - (totalDeduction / violations.length));
  }

  private determineAction(violations: SafetyViolation[], score: number): string {
    if (score < 0.3) return 'block';
    if (score < 0.7) return 'flag_for_review';
    if (violations.some(v => v.severity === 'critical')) return 'escalate_to_human';
    return 'allow';
  }

  private async logSafetyValidation(
    request: SafetyValidationRequest,
    score: number,
    violations: SafetyViolation[],
    action: string
  ): Promise<void> {
    try {
      await supabase
        .from('agent_safety_logs')
        .insert({
          agent_id: request.agentId,
          request_id: request.requestId,
          validation_type: request.validationType,
          input_content: request.inputContent,
          output_content: request.outputContent,
          safety_score: score,
          violations: violations,
          action_taken: action,
          escalated_to_human: action === 'escalate_to_human'
        });
    } catch (error) {
      console.error('Safety log error:', error);
    }
  }

  async getSafetyReport(agentId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalValidations: number;
    averageScore: number;
    violationBreakdown: Record<string, number>;
    recommendations: string[];
  }> {
    try {
      const timeFilter = new Date();
      timeFilter.setDate(timeFilter.getDate() - (timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30));

      const { data: logs } = await supabase
        .from('agent_safety_logs')
        .select('*')
        .eq('agent_id', agentId)
        .gte('created_at', timeFilter.toISOString());

      if (!logs || logs.length === 0) {
        return {
          totalValidations: 0,
          averageScore: 1.0,
          violationBreakdown: {},
          recommendations: ['No safety data available for this timeframe']
        };
      }

      const averageScore = logs.reduce((sum, log) => sum + log.safety_score, 0) / logs.length;
      
      const violationBreakdown: Record<string, number> = {};
      logs.forEach(log => {
        if (log.violations && Array.isArray(log.violations)) {
          log.violations.forEach((violation: any) => {
            violationBreakdown[violation.type] = (violationBreakdown[violation.type] || 0) + 1;
          });
        }
      });

      const recommendations = this.generateSafetyRecommendations(averageScore, violationBreakdown);

      return {
        totalValidations: logs.length,
        averageScore,
        violationBreakdown,
        recommendations
      };
    } catch (error) {
      console.error('Safety report error:', error);
      return {
        totalValidations: 0,
        averageScore: 1.0,
        violationBreakdown: {},
        recommendations: ['Error generating safety report']
      };
    }
  }

  private generateSafetyRecommendations(score: number, violations: Record<string, number>): string[] {
    const recommendations: string[] = [];

    if (score < 0.8) {
      recommendations.push('Overall safety score is below optimal - review content guidelines');
    }

    const topViolations = Object.entries(violations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    topViolations.forEach(([type, count]) => {
      if (count > 5) {
        recommendations.push(`Address frequent ${type} violations (${count} occurrences)`);
      }
    });

    if (violations.pii_email || violations.pii_phone) {
      recommendations.push('Implement stronger PII detection and masking');
    }

    if (violations.ethical_concern) {
      recommendations.push('Review ethical guidelines and content policies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Safety performance is excellent - maintain current standards');
    }

    return recommendations;
  }
}