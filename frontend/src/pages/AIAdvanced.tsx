import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedRecommendationEngine } from '@/components/ai/EnhancedRecommendationEngine';
import { RealTimePriceMonitor } from '@/components/ai/RealTimePriceMonitor';
import { SmartAutomationHub } from '@/components/ai/SmartAutomationHub';
import { PersonalizationEngine } from '@/components/ai/PersonalizationEngine';
import { SmartAnalytics } from '@/components/dashboard/SmartAnalytics';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Bot, 
  User, 
  BarChart3,
  Sparkles,
  Activity
} from 'lucide-react';

const AIAdvanced: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-travel-gold to-travel-coral">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-travel-gold to-travel-coral bg-clip-text text-transparent">
              Advanced AI Features
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the future of travel with our cutting-edge AI systems that learn, predict, 
            and optimize your travel experience in real-time.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge className="bg-green-100 text-green-800">
              <Activity className="h-3 w-3 mr-1" />
              Phase 3 Active
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <Sparkles className="h-3 w-3 mr-1" />
              Real-time Learning
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              <Zap className="h-3 w-3 mr-1" />
              Predictive Analytics
            </Badge>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-travel-ocean/20 w-fit mx-auto mb-4">
                <Brain className="h-8 w-8 text-travel-ocean" />
              </div>
              <h3 className="font-semibold mb-2">Enhanced ML Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Advanced neural networks analyze behavior patterns for personalized suggestions
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-travel-gold/20 w-fit mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-travel-gold" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Price Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Live market monitoring with predictive pricing and automated alerts
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-travel-forest/20 w-fit mx-auto mb-4">
                <Bot className="h-8 w-8 text-travel-forest" />
              </div>
              <h3 className="font-semibold mb-2">Smart Automation</h3>
              <p className="text-sm text-muted-foreground">
                Intelligent systems handle rebooking, upgrades, and customer service
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-travel-coral/20 w-fit mx-auto mb-4">
                <User className="h-8 w-8 text-travel-coral" />
              </div>
              <h3 className="font-semibold mb-2">Deep Personalization</h3>
              <p className="text-sm text-muted-foreground">
                Behavioral analysis creates unique user personas and preferences
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-travel-pink/20 w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-travel-pink" />
              </div>
              <h3 className="font-semibold mb-2">Predictive Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Advanced forecasting for demand, pricing, and user behavior
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-full bg-travel-sunset/20 w-fit mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-travel-sunset" />
              </div>
              <h3 className="font-semibold mb-2">Contextual Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Location, time, and situation-aware recommendations and services
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Feature Tabs */}
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8">
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">ML Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Price Intelligence</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="personalization" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personalization</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Enhanced ML Recommendation Engine</h2>
              <p className="text-muted-foreground">
                Advanced machine learning algorithms analyze user behavior, preferences, and market trends 
                to provide highly personalized travel recommendations with real-time optimization.
              </p>
            </div>
            <EnhancedRecommendationEngine />
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Real-time Price Intelligence</h2>
              <p className="text-muted-foreground">
                Monitor live pricing across multiple suppliers with predictive analytics, 
                automated alerts, and market trend analysis for optimal booking decisions.
              </p>
            </div>
            <RealTimePriceMonitor 
              itemType="hotel"
              itemId="hotel-123"
              itemName="Park Hyatt Sydney"
            />
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Smart Automation Hub</h2>
              <p className="text-muted-foreground">
                Intelligent automation systems handle rebooking, upgrades, notifications, and customer support 
                with high success rates and continuous learning capabilities.
              </p>
            </div>
            <SmartAutomationHub />
          </TabsContent>

          <TabsContent value="personalization" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Deep Personalization Engine</h2>
              <p className="text-muted-foreground">
                Advanced behavioral analysis creates detailed user personas, contextual insights, 
                and predictive patterns for truly personalized travel experiences.
              </p>
            </div>
            <PersonalizationEngine />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Predictive Analytics Dashboard</h2>
              <p className="text-muted-foreground">
                AI-powered analytics provide insights into travel patterns, preferences, and behavior 
                with predictive capabilities for enhanced user experience optimization.
              </p>
            </div>
            <SmartAnalytics />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-gradient-to-r from-travel-ocean/5 to-travel-forest/5 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Continuous Learning & Improvement</h3>
          <p className="text-muted-foreground">
            Our AI systems continuously learn from user interactions, market changes, and feedback 
            to provide increasingly accurate and valuable insights over time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAdvanced;