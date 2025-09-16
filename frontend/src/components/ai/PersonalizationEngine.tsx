import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  User, 
  Eye, 
  Heart, 
  MapPin, 
  Clock, 
  DollarSign,
  Smartphone,
  Calendar,
  TrendingUp,
  Target,
  Sparkles,
  Settings
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { analyticsAPI } from '@/lib/otaDataClient';
import logger from "@/utils/logger";

interface UserPersona {
  id: string;
  name: string;
  confidence: number;
  traits: Array<{
    trait: string;
    score: number;
    description: string;
  }>;
  preferences: {
    travelStyle: string;
    budgetRange: string;
    tripDuration: string;
    seasonality: string[];
  };
  behaviors: {
    bookingWindow: number;
    priceMonitoring: boolean;
    loyaltyPrograms: string[];
    socialInfluence: number;
  };
}

interface ContextualInsight {
  context: string;
  insight: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendations: string[];
}

interface BehavioralPattern {
  pattern: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  predictedNext: string;
  confidence: number;
}

interface PersonalizationEngineProps {
  userId?: string;
  className?: string;
}

export const PersonalizationEngine: React.FC<PersonalizationEngineProps> = ({
  userId,
  className = ""
}) => {
  const [userPersona, setUserPersona] = useState<UserPersona | null>(null);
  const [contextualInsights, setContextualInsights] = useState<ContextualInsight[]>([]);
  const [behavioralPatterns, setBehavioralPatterns] = useState<BehavioralPattern[]>([]);
  const [learning, setLearning] = useState(false);
  const [modelAccuracy, setModelAccuracy] = useState(87.3);
  const [dataPoints, setDataPoints] = useState(1247);
  const { user } = useAuth();

  useEffect(() => {
    initializePersonalizationEngine();
  }, [user]);

  const initializePersonalizationEngine = async () => {
    setLearning(true);
    try {
      await Promise.all([
        buildUserPersona(),
        generateContextualInsights(),
        analyzeBehavioralPatterns(),
        updateModelMetrics()
      ]);
    } catch (error) {
      logger.error('Failed to initialize personalization engine:', error);
    } finally {
      setLearning(false);
    }
  };

  const buildUserPersona = async () => {
    if (!user) return;
    
    try {
      // In production, this would use ML algorithms to build user persona
      const persona: UserPersona = {
        id: 'persona-1',
        name: 'Adventure Seeker',
        confidence: 89.2,
        traits: [
          {
            trait: 'Spontaneity',
            score: 78,
            description: 'Enjoys last-minute bookings and flexible plans'
          },
          {
            trait: 'Value Consciousness',
            score: 85,
            description: 'Actively seeks deals and compares prices'
          },
          {
            trait: 'Experience Focus',
            score: 92,
            description: 'Prioritizes unique experiences over luxury amenities'
          },
          {
            trait: 'Social Influence',
            score: 65,
            description: 'Moderately influenced by reviews and recommendations'
          },
          {
            trait: 'Tech Savvy',
            score: 88,
            description: 'Comfortable with mobile booking and digital tools'
          }
        ],
        preferences: {
          travelStyle: 'Adventure & Culture',
          budgetRange: 'Mid-range ($150-300/day)',
          tripDuration: 'Short (3-7 days)',
          seasonality: ['Spring', 'Autumn']
        },
        behaviors: {
          bookingWindow: 21, // days in advance
          priceMonitoring: true,
          loyaltyPrograms: ['Qantas Frequent Flyer', 'Hilton Honors'],
          socialInfluence: 72 // percentage
        }
      };
      
      setUserPersona(persona);
    } catch (error) {
      logger.error('Error building user persona:', error);
    }
  };

  const generateContextualInsights = async () => {
    const insights: ContextualInsight[] = [
      {
        context: 'Time-based Behavior',
        insight: 'You typically browse travel options on Sunday evenings between 7-9 PM',
        confidence: 94,
        impact: 'high',
        recommendations: [
          'Send personalized deals on Sunday afternoons',
          'Optimize mobile experience for evening browsing',
          'Highlight weekend getaway options'
        ]
      },
      {
        context: 'Seasonal Patterns',
        insight: 'Spring bookings correlate with 65% increase in cultural activity searches',
        confidence: 87,
        impact: 'medium',
        recommendations: [
          'Promote museum passes and cultural tours in spring campaigns',
          'Bundle accommodation with cultural experiences',
          'Feature local festivals and events'
        ]
      },
      {
        context: 'Price Sensitivity',
        insight: 'Price drops of 20%+ trigger immediate booking behavior',
        confidence: 91,
        impact: 'high',
        recommendations: [
          'Set price alerts at 18% threshold',
          'Create urgency with limited-time offers',
          'Highlight savings clearly in communications'
        ]
      },
      {
        context: 'Device Usage',
        insight: 'Mobile browsing for inspiration, desktop for final booking',
        confidence: 83,
        impact: 'medium',
        recommendations: [
          'Optimize mobile for discovery and wishlist features',
          'Ensure seamless cross-device sync',
          'Simplify checkout process on desktop'
        ]
      },
      {
        context: 'Social Proof',
        insight: 'Reviews from similar traveler profiles have 3x more influence',
        confidence: 79,
        impact: 'medium',
        recommendations: [
          'Highlight reviews from adventure travelers',
          'Show traveler similarity indicators',
          'Feature user-generated content from similar personas'
        ]
      }
    ];
    
    setContextualInsights(insights);
  };

  const analyzeBehavioralPatterns = async () => {
    const patterns: BehavioralPattern[] = [
      {
        pattern: 'Weekend getaway planning',
        frequency: 2.3, // times per month
        trend: 'increasing',
        predictedNext: 'Next weekend search likely Thursday evening',
        confidence: 88
      },
      {
        pattern: 'Price comparison behavior',
        frequency: 4.7, // comparisons per booking
        trend: 'stable',
        predictedNext: 'Will check 3-5 alternatives before booking',
        confidence: 92
      },
      {
        pattern: 'Mobile app usage',
        frequency: 12.4, // sessions per week
        trend: 'increasing',
        predictedNext: 'Evening browsing sessions expected',
        confidence: 85
      },
      {
        pattern: 'Review reading behavior',
        frequency: 8.2, // reviews read per property
        trend: 'stable',
        predictedNext: 'Will focus on recent and negative reviews',
        confidence: 81
      },
      {
        pattern: 'Loyalty program engagement',
        frequency: 1.8, // interactions per month
        trend: 'decreasing',
        predictedNext: 'May need re-engagement campaign',
        confidence: 76
      }
    ];
    
    setBehavioralPatterns(patterns);
  };

  const updateModelMetrics = async () => {
    // Simulate continuous learning and model improvement
    const accuracy = 87.3 + (Math.random() * 4 - 2); // ±2% variation
    const points = 1247 + Math.floor(Math.random() * 50); // Add new data points
    
    setModelAccuracy(Number(accuracy.toFixed(1)));
    setDataPoints(points);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-3 w-3" />;
      case 'decreasing': return <TrendingUp className="h-3 w-3 rotate-180" />;
      case 'stable': return <div className="w-3 h-0.5 bg-current rounded" />;
      default: return <div className="w-3 h-0.5 bg-current rounded" />;
    }
  };

  if (learning) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="animate-pulse">
                <Brain className="h-6 w-6 text-travel-gold" />
              </div>
              <span>Learning your preferences...</span>
            </div>
            <Progress value={73} className="w-full" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Analyzing behavioral patterns</div>
              <div>Building persona model</div>
              <div>Processing contextual data</div>
              <div>Generating insights</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Engine Status */}
      <Card className="bg-gradient-to-r from-travel-gold/5 to-travel-coral/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-travel-gold" />
            Personalization Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-travel-gold">{modelAccuracy}%</div>
              <div className="text-sm text-muted-foreground">Model Accuracy</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-travel-coral">{dataPoints}</div>
              <div className="text-sm text-muted-foreground">Data Points</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-travel-ocean">{contextualInsights.length}</div>
              <div className="text-sm text-muted-foreground">Active Insights</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-travel-forest">{behavioralPatterns.length}</div>
              <div className="text-sm text-muted-foreground">Behavior Patterns</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="persona" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="persona" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Persona
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Contextual Insights
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Behavior Patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="space-y-4">
          {userPersona && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-travel-gold" />
                    {userPersona.name}
                  </CardTitle>
                  <Badge className="bg-travel-gold/20 text-travel-gold">
                    {userPersona.confidence}% Confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personality Traits */}
                <div>
                  <h3 className="font-semibold mb-3">Personality Traits</h3>
                  <div className="space-y-3">
                    {userPersona.traits.map((trait, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{trait.trait}</span>
                          <span className="text-sm text-muted-foreground">{trait.score}%</span>
                        </div>
                        <Progress value={trait.score} className="h-2" />
                        <p className="text-xs text-muted-foreground">{trait.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferences & Behaviors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Travel Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-travel-coral" />
                        <span className="text-sm">
                          <strong>Style:</strong> {userPersona.preferences.travelStyle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-travel-gold" />
                        <span className="text-sm">
                          <strong>Budget:</strong> {userPersona.preferences.budgetRange}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-travel-ocean" />
                        <span className="text-sm">
                          <strong>Duration:</strong> {userPersona.preferences.tripDuration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-travel-forest" />
                        <span className="text-sm">
                          <strong>Seasons:</strong> {userPersona.preferences.seasonality.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Booking Behaviors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-travel-coral" />
                        <span className="text-sm">
                          <strong>Advance Booking:</strong> {userPersona.behaviors.bookingWindow} days
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-travel-gold" />
                        <span className="text-sm">
                          <strong>Price Monitoring:</strong> {userPersona.behaviors.priceMonitoring ? 'Active' : 'Passive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-travel-ocean" />
                        <span className="text-sm">
                          <strong>Loyalty Programs:</strong> {userPersona.behaviors.loyaltyPrograms.length} active
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-travel-forest" />
                        <span className="text-sm">
                          <strong>Social Influence:</strong> {userPersona.behaviors.socialInfluence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {contextualInsights.map((insight, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{insight.context}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{insight.insight}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact} impact
                    </Badge>
                    <Badge variant="outline">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {insight.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-travel-gold mt-2 flex-shrink-0"></div>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {behavioralPatterns.map((pattern, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{pattern.pattern}</h3>
                    <p className="text-sm text-muted-foreground">
                      Frequency: {pattern.frequency} {pattern.pattern.includes('per') ? '' : 'times/month'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${getTrendColor(pattern.trend)}`}>
                      {getTrendIcon(pattern.trend)}
                      <span className="text-sm font-medium capitalize">{pattern.trend}</span>
                    </div>
                    <Badge variant="outline">
                      {pattern.confidence}%
                    </Badge>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Prediction:</h4>
                  <p className="text-sm text-muted-foreground">{pattern.predictedNext}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};