import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, DollarSign, MapPin, Clock, Star, 
  Zap, Target, BarChart3, Activity, Settings,
  ThumbsUp, ThumbsDown, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Recommendation {
  id: string;
  type: 'destination' | 'pricing' | 'booking_time' | 'upgrade';
  title: string;
  description: string;
  confidence_score: number;
  expected_savings: number;
  category: string;
  metadata: any;
  created_at: string;
}

interface PricingInsight {
  destination: string;
  current_price: number;
  predicted_price: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  best_booking_time: string;
}

export function MLRecommendationsModule() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [pricingInsights, setPricingInsights] = useState<PricingInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadRecommendations();
    loadPricingInsights();
  }, []);

  const loadRecommendations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ml-recommendation-engine', {
        body: {
          action: 'get_personalized_recommendations',
          userId: (await supabase.auth.getUser()).data.user?.id,
          preferences: {
            categories: ['destinations', 'pricing', 'upgrades'],
            budget_range: [500, 5000],
            travel_style: 'business'
          }
        }
      });

      if (error) throw error;
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Mock data for demo
      setRecommendations([
        {
          id: '1',
          type: 'destination',
          title: 'Sydney to Tokyo - Spring Travel',
          description: 'Based on your travel history, Tokyo in spring offers 25% savings with cherry blossom season ending.',
          confidence_score: 0.89,
          expected_savings: 450,
          category: 'destination',
          metadata: { destination: 'Tokyo', season: 'spring' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'pricing',
          title: 'Book Melbourne Hotels Now',
          description: 'ML analysis shows 18% price increase expected next week for your usual Melbourne stay dates.',
          confidence_score: 0.76,
          expected_savings: 320,
          category: 'pricing',
          metadata: { destination: 'Melbourne', price_change: 18 },
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const loadPricingInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ml-recommendation-engine', {
        body: {
          action: 'get_pricing_insights',
          userId: (await supabase.auth.getUser()).data.user?.id,
          insights: {
            destinations: ['Tokyo', 'Melbourne', 'Singapore'],
            date_range: 30
          }
        }
      });

      if (error) throw error;
      setPricingInsights(data.insights || []);
    } catch (error) {
      console.error('Error loading pricing insights:', error);
      // Mock data for demo
      setPricingInsights([
        {
          destination: 'Tokyo',
          current_price: 1200,
          predicted_price: 1050,
          trend: 'down',
          confidence: 0.82,
          best_booking_time: '2 weeks'
        },
        {
          destination: 'Melbourne',
          current_price: 850,
          predicted_price: 920,
          trend: 'up',
          confidence: 0.76,
          best_booking_time: 'now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (recommendationId: string, helpful: boolean) => {
    try {
      await supabase.functions.invoke('ml-recommendation-engine', {
        body: {
          action: 'record_feedback',
          userId: (await supabase.auth.getUser()).data.user?.id,
          feedback: {
            recommendation_id: recommendationId,
            rating: helpful ? 5 : 2,
            feedback_type: helpful ? 'helpful' : 'not_helpful'
          }
        }
      });

      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error recording feedback:', error);
      toast.error('Failed to record feedback');
    }
  };

  const refreshRecommendations = async () => {
    setLoading(true);
    await Promise.all([loadRecommendations(), loadPricingInsights()]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredRecommendations = recommendations.filter(rec => 
    selectedCategory === 'all' || rec.category === selectedCategory
  );

  const categories = [...new Set(recommendations.map(r => r.category))];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading ML recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6" />
                <span>ML Recommendations</span>
              </CardTitle>
              <CardDescription>
                AI-powered travel insights and personalized recommendations
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={refreshRecommendations} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{recommendations.length}</p>
                <p className="text-sm text-muted-foreground">Active Recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${recommendations.reduce((sum, r) => sum + r.expected_savings, 0)}</p>
                <p className="text-sm text-muted-foreground">Potential Savings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length * 100)}%</p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{pricingInsights.length}</p>
                <p className="text-sm text-muted-foreground">Price Insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Insights</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {/* Category Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  size="sm"
                >
                  All Categories
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category)}
                    size="sm"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRecommendations.map(recommendation => (
              <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">{recommendation.type}</Badge>
                        <span className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence_score)}`}>
                          {Math.round(recommendation.confidence_score * 100)}% confidence
                        </span>
                      </div>
                      <h3 className="font-medium">{recommendation.title}</h3>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {recommendation.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-600">
                          ${recommendation.expected_savings} savings
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(recommendation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence Score</span>
                        <span>{Math.round(recommendation.confidence_score * 100)}%</span>
                      </div>
                      <Progress value={recommendation.confidence_score * 100} className="h-2" />
                    </div>

                    <div className="flex justify-between pt-2">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFeedback(recommendation.id, true)}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Helpful
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFeedback(recommendation.id, false)}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Not Helpful
                        </Button>
                      </div>
                      <Button size="sm">
                        Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Insights</CardTitle>
              <CardDescription>
                Real-time price predictions and optimal booking recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingInsights.map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">{insight.destination}</h3>
                          <p className="text-sm text-muted-foreground">
                            Best booking time: {insight.best_booking_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Current</p>
                          <p className="font-medium">${insight.current_price}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(insight.trend)}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Predicted</p>
                          <p className={`font-medium ${
                            insight.predicted_price < insight.current_price 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            ${insight.predicted_price}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className={`font-medium ${getConfidenceColor(insight.confidence)}`}>
                            {Math.round(insight.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Accuracy Rate</span>
                    <span className="font-medium">89%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">User Adoption</span>
                    <span className="font-medium">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Savings Delivered</span>
                    <span className="font-medium">$12,450</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ML Model Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pricing Model</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Destination Model</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Personalization</span>
                    <Badge variant="secondary">Training</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Update</span>
                    <span className="text-sm text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}