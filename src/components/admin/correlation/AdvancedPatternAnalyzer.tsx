import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  Users, 
  MapPin, 
  Calendar,
  Zap,
  Activity
} from 'lucide-react';

interface PatternInsight {
  id: string;
  pattern_type: string;
  frequency: number;
  impact_score: number;
  description: string;
  recommendations: string[];
  affected_services: string[];
  time_window: string;
  confidence: number;
}

interface CustomerJourneyPattern {
  stage: string;
  conversion_rate: number;
  avg_time_spent: number;
  drop_off_points: string[];
  optimization_opportunities: string[];
}

export const AdvancedPatternAnalyzer = () => {
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [journeyPatterns, setJourneyPatterns] = useState<CustomerJourneyPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);

  const generateAdvancedPatterns = async () => {
    setLoading(true);
    try {
      // Simulate advanced pattern analysis - in production this would use ML models
      const mockPatterns: PatternInsight[] = [
        {
          id: 'pattern_1',
          pattern_type: 'booking_flow_optimization',
          frequency: 847,
          impact_score: 92,
          description: 'Users abandoning bookings at payment stage during peak hours (6-8 PM AEST)',
          recommendations: [
            'Implement express checkout for returning customers',
            'Add payment timeout warnings 2 minutes before expiry',
            'Offer saved payment methods for faster processing'
          ],
          affected_services: ['payment_processor', 'booking_engine'],
          time_window: 'Peak hours 18:00-20:00 AEST',
          confidence: 0.94
        },
        {
          id: 'pattern_2',
          pattern_type: 'provider_performance_correlation',
          frequency: 432,
          impact_score: 78,
          description: 'Amadeus API latency increases 340% during Asian market hours',
          recommendations: [
            'Implement request queuing during high-traffic periods',
            'Consider regional API endpoints for better performance',
            'Add circuit breaker for provider failover at >2s response time'
          ],
          affected_services: ['amadeus_api', 'booking_service'],
          time_window: 'Asian market hours 09:00-17:00 JST',
          confidence: 0.87
        },
        {
          id: 'pattern_3',
          pattern_type: 'revenue_optimization',
          frequency: 256,
          impact_score: 85,
          description: 'Premium customers (>$2000 bookings) prefer mobile completion but start on desktop',
          recommendations: [
            'Implement seamless cross-device booking continuation',
            'Send SMS links for mobile completion',
            'Prioritize mobile UI/UX for high-value bookings'
          ],
          affected_services: ['mobile_app', 'web_platform', 'notification_service'],
          time_window: 'Business hours weekdays',
          confidence: 0.91
        },
        {
          id: 'pattern_4',
          pattern_type: 'customer_behavior_prediction',
          frequency: 189,
          impact_score: 73,
          description: 'Customers searching flights 3+ times likely to book within 48 hours',
          recommendations: [
            'Trigger personalized offers after 3rd search',
            'Implement price alerts for frequent searchers',
            'Show social proof (other customers booking similar trips)'
          ],
          affected_services: ['search_engine', 'marketing_automation', 'pricing_engine'],
          time_window: 'Continuous monitoring',
          confidence: 0.82
        }
      ];

      const mockJourneyPatterns: CustomerJourneyPattern[] = [
        {
          stage: 'Search & Discovery',
          conversion_rate: 34.2,
          avg_time_spent: 4.7,
          drop_off_points: ['Complex search filters', 'No results for specific dates'],
          optimization_opportunities: ['Simplified search interface', 'Flexible date suggestions']
        },
        {
          stage: 'Selection & Comparison',
          conversion_rate: 67.8,
          avg_time_spent: 8.3,
          drop_off_points: ['Too many options', 'Unclear pricing'],
          optimization_opportunities: ['Smart recommendation engine', 'Clear price breakdown']
        },
        {
          stage: 'Booking & Payment',
          conversion_rate: 82.4,
          avg_time_spent: 6.1,
          drop_off_points: ['Payment timeouts', 'Required field errors'],
          optimization_opportunities: ['Extended payment windows', 'Auto-save progress']
        },
        {
          stage: 'Confirmation & Follow-up',
          conversion_rate: 96.7,
          avg_time_spent: 2.1,
          drop_off_points: ['Email delivery issues'],
          optimization_opportunities: ['Multiple confirmation channels', 'SMS backup']
        }
      ];

      setPatterns(mockPatterns);
      setJourneyPatterns(mockJourneyPatterns);
      setLastAnalysis(new Date().toISOString());

      // Log the analysis to correlation tracking
      await supabase.functions.invoke('correlation-data-collector', {
        body: {
          correlation_id: `pattern_analysis_${Date.now()}`,
          request_type: 'advanced_pattern_analysis',
          status: 'completed',
          service_name: 'pattern_analyzer',
          metadata: {
            patterns_identified: mockPatterns.length,
            avg_confidence: mockPatterns.reduce((sum, p) => sum + p.confidence, 0) / mockPatterns.length,
            high_impact_patterns: mockPatterns.filter(p => p.impact_score > 80).length,
            total_frequency: mockPatterns.reduce((sum, p) => sum + p.frequency, 0)
          }
        }
      });

    } catch (error) {
      console.error('Error generating patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 75) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    generateAdvancedPatterns();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Analysis Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Advanced Pattern Analysis
          </h3>
          {lastAnalysis && (
            <p className="text-sm text-muted-foreground mt-1">
              Last analysis: {new Date(lastAnalysis).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
            </p>
          )}
        </div>
        <Button 
          onClick={generateAdvancedPatterns} 
          disabled={loading}
          variant="outline"
        >
          <Zap className={`h-4 w-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {/* Key Patterns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {patterns.map((pattern) => (
          <Card key={pattern.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{pattern.description}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getImpactColor(pattern.impact_score)}>
                    Impact: {pattern.impact_score}
                  </Badge>
                  <Badge variant="outline">
                    <span className={getConfidenceColor(pattern.confidence)}>
                      {(pattern.confidence * 100).toFixed(0)}% confident
                    </span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Frequency</p>
                  <p className="font-medium">{pattern.frequency} occurrences</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time Window</p>
                  <p className="font-medium">{pattern.time_window}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Affected Services
                </p>
                <div className="flex flex-wrap gap-1">
                  {pattern.affected_services.map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Recommendations
                </p>
                <ul className="text-sm space-y-1">
                  {pattern.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer Journey Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Journey Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {journeyPatterns.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">{stage.stage}</h4>
                      <Badge variant="outline" className="text-xs">
                        Step {index + 1}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Conversion Rate</p>
                        <p className="text-xl font-bold text-green-600">
                          {stage.conversion_rate}%
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Time Spent</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stage.avg_time_spent} min
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Drop-off Points</p>
                        <div className="space-y-1">
                          {stage.drop_off_points.map((point, idx) => (
                            <div key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                              {point}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Optimizations</p>
                        <div className="space-y-1">
                          {stage.optimization_opportunities.map((opp, idx) => (
                            <div key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                              {opp}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Arrow between stages */}
                {index < journeyPatterns.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Pattern Detection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Real-time Pattern Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {patterns.length}
              </div>
              <p className="text-sm text-muted-foreground">Active Patterns</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {patterns.filter(p => p.impact_score > 80).length}
              </div>
              <p className="text-sm text-muted-foreground">High Impact</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {patterns.length > 0 ? Math.round(patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};