import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Users, 
  MapPin, 
  Star, 
  Zap,
  Lightbulb,
  DollarSign,
  Calendar,
  Clock,
  ArrowRight,
  Plane,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  duration: number;
}

export const AIIntelligenceDemo: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mock data for demonstration
  const mockTravelDNA = {
    primary_type: 'cultural_explorer',
    confidence_score: 0.89,
    personality_factors: [
      { factor: 'culture', weight: 0.92, confidence: 0.95, trend: 'increasing' as const },
      { factor: 'photography', weight: 0.84, confidence: 0.88, trend: 'stable' as const },
      { factor: 'food', weight: 0.76, confidence: 0.82, trend: 'increasing' as const },
      { factor: 'adventure', weight: 0.42, confidence: 0.68, trend: 'stable' as const }
    ]
  };

  const mockRecommendations = [
    {
      destination_name: 'Florence',
      country: 'Italy',
      recommendation_score: 94,
      urgency_score: 78,
      reason: 'Perfect match for cultural explorers with world-class art museums',
      social_proof: 3,
      price_savings: 25
    },
    {
      destination_name: 'Kyoto',
      country: 'Japan',
      recommendation_score: 91,
      urgency_score: 65,
      reason: 'Amazing photography opportunities and traditional culture',
      social_proof: 2,
      price_savings: 15
    },
    {
      destination_name: 'Marrakech',
      country: 'Morocco',
      recommendation_score: 87,
      urgency_score: 82,
      reason: 'Rising destination with incredible cultural experiences',
      social_proof: 1,
      price_savings: 35
    }
  ];

  const mockInsights = [
    {
      title: 'Price Drop Alert: Japan',
      description: 'Flight prices to Tokyo expected to drop 30% in next 2 weeks',
      urgency: 'high' as const,
      confidence: 87,
      savings: 450
    },
    {
      title: 'Your Next Dream: Morocco',
      description: 'Based on your travel DNA, Morocco has 78% likelihood of becoming your next dream',
      urgency: 'medium' as const,
      confidence: 78,
      savings: 0
    }
  ];

  const demoSteps: DemoStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AI Intelligence',
      description: 'Discover how AI revolutionizes travel planning with personalized insights',
      duration: 3000,
      component: (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold mb-4">AI-Powered Travel Intelligence</h2>
            <p className="text-lg text-blue-100 mb-6">
              Experience the future of travel planning with our advanced AI system
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">89%</div>
                <div className="text-sm text-blue-200">AI Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold">15+</div>
                <div className="text-sm text-blue-200">Recommendations</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$450</div>
                <div className="text-sm text-blue-200">Avg Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'travel-dna',
      title: 'Travel DNA Analysis',
      description: 'AI analyzes your personality to create your unique travel profile',
      duration: 4000,
      component: (
        <Card>
          <CardHeader className="text-center">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-white text-3xl w-20 h-20 flex items-center justify-center mx-auto mb-4">
              🏛️
            </div>
            <CardTitle className="text-2xl">Cultural Explorer</CardTitle>
            <CardDescription className="text-lg">
              You love discovering history, art, and local traditions
            </CardDescription>
            <Badge variant="secondary" className="mt-2">
              89% Confidence Match
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTravelDNA.personality_factors.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium">{factor.factor}</span>
                    <div className="flex items-center space-x-2">
                      {factor.trend === 'increasing' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">{Math.round(factor.weight * 100)}%</span>
                    </div>
                  </div>
                  <Progress value={factor.weight * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'recommendations',
      title: 'Intelligent Recommendations',
      description: 'AI generates personalized destination suggestions with scoring',
      duration: 4000,
      component: (
        <div className="space-y-4">
          {mockRecommendations.map((rec, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <h3 className="font-semibold">{rec.destination_name}</h3>
                    <Badge variant="secondary">{rec.recommendation_score}/100</Badge>
                  </div>
                  {rec.urgency_score > 70 && (
                    <Badge variant="destructive" className="text-xs">High Priority</Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{rec.country}</p>
                
                <div className="flex items-start space-x-2 mb-3">
                  <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-sm">{rec.reason}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  {rec.social_proof > 0 && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Users className="h-4 w-4" />
                      <span>{rec.social_proof} friends interested</span>
                    </div>
                  )}
                  {rec.price_savings > 0 && (
                    <div className="flex items-center space-x-1 text-purple-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Save {rec.price_savings}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'insights',
      title: 'Predictive Insights',
      description: 'AI predicts future opportunities and price changes',
      duration: 4000,
      component: (
        <div className="space-y-4">
          {mockInsights.map((insight, index) => (
            <Card key={index} className={`border-l-4 ${
              insight.urgency === 'high' ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className={`h-5 w-5 ${
                      insight.urgency === 'high' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <h3 className="font-semibold">{insight.title}</h3>
                  </div>
                  <Badge variant={insight.urgency === 'high' ? 'destructive' : 'secondary'}>
                    {insight.confidence}% confident
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                
                <div className="flex items-center justify-between">
                  {insight.savings > 0 && (
                    <div className="flex items-center space-x-1 text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      <span>Potential savings: ${insight.savings}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Act within 14 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'journey',
      title: 'Journey Optimization',
      description: 'AI optimizes multi-destination routes for cost and time',
      duration: 4000,
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-blue-500" />
              <span>Optimized 14-Day Journey</span>
              <Badge variant="secondary">Score: 87/100</Badge>
            </CardTitle>
            <CardDescription>
              AI-optimized route through 3 destinations saving 25% on costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">$2,400</div>
                  <div className="text-xs text-blue-500">Total Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">14</div>
                  <div className="text-xs text-green-500">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">1,240</div>
                  <div className="text-xs text-purple-500">KM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">85</div>
                  <div className="text-xs text-orange-500">CO2 (kg)</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="text-2xl">✈️</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">Florence</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Kyoto</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      2.5h • $180 • Best weather window
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Optimization Benefits</span>
                  </div>
                  <ul className="mt-2 text-sm text-green-700 space-y-1">
                    <li>• 25% cost savings vs manual planning</li>
                    <li>• 15% time savings with optimal routing</li>
                    <li>• Perfect weather timing for all destinations</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'conclusion',
      title: 'Ready to Experience AI Travel?',
      description: 'Start your AI-powered travel planning journey today',
      duration: 3000,
      component: (
        <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Sparkles className="h-16 w-16 mx-auto mb-4 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your AI Journey?</h2>
            <p className="text-lg text-green-100 mb-8">
              Experience personalized travel planning like never before
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/ai-intelligence')}
                className="h-12"
              >
                <Brain className="h-5 w-5 mr-2" />
                Launch AI Hub
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/smart-dreams')}
                className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Star className="h-5 w-5 mr-2" />
                Explore Dreams
              </Button>
            </div>
            
            <div className="text-sm text-green-200">
              🎯 89% accuracy • 💰 Average $450 savings • ⚡ Real-time insights
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (currentStep < demoSteps.length - 1) {
              setCurrentStep(prev => prev + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 100;
            }
          }
          return prev + (100 / (demoSteps[currentStep].duration / 100));
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, demoSteps]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setProgress(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Demo Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              <Brain className="h-6 w-6 text-purple-500" />
              <span>AI Intelligence Demo</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Experience how AI transforms travel planning with personalized insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Demo Controls */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Button onClick={handlePlayPause} variant="outline" size="sm">
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'} Demo
              </Button>
              <Button onClick={handleReset} variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep + 1} of {demoSteps.length}</span>
                <span>{demoSteps[currentStep].title}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Navigation */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
              {demoSteps.map((step, index) => (
                <Button
                  key={step.id}
                  variant={index === currentStep ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStepClick(index)}
                  className="text-xs p-2 h-auto"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">
                      {index === 0 ? '🎬' : 
                       index === 1 ? '🧬' : 
                       index === 2 ? '🎯' : 
                       index === 3 ? '💡' : 
                       index === 4 ? '✈️' : '🎉'}
                    </div>
                    <div className="text-xs">{step.title.split(' ')[0]}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demo Content */}
        <div className="min-h-[500px]">
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {demoSteps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {demoSteps[currentStep].description}
            </p>
          </div>
          
          {demoSteps[currentStep].component}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Ready to get started?</h3>
                <p className="text-sm text-gray-600">Launch the AI Intelligence Hub to experience these features</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => navigate('/ai-intelligence')} className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>Try AI Hub</span>
                </Button>
                <Button onClick={() => navigate('/smart-dreams')} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Dream Hub
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};