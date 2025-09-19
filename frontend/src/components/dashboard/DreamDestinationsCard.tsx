import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { MapPin, Star, ArrowRight, Loader2, Sparkles, Brain, TrendingUp, Users, Clock, Target, Zap, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';
import { useAIIntelligence } from '@/hooks/useAIIntelligence';
import { useNavigate } from 'react-router-dom';

interface DreamDestination {
  id: string;
  name: string;
  country: string;
  category: string;
  avg_daily_cost: number | null;
  highlights: string[] | null;
  continent: string;
}

interface DreamDestinationsCardProps {
  onExplore: (destination: DreamDestination) => void;
}

export const DreamDestinationsCard: React.FC<DreamDestinationsCardProps> = ({ onExplore }) => {
  const navigate = useNavigate();
  const { destinations, loading, error, viewDestination } = useEnhancedDreams({ 
    limit: 10,
    includeAIContext: true 
  });

  // Get AI intelligence data
  const {
    travelDNA,
    intelligentRecommendations,
    highConfidenceRecommendations,
    urgentRecommendations,
    socialRecommendations,
    loading: aiLoading,
    confidenceScore
  } = useAIIntelligence();

  // Convert enhanced destinations to legacy format for compatibility
  const legacyDestinations: DreamDestination[] = destinations.map(dest => ({
    id: dest.id,
    name: dest.name,
    country: dest.country,
    category: dest.category,
    avg_daily_cost: dest.avg_daily_cost,
    highlights: dest.highlights,
    continent: dest.continent,
  }));

  // Get AI-enhanced destination data
  const getAIEnhancedDestinations = () => {
    if (!intelligentRecommendations.length) return legacyDestinations.slice(0, 6);
    
    // Merge AI recommendations with existing destinations
    const aiDestinations = intelligentRecommendations.slice(0, 3).map(rec => ({
      id: rec.destination_id,
      name: rec.destination_name,
      country: rec.country,
      category: 'ai_recommended',
      avg_daily_cost: null,
      highlights: rec.recommendation_reasons.map(r => r.reason_text),
      continent: rec.continent,
      aiScore: rec.recommendation_score,
      urgencyScore: rec.urgency_score,
      socialProof: rec.social_proof.friends_visited_count + rec.social_proof.friends_planning_count,
      isAIRecommended: true
    }));

    // Combine with regular destinations
    const regularDestinations = legacyDestinations.slice(0, 3);
    return [...aiDestinations, ...regularDestinations];
  };

  const enhancedDestinations = getAIEnhancedDestinations();

  const getDestinationIcon = (category: string) => {
    if (category === 'ai_recommended') return <Brain className="h-3 w-3 text-purple-500" />;
    switch (category) {
      case 'cultural': return <Target className="h-3 w-3 text-blue-500" />;
      case 'beaches': return <MapPin className="h-3 w-3 text-cyan-500" />;
      case 'mountains': return <TrendingUp className="h-3 w-3 text-green-500" />;
      default: return <MapPin className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPriorityBadge = (destination: any) => {
    if (destination.isAIRecommended) {
      if (destination.urgencyScore >= 80) {
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      } else if (destination.urgencyScore >= 60) {
        return <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">Trending</Badge>;
      } else if (destination.aiScore >= 90) {
        return <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">AI Pick</Badge>;
      }
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart Dream Destinations
            {travelDNA && (
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200">
                <Brain className="h-3 w-3 mr-1" />
                {Math.round(confidenceScore * 100)}% AI Match
              </Badge>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-none text-xs">
              {enhancedDestinations.length} Places
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/smart-dreams')}
              className="text-xs px-2 py-1 h-6"
            >
              <Brain className="h-3 w-3 mr-1" />
              AI Hub
            </Button>
          </div>
        </div>

        {/* AI Intelligence Stats */}
        {intelligentRecommendations.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{highConfidenceRecommendations.length}</div>
                <div className="text-xs text-blue-500">High Confidence</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{urgentRecommendations.length}</div>
                <div className="text-xs text-orange-500">Urgent</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{socialRecommendations.length}</div>
                <div className="text-xs text-green-500">Social Proof</div>
              </div>
            </div>
          </div>
        )}

        {/* Travel DNA Summary */}
        {travelDNA && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-800">Your Travel DNA</span>
              <Badge variant="outline" className="text-xs bg-white">
                {travelDNA.primary_type.replace('_', ' ')}
              </Badge>
            </div>
            <div className="space-y-1">
              {travelDNA.personality_factors.slice(0, 2).map((factor, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-purple-700">{factor.factor}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={factor.weight * 100} className="w-12 h-1" />
                    <span className="text-purple-600 font-medium">{Math.round(factor.weight * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading || aiLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-foreground">
                {aiLoading ? 'AI is analyzing destinations...' : 'Loading dream destinations...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-destructive text-sm">Failed to load destinations</p>
          </div>
        ) : (
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {enhancedDestinations.map((destination, index) => (
                  <div 
                    key={destination.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md group ${
                      destination.isAIRecommended ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200' : 'bg-muted/50 border-border'
                    }`}
                    onClick={() => onExplore(destination)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDestinationIcon(destination.category)}
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {destination.name}
                        </h4>
                        {destination.isAIRecommended && (
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-purple-600 font-medium">{destination.aiScore}/100</span>
                          </div>
                        )}
                      </div>
                      {getPriorityBadge(destination)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{destination.country}</p>
                    
                    {/* AI-enhanced features */}
                    {destination.isAIRecommended && (
                      <div className="space-y-2 mb-3">
                        {destination.socialProof > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Users className="h-3 w-3" />
                            {destination.socialProof} friends interested
                          </div>
                        )}
                        {destination.urgencyScore >= 60 && (
                          <div className="flex items-center gap-1 text-xs text-orange-600">
                            <Clock className="h-3 w-3" />
                            Time-sensitive opportunity
                          </div>
                        )}
                      </div>
                    )}
                    
                    {destination.highlights && destination.highlights.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {destination.highlights.slice(0, 2).map((highlight, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs py-0 px-2 h-5">
                              {typeof highlight === 'string' ? highlight.slice(0, 20) + (highlight.length > 20 ? '...' : '') : String(highlight)}
                            </Badge>
                          ))}
                          {destination.highlights.length > 2 && (
                            <Badge variant="outline" className="text-xs py-0 px-2 h-5">
                              +{destination.highlights.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {destination.avg_daily_cost && (
                        <span className="text-sm font-medium text-primary">
                          ${destination.avg_daily_cost}/day
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => navigate('/smart-dreams')}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Explore All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={() => navigate('/smart-dreams')}
            >
              <Brain className="h-3 w-3 mr-1" />
              AI Insights
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};