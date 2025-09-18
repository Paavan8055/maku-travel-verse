import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Calendar, 
  Target, 
  Sparkles,
  MapPin,
  Trophy
} from 'lucide-react';
import { UserDreamProfile, UserInsights } from '@/types/enhanced-dream-types';

interface UserInsightsPanelProps {
  profile: UserDreamProfile | null;
  insights: UserInsights | null;
  loading?: boolean;
}

export const UserInsightsPanel: React.FC<UserInsightsPanelProps> = ({
  profile,
  insights,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center">
          <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Start exploring destinations to unlock your travel insights!</p>
        </CardContent>
      </Card>
    );
  }

  const travelDNA = insights?.travel_dna;
  const gameMetrics = profile.gamification_metrics;

  return (
    <div className="space-y-6">
      {/* Travel DNA Section */}
      {travelDNA && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Travel DNA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg capitalize">
                  {travelDNA.primary_type.replace('_', ' ')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Confidence: {Math.round(travelDNA.confidence_score * 100)}%
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                DNA Match
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Personality Factors:</p>
              <div className="grid grid-cols-2 gap-2">
                {travelDNA.personality_factors.slice(0, 4).map((factor, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{factor.factor}</span>
                      <span>{Math.round(factor.weight * 100)}%</span>
                    </div>
                    <Progress 
                      value={factor.weight * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dream Collection Stats */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dream Destinations</p>
                <p className="text-2xl font-bold">{gameMetrics.destinations_collected}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <Progress 
                value={Math.min((gameMetrics.destinations_collected / 100) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {100 - gameMetrics.destinations_collected} until collection limit
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Level & Points */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">Level {gameMetrics.level}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {gameMetrics.total_points.toLocaleString()} total points
              </p>
              <Progress 
                value={(gameMetrics.level % 1) * 100} 
                className="h-2 mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{gameMetrics.achievements_unlocked}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Continents unlocked: {gameMetrics.continents_unlocked}/7
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dream Streak</p>
                <p className="text-2xl font-bold">{gameMetrics.streak_days}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {gameMetrics.streak_days > 0 ? 'Keep it up!' : 'Start your streak today!'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations Preview */}
      {insights?.next_recommended_destinations && insights.next_recommended_destinations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.next_recommended_destinations.slice(0, 3).map((destination, index) => (
                <div key={destination.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="font-medium">{destination.name}</h4>
                    <p className="text-sm text-muted-foreground">{destination.country}</p>
                  </div>
                  <Badge variant="outline">
                    {Math.round((destination.personality_match_factors[0]?.weight || 0) * 100)}% match
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Recommendations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Social Insights Preview */}
      {insights?.social_insights && insights.social_insights.friends_overlap.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Social Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.social_insights.friends_overlap.slice(0, 2).map((overlap, index) => (
                <div key={overlap.friend_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="font-medium">Friend #{index + 1}</h4>
                    <p className="text-sm text-muted-foreground">
                      {overlap.shared_destinations} shared dreams
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Math.round(overlap.travel_compatibility_score * 100)}% compatible
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Explore Social Features
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data Quality Indicator */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">AI Learning Progress</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {Math.round(profile.data_quality_score * 100)}% Complete
            </Badge>
          </div>
          <Progress 
            value={profile.data_quality_score * 100} 
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Keep exploring to improve your personalized recommendations!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};