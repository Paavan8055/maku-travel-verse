export interface RiskFactors {
  amount?: number;
  userAccountAge?: number;
  unusualLocation?: boolean;
  vpnDetected?: boolean;
  newPaymentMethod?: boolean;
  failedPayments?: number;
  rapidBookings?: boolean;
  suspiciousDevice?: boolean;
  timeAnomaly?: boolean;
  velocityAnomaly?: boolean;
  geoAnomaly?: boolean;
}

export interface RiskAssessment {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  recommendations: string[];
}

export class RiskCalculationUtils {
  static calculateFinancialRisk(factors: RiskFactors): RiskAssessment {
    let score = 0;
    const detectedFactors: string[] = [];
    const recommendations: string[] = [];

    // Amount-based risk
    if (factors.amount) {
      if (factors.amount > 10000) {
        score += 30;
        detectedFactors.push('High transaction amount (>$10,000)');
        recommendations.push('Additional identity verification required');
      } else if (factors.amount > 5000) {
        score += 20;
        detectedFactors.push('Elevated transaction amount (>$5,000)');
        recommendations.push('Enhanced monitoring required');
      } else if (factors.amount > 2000) {
        score += 10;
        detectedFactors.push('Above-average transaction amount');
      }
    }

    // User account age risk
    if (factors.userAccountAge !== undefined) {
      if (factors.userAccountAge < 7) {
        score += 25;
        detectedFactors.push('Very new user account (<7 days)');
        recommendations.push('Manual review for new accounts');
      } else if (factors.userAccountAge < 30) {
        score += 15;
        detectedFactors.push('New user account (<30 days)');
        recommendations.push('Enhanced verification for new users');
      } else if (factors.userAccountAge < 90) {
        score += 8;
        detectedFactors.push('Recent user account (<90 days)');
      }
    }

    // Geographic and location risks
    if (factors.unusualLocation) {
      score += 20;
      detectedFactors.push('Unusual geographic location detected');
      recommendations.push('Verify user location and identity');
    }

    if (factors.vpnDetected) {
      score += 15;
      detectedFactors.push('VPN or proxy detected');
      recommendations.push('Additional security verification');
    }

    if (factors.geoAnomaly) {
      score += 18;
      detectedFactors.push('Geographic anomaly in user behavior');
      recommendations.push('Location-based verification required');
    }

    // Payment method risks
    if (factors.newPaymentMethod) {
      score += 15;
      detectedFactors.push('New payment method used');
      recommendations.push('Verify payment method ownership');
    }

    if (factors.failedPayments && factors.failedPayments > 0) {
      const failedScore = Math.min(factors.failedPayments * 8, 25);
      score += failedScore;
      detectedFactors.push(`${factors.failedPayments} failed payment attempts`);
      recommendations.push('Review payment history and method validity');
    }

    // Behavioral anomalies
    if (factors.rapidBookings) {
      score += 20;
      detectedFactors.push('Rapid booking pattern detected');
      recommendations.push('Velocity check and manual review');
    }

    if (factors.velocityAnomaly) {
      score += 22;
      detectedFactors.push('Transaction velocity anomaly');
      recommendations.push('Implement cooling-off period');
    }

    if (factors.suspiciousDevice) {
      score += 12;
      detectedFactors.push('Suspicious device characteristics');
      recommendations.push('Device fingerprinting verification');
    }

    if (factors.timeAnomaly) {
      score += 10;
      detectedFactors.push('Unusual transaction timing');
      recommendations.push('Time-based behavioral analysis');
    }

    // Cap the score at 100
    score = Math.min(score, 100);

    // Determine risk level
    const level = score >= 80 ? 'CRITICAL' :
                  score >= 60 ? 'HIGH' :
                  score >= 40 ? 'MEDIUM' : 'LOW';

    // Add level-specific recommendations
    if (level === 'CRITICAL') {
      recommendations.push('IMMEDIATE ACTION: Block transaction and initiate manual review');
      recommendations.push('Contact fraud investigation team');
    } else if (level === 'HIGH') {
      recommendations.push('Require additional verification before proceeding');
      recommendations.push('Flag for priority manual review');
    } else if (level === 'MEDIUM') {
      recommendations.push('Enhanced monitoring and verification');
      recommendations.push('Consider additional security checks');
    }

    return {
      score,
      level,
      factors: detectedFactors,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  static calculateBusinessRisk(factors: {
    supplierReliability?: number;
    marketVolatility?: number;
    seasonalDemand?: number;
    competitorActivity?: number;
    regulatoryChanges?: boolean;
    economicIndicators?: number;
  }): RiskAssessment {
    let score = 0;
    const detectedFactors: string[] = [];
    const recommendations: string[] = [];

    if (factors.supplierReliability !== undefined) {
      const reliabilityRisk = (100 - factors.supplierReliability) * 0.3;
      score += reliabilityRisk;
      if (reliabilityRisk > 20) {
        detectedFactors.push('Low supplier reliability score');
        recommendations.push('Diversify supplier portfolio');
      }
    }

    if (factors.marketVolatility !== undefined && factors.marketVolatility > 70) {
      score += 25;
      detectedFactors.push('High market volatility detected');
      recommendations.push('Implement dynamic pricing strategies');
    }

    if (factors.seasonalDemand !== undefined && factors.seasonalDemand < 30) {
      score += 15;
      detectedFactors.push('Low seasonal demand period');
      recommendations.push('Adjust inventory and marketing strategies');
    }

    if (factors.regulatoryChanges) {
      score += 20;
      detectedFactors.push('Regulatory changes affecting business');
      recommendations.push('Review compliance requirements');
    }

    const level = score >= 80 ? 'CRITICAL' :
                  score >= 60 ? 'HIGH' :
                  score >= 40 ? 'MEDIUM' : 'LOW';

    return {
      score: Math.min(score, 100),
      level,
      factors: detectedFactors,
      recommendations
    };
  }

  static combineRiskAssessments(assessments: RiskAssessment[]): RiskAssessment {
    const totalScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0);
    const avgScore = totalScore / assessments.length;
    
    const allFactors = assessments.flatMap(a => a.factors);
    const allRecommendations = [...new Set(assessments.flatMap(a => a.recommendations))];

    const level = avgScore >= 80 ? 'CRITICAL' :
                  avgScore >= 60 ? 'HIGH' :
                  avgScore >= 40 ? 'MEDIUM' : 'LOW';

    return {
      score: Math.round(avgScore),
      level,
      factors: allFactors,
      recommendations: allRecommendations
    };
  }
}