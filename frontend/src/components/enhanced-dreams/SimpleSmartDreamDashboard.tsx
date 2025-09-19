import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Sparkles, 
  Brain,
  Target,
  Lightbulb,
  Plane,
  Zap,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

import { EnhancedDreamGrid } from './EnhancedDreamGrid';
import { UserInsightsPanel } from './UserInsightsPanel';
import { SocialGamificationHub } from '../gamification/SocialGamificationHub';
import { useEnhancedDreams } from '@/hooks/useEnhancedDreams';

export const SimpleSmartDreamDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [showAIInsights, setShowAIInsights] = useState(true);

  const {
    destinations,
    userProfile,
    userInsights,
    loading,
    error,
    refetch,
    behaviorTracking,
    setBehaviorTracking,
  } = useEnhancedDreams({
    includeAIContext: true
  });

  const handleDestinationClick = (destination: any) => {
    console.log('Destination clicked:', destination.name);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Smart Dream Hub
              </h1>
              <p className="text-muted-foreground text-sm">
                AI-powered destination discovery and planning
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showAIInsights ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                AI Insights
                {showAIInsights && <Badge variant="secondary" className="ml-1">ON</Badge>}
              </Button>

              <Button
                variant={behaviorTracking ? "default" : "outline"}
                size="sm"
                onClick={() => setBehaviorTracking(!behaviorTracking)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Learning
                {behaviorTracking && <Badge variant="secondary" className="ml-1">ON</Badge>}
              </Button>

              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* AI Intelligence Banner */}
        {showAIInsights && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-800">AI Intelligence Hub</h3>
                  <Badge variant="outline" className="bg-white border-purple-200">
                    Ready to Analyze
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-blue-600">
                    <Target className="h-4 w-4 inline mr-1" />
                    AI-Powered Recommendations
                  </div>
                  <div className="text-orange-600">
                    <Lightbulb className="h-4 w-4 inline mr-1" />
                    Predictive Insights
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className="text-lg font-bold text-blue-600">Travel DNA</div>
                  <div className="text-xs text-blue-500">Personality Analysis</div>
                </div>
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className="text-lg font-bold text-green-600">Smart Picks</div>
                  <div className="text-xs text-green-500">AI Recommendations</div>
                </div>
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className="text-lg font-bold text-orange-600">Insights</div>
                  <div className="text-xs text-orange-500">Price Predictions</div>
                </div>
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className="text-lg font-bold text-purple-600">Planner</div>
                  <div className="text-xs text-purple-500">Journey Optimizer</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-[600px]">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="ai-dna">Travel DNA</TabsTrigger>
            <TabsTrigger value="ai-recs">AI Picks</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="planner">Planner</TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search dream destinations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <EnhancedDreamGrid
              destinations={destinations}
              onDestinationClick={handleDestinationClick}
              viewMode="grid"
              loading={loading}
              error={error}
            />
          </TabsContent>

          {/* Travel DNA Tab */}
          <TabsContent value="ai-dna" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Travel DNA Analysis</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Let our AI analyze your travel preferences and behavior to create your personalized Travel DNA profile.
                </p>
                <Button className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>Analyze My Travel DNA</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="ai-recs" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-16 w-16 text-blue-500 mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading AI Recommendations</h3>
                <p className="text-gray-500 text-center">
                  Our AI is analyzing destinations that match your travel DNA...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {showAIInsights ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Lightbulb className="h-16 w-16 text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">AI Predictive Insights</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    AI predictions are generated based on your travel patterns and market data.
                  </p>
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Insights
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <UserInsightsPanel 
                userProfile={userProfile}
                userInsights={userInsights}
                loading={loading}
              />
            )}
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <SocialGamificationHub />
          </TabsContent>

          {/* Planner Tab */}
          <TabsContent value="planner" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plane className="h-16 w-16 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">AI Journey Optimizer</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Let our AI create the perfect multi-destination itinerary optimized for your preferences.
                </p>
                <Button>
                  <Zap className="h-4 w-4 mr-2" />
                  Start Journey Planning
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};