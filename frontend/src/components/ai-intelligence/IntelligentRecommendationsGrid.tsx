import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  Heart,
  MessageCircle,
  AlertTriangle,
  Lightbulb,
  Target
} from 'lucide-react';
import { IntelligentRecommendation } from '@/types/ai-intelligence-types';

interface IntelligentRecommendationsGridProps {
  recommendations: IntelligentRecommendation[];
  loading: boolean;
  onRefresh: () => void;
}

const getReasonIcon = (reasonType: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'personality_match': <Target className="h-4 w-4 text-blue-500" />,
    'social_influence': <Users className="h-4 w-4 text-green-500" />,
    'seasonal_optimal': <Calendar className="h-4 w-4 text-orange-500" />,
    'price_opportunity': <DollarSign className="h-4 w-4 text-purple-500" />,
    'trending': <TrendingUp className="h-4 w-4 text-pink-500" />,
    'rare_find': <Sparkles className="h-4 w-4 text-yellow-500" />
  };
  return iconMap[reasonType] || <Star className="h-4 w-4 text-gray-500" />;
};

const getUrgencyColor = (urgency: number) => {
  if (urgency >= 80) return 'text-red-500 bg-red-50 border-red-200';
  if (urgency >= 60) return 'text-orange-500 bg-orange-50 border-orange-200';
  if (urgency >= 40) return 'text-yellow-500 bg-yellow-50 border-yellow-200';
  return 'text-green-500 bg-green-50 border-green-200';
};

const getSocialProofText = (socialProof: IntelligentRecommendation['social_proof']) => {
  const parts = [];
  if (socialProof.friends_visited_count > 0) {
    parts.push(`${socialProof.friends_visited_count} friends visited`);
  }
  if (socialProof.friends_planning_count > 0) {
    parts.push(`${socialProof.friends_planning_count} friends planning`);
  }
  if (parts.length === 0) {
    parts.push(`${socialProof.social_recommendation_score}% community match`);
  }
  return parts.join(' • ');
};

export const IntelligentRecommendationsGrid: React.FC<IntelligentRecommendationsGridProps> = ({
  recommendations,
  loading,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedRecommendation, setSelectedRecommendation] = useState<IntelligentRecommendation | null>(null);

  // Filter and sort recommendations
  const filteredRecommendations = recommendations
    .filter(rec => {
      const matchesSearch = rec.destination_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rec.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'high_score') return matchesSearch && rec.recommendation_score >= 80;
      if (filterBy === 'urgent') return matchesSearch && rec.urgency_score >= 60;
      if (filterBy === 'social') return matchesSearch && (rec.social_proof.friends_visited_count > 0 || rec.social_proof.friends_planning_count > 0);
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.recommendation_score - a.recommendation_score;
        case 'urgency':
          return b.urgency_score - a.urgency_score;
        case 'social':
          return b.social_proof.social_recommendation_score - a.social_proof.social_recommendation_score;
        case 'alphabetical':
          return a.destination_name.localeCompare(b.destination_name);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin mb-4">
            <Target className="h-16 w-16 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading AI Recommendations</h3>
          <p className="text-gray-500 text-center">
            Our AI is analyzing destinations that match your travel DNA...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recommendations Yet</h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Let our AI analyze your preferences to generate personalized destination recommendations.
          </p>
          <Button onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-blue-500" />
                <span>AI-Powered Recommendations</span>
                <Badge variant="secondary">{recommendations.length} destinations</Badge>
              </CardTitle>
              <CardDescription>
                Personalized suggestions based on your travel DNA and real-time insights
              </CardDescription>
            </div>
            <Button onClick={onRefresh} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search destinations or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">AI Score</SelectItem>
                <SelectItem value="urgency">Urgency</SelectItem>
                <SelectItem value="social">Social Proof</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high_score">High Score (80+)</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="social">Social Proof</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>Showing {filteredRecommendations.length} of {recommendations.length} recommendations</span>
            <div className="flex items-center space-x-4">
              <span>Avg Score: {Math.round(filteredRecommendations.reduce((acc, r) => acc + r.recommendation_score, 0) / filteredRecommendations.length || 0)}</span>
              <span>High Urgency: {filteredRecommendations.filter(r => r.urgency_score >= 60).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecommendations.map((recommendation, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{recommendation.destination_name}</span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {recommendation.country}, {recommendation.continent}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge variant="secondary" className="text-lg font-bold">
                    {recommendation.recommendation_score}
                  </Badge>
                  {recommendation.urgency_score > 50 && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getUrgencyColor(recommendation.urgency_score)}`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Top Reasons */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Why this matches you:</h4>
                {recommendation.recommendation_reasons.slice(0, 2).map((reason, reasonIndex) => (
                  <div key={reasonIndex} className="flex items-start space-x-2 text-sm">
                    {getReasonIcon(reason.reason_type)}
                    <div className="flex-1">
                      <p className="text-gray-700">{reason.reason_text}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={reason.confidence * 100} className="flex-1 h-1" />
                        <span className="text-xs text-gray-500">{Math.round(reason.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optimal Timing */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Best Time to Visit</span>
                </div>
                <div className="text-sm text-blue-700">
                  <span className="capitalize">{recommendation.optimal_timing.best_season}</span>
                  {recommendation.optimal_timing.price_optimal_window && (
                    <span> • Save {recommendation.optimal_timing.price_optimal_window.savings_percentage}%</span>
                  )}
                </div>
              </div>

              {/* Social Proof */}
              {(recommendation.social_proof.friends_visited_count > 0 || 
                recommendation.social_proof.friends_planning_count > 0 ||
                recommendation.social_proof.social_recommendation_score > 50) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Social Connections</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {getSocialProofText(recommendation.social_proof)}
                  </p>
                </div>
              )}

              {/* AI Insights */}
              {recommendation.ai_insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span>AI Insights</span>
                  </h4>
                  {recommendation.ai_insights.slice(0, 1).map((insight, insightIndex) => (
                    <div key={insightIndex} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <p className="text-yellow-800">{insight.insight_text}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs bg-white">
                          {Math.round(insight.confidence * 100)}% confident
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="outline" className="text-xs bg-white text-green-600">
                            Actionable
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>Add to Dreams</span>
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Price Insights (if available) */}
              {recommendation.price_insights.length > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Price Alert</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    {recommendation.price_insights[0].action_recommendation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show message if no results after filtering */}
      {filteredRecommendations.length === 0 && searchTerm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No matches found</h3>
            <p className="text-gray-500 text-center mb-4">
              Try adjusting your search terms or filters to see more recommendations.
            </p>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterBy('all'); }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};