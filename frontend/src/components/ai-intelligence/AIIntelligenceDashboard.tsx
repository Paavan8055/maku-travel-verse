import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  AlertTriangle,
  Lightbulb,
  Calendar,
  DollarSign,
  Plane,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useAIIntelligence } from '@/hooks/useAIIntelligence';
import { TravelDNACard } from './TravelDNACard';
import { IntelligentRecommendationsGrid } from './IntelligentRecommendationsGrid';
import { PredictiveInsightsPanel } from './PredictiveInsightsPanel';
import { JourneyOptimizerCard } from './JourneyOptimizerCard';

export const AIIntelligenceDashboard: React.FC = () => {
  const {
    travelDNA,
    intelligentRecommendations,
    predictiveInsights,
    currentJourney,
    loading,
    analyzingDNA,
    optimizingJourney,
    error,
    aiProcessingTime,
    confidenceScore,
    lastAnalysisDate,
    highConfidenceRecommendations,
    urgentRecommendations,
    socialRecommendations,
    actionableInsights,
    analyzeTravelDNA,
    getIntelligentRecommendations,
    getPredictiveInsights,
    optimizeJourney
  } = useAIIntelligence();

  const [activeTab, setActiveTab] = useState('overview');

  // Calculate stats
  const stats = {
    totalRecommendations: intelligentRecommendations.length,
    highConfidenceCount: highConfidenceRecommendations.length,
    urgentCount: urgentRecommendations.length,
    socialCount: socialRecommendations.length,
    actionableInsightsCount: actionableInsights.length,
    avgConfidence: intelligentRecommendations.length > 0 
      ? Math.round(intelligentRecommendations.reduce((acc, rec) => acc + rec.recommendation_score, 0) / intelligentRecommendations.length)
      : 0
  };

  const refreshData = async () => {
    await Promise.all([
      analyzeTravelDNA(true),
      getIntelligentRecommendations({ max_results: 15 }),
      getPredictiveInsights()
    ]);
  };

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>AI Intelligence Error</AlertTitle>
        <AlertDescription>
          {error}. Please try refreshing the page or contact support if the issue persists.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Intelligence Hub</h1>
              <p className="text-gray-600">Powered by advanced AI analysis and predictions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastAnalysisDate && (
              <div className="text-sm text-gray-500">
                Last analysis: {lastAnalysisDate.toLocaleDateString()}
              </div>
            )}
            <Button 
              onClick={refreshData} 
              disabled={loading || analyzingDNA}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">AI Confidence</p>
                  <p className="text-2xl font-bold">{Math.round(confidenceScore * 100)}%</p>
                </div>
                <Sparkles className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Recommendations</p>
                  <p className="text-2xl font-bold">{stats.totalRecommendations}</p>
                </div>
                <Target className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Urgent</p>
                  <p className="text-2xl font-bold">{stats.urgentCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Social Proof</p>
                  <p className="text-2xl font-bold">{stats.socialCount}</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">Insights</p>
                  <p className="text-2xl font-bold">{stats.actionableInsightsCount}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Avg Score</p>
                  <p className="text-2xl font-bold">{stats.avgConfidence}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="dna" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Travel DNA</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
            <TabsTrigger value="journey" className="flex items-center space-x-2">
              <Plane className="h-4 w-4" />
              <span>Journey</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Travel DNA Summary */}
              {travelDNA && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <span>Your Travel DNA</span>
                      <Badge variant="secondary">{Math.round(confidenceScore * 100)}% confident</Badge>
                    </CardTitle>
                    <CardDescription>
                      AI-powered analysis of your travel personality and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold capitalize">
                          {travelDNA.primary_type.replace('_', ' ')}
                        </span>
                        <Progress value={travelDNA.confidence_score * 100} className="w-32" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {travelDNA.personality_factors.slice(0, 4).map((factor, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="capitalize text-sm font-medium">{factor.factor}</span>
                            <Badge variant="outline">{Math.round(factor.weight * 100)}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>Quick Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {actionableInsights.slice(0, 3).map((insight, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant={insight.urgency === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {insight.urgency}
                          </Badge>
                          <span className="text-xs text-gray-500">{insight.confidence}% confident</span>
                        </div>
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{insight.description.slice(0, 80)}...</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Recommendations Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Top AI Recommendations</span>
                  </CardTitle>
                  <CardDescription>Your most personalized destination suggestions</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActiveTab('recommendations')}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {highConfidenceRecommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{rec.destination_name}</h3>
                        <Badge variant="secondary">{rec.recommendation_score}/100</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.country}, {rec.continent}</p>
                      
                      <div className="space-y-2">
                        {rec.recommendation_reasons.slice(0, 2).map((reason, reasonIndex) => (
                          <div key={reasonIndex} className="flex items-center text-xs text-gray-500">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                            {reason.reason_text.slice(0, 60)}...
                          </div>
                        ))}
                      </div>

                      {rec.urgency_score > 50 && (
                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                          <div className="flex items-center text-xs text-orange-700">
                            <Clock className="h-3 w-3 mr-1" />
                            High urgency - Act soon!
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Travel DNA Tab */}
          <TabsContent value="dna">
            <TravelDNACard 
              travelDNA={travelDNA}
              loading={analyzingDNA}
              onRefresh={() => analyzeTravelDNA(true)}
            />
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <IntelligentRecommendationsGrid 
              recommendations={intelligentRecommendations}
              loading={loading}
              onRefresh={() => getIntelligentRecommendations({ max_results: 20 })}
            />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <PredictiveInsightsPanel 
              insights={predictiveInsights}
              loading={loading}
              onRefresh={getPredictiveInsights}
            />
          </TabsContent>

          {/* Journey Optimizer Tab */}
          <TabsContent value="journey">
            <JourneyOptimizerCard 
              currentJourney={currentJourney}
              optimizing={optimizingJourney}
              onOptimize={optimizeJourney}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};