import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  User, 
  TrendingUp, 
  Users, 
  Activity, 
  RefreshCw,
  Sparkles,
  Calendar,
  BarChart3
} from 'lucide-react';
import { TravelDNA } from '@/types/ai-intelligence-types';

interface TravelDNACardProps {
  travelDNA: TravelDNA | null;
  loading: boolean;
  onRefresh: () => void;
}

const getTravelTypeIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'cultural_explorer': '🏛️',
    'adventurer': '🏔️',
    'luxury_seeker': '✨',
    'budget_traveler': '🎒',
    'photographer': '📸',
    'foodie': '🍜',
    'relaxation_seeker': '🏖️',
    'social_explorer': '👥'
  };
  return iconMap[type] || '🌍';
};

const getTravelTypeDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    'cultural_explorer': 'You love discovering history, art, and local traditions',
    'adventurer': 'You seek thrilling experiences and outdoor challenges',
    'luxury_seeker': 'You prefer premium experiences and high-end accommodations',
    'budget_traveler': 'You are skilled at finding great value and authentic experiences',
    'photographer': 'You travel to capture stunning visuals and unique perspectives',
    'foodie': 'You explore destinations through their culinary landscapes',
    'relaxation_seeker': 'You travel to unwind and rejuvenate',
    'social_explorer': 'You love meeting people and experiencing social connections'
  };
  return descriptions[type] || 'You have a unique travel personality';
};

const getFactorIcon = (factor: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'adventure': <span className="text-red-500">⛰️</span>,
    'culture': <span className="text-purple-500">🏛️</span>,
    'relaxation': <span className="text-blue-500">🏖️</span>,
    'photography': <span className="text-yellow-500">📸</span>,
    'food': <span className="text-orange-500">🍜</span>,
    'nature': <span className="text-green-500">🌿</span>,
    'luxury': <span className="text-pink-500">✨</span>,
    'budget': <span className="text-gray-500">💰</span>,
    'social': <span className="text-indigo-500">👥</span>,
    'spiritual': <span className="text-violet-500">🧘</span>
  };
  return iconMap[factor] || <span>🌍</span>;
};

const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'decreasing':
      return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
    default:
      return <Activity className="h-3 w-3 text-gray-500" />;
  }
};

export const TravelDNACard: React.FC<TravelDNACardProps> = ({
  travelDNA,
  loading,
  onRefresh
}) => {
  if (!travelDNA && !loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Travel DNA Analysis Yet</h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Let our AI analyze your travel preferences and behavior to create your personalized Travel DNA profile.
          </p>
          <Button onClick={onRefresh} disabled={loading}>
            <Brain className="h-4 w-4 mr-2" />
            Analyze My Travel DNA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin mb-4">
            <Brain className="h-16 w-16 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Analyzing Your Travel DNA</h3>
          <p className="text-gray-500 text-center">
            Our AI is processing your travel patterns, preferences, and social connections...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main DNA Profile */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-3xl">
              {getTravelTypeIcon(travelDNA.primary_type)}
            </div>
          </div>
          <CardTitle className="text-2xl flex items-center justify-center space-x-3">
            <span className="capitalize">{travelDNA.primary_type.replace('_', ' ')}</span>
            <Badge variant="secondary" className="text-sm">
              {Math.round(travelDNA.confidence_score * 100)}% Match
            </Badge>
          </CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            {getTravelTypeDescription(travelDNA.primary_type)}
          </CardDescription>
          
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Analyzed {new Date(travelDNA.last_analyzed).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="h-4 w-4" />
              <span>Version {travelDNA.analysis_version}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Personality Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-500" />
            <span>Personality Factors</span>
          </CardTitle>
          <CardDescription>
            Key elements that define your travel preferences and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {travelDNA.personality_factors.map((factor, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getFactorIcon(factor.factor)}
                    <span className="font-medium capitalize">{factor.factor}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(factor.trend)}
                    <Badge variant="outline" className="text-xs">
                      {Math.round(factor.confidence * 100)}% confident
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Influence Weight</span>
                    <span className="font-semibold">{Math.round(factor.weight * 100)}%</span>
                  </div>
                  <Progress value={factor.weight * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Source: {factor.source.replace('_', ' ')}</span>
                    <span>Trend: {factor.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Influence */}
      {travelDNA.social_influence_factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span>Social Influences</span>
            </CardTitle>
            <CardDescription>
              How your travel connections and community shape your preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {travelDNA.social_influence_factors.map((influence, index) => (
                <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="font-medium capitalize">
                        {influence.factor_type.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {Math.round(influence.confidence * 100)}% confident
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Influence Strength:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={influence.influence_strength * 100} className="flex-1 h-2" />
                        <span className="font-semibold">{Math.round(influence.influence_strength * 100)}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Connected Users:</span>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {influence.source_users.length} connections
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {influence.destinations_influenced.length > 0 && (
                    <div className="mt-3">
                      <span className="text-gray-600 text-sm">Influenced Destinations:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {influence.destinations_influenced.slice(0, 5).map((dest, destIndex) => (
                          <Badge key={destIndex} variant="outline" className="text-xs capitalize">
                            {dest}
                          </Badge>
                        ))}
                        {influence.destinations_influenced.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{influence.destinations_influenced.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Behavioral Patterns */}
      {travelDNA.behavioral_patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <span>Behavioral Patterns</span>
            </CardTitle>
            <CardDescription>
              Insights from your browsing and interaction patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {travelDNA.behavioral_patterns.map((pattern, index) => (
                <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <span className="font-medium capitalize">
                        {pattern.pattern_type.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {Math.round(pattern.strength * 100)}% strength
                    </Badge>
                  </div>
                  
                  {pattern.pattern_data.peak_browsing_hours && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Peak Activity Hours:</span>
                        <div className="flex space-x-1 mt-1">
                          {pattern.pattern_data.peak_browsing_hours.map((hour: number, hourIndex: number) => (
                            <Badge key={hourIndex} variant="secondary" className="text-xs">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {pattern.pattern_data.average_session_duration && (
                        <div>
                          <span className="text-gray-600">Avg Session:</span>
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {pattern.pattern_data.average_session_duration} min
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {pattern.pattern_data.preferred_content_types && (
                    <div className="mt-3">
                      <span className="text-gray-600 text-sm">Preferred Content:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pattern.pattern_data.preferred_content_types.map((type: string, typeIndex: number) => (
                          <Badge key={typeIndex} variant="outline" className="text-xs capitalize">
                            {type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};