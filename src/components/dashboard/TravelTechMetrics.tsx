import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Zap, Globe, Activity, Eye, BookOpen, Star } from 'lucide-react';
import { activityAPI } from '@/lib/otaDataClient';

interface TechMetrics {
  aiPoweredRecommendations: number;
  priceIntelligenceAccuracy: number;
  realTimeBookings: number;
  globalReach: number;
  userEngagement: number;
  sustainabilityScore: number;
}

export const TravelTechMetrics: React.FC<{ className?: string }> = ({ className }) => {
  const [metrics, setMetrics] = useState<TechMetrics>({
    aiPoweredRecommendations: 94,
    priceIntelligenceAccuracy: 87,
    realTimeBookings: 156,
    globalReach: 180,
    userEngagement: 89,
    sustainabilityScore: 92
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        const activity = await activityAPI.fetchRecentActivity(undefined, 5);
        setRecentActivity(activity || []);
      } catch (error) {
        console.error('Error loading recent activity:', error);
      }
    };

    loadRecentActivity();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        realTimeBookings: prev.realTimeBookings + Math.floor(Math.random() * 3),
        userEngagement: Math.min(100, prev.userEngagement + (Math.random() - 0.5) * 2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const techFeatures = [
    {
      icon: Zap,
      title: "AI-Powered Recommendations",
      value: `${metrics.aiPoweredRecommendations}%`,
      description: "Accuracy Rate",
      color: "text-travel-gold",
      bgColor: "bg-travel-gold/10"
    },
    {
      icon: TrendingUp,
      title: "Price Intelligence",
      value: `${metrics.priceIntelligenceAccuracy}%`,
      description: "Prediction Accuracy",
      color: "text-travel-ocean",
      bgColor: "bg-travel-ocean/10"
    },
    {
      icon: Activity,
      title: "Real-Time Bookings",
      value: metrics.realTimeBookings.toString(),
      description: "Today",
      color: "text-travel-coral",
      bgColor: "bg-travel-coral/10",
      isLive: true
    },
    {
      icon: Globe,
      title: "Global Reach",
      value: `${metrics.globalReach}+`,
      description: "Countries",
      color: "text-travel-forest",
      bgColor: "bg-travel-forest/10"
    }
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-travel-gold" />
            Travel Tech Metrics
          </h2>
          <p className="text-muted-foreground">Powered by AI & Real-time Data</p>
        </div>
        <Badge className="bg-gradient-to-r from-travel-gold to-travel-sunset text-white">
          Live Dashboard
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {techFeatures.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                {feature.isLive && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">LIVE</span>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{feature.value}</p>
                <p className="text-sm text-muted-foreground">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-travel-ocean" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">User Engagement</span>
                <span className="text-sm text-muted-foreground">{metrics.userEngagement}%</span>
              </div>
              <Progress value={metrics.userEngagement} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sustainability Score</span>
                <span className="text-sm text-muted-foreground">{metrics.sustainabilityScore}%</span>
              </div>
              <Progress value={metrics.sustainabilityScore} className="h-2 bg-travel-forest/20" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">API Response Time</span>
                <span className="text-sm text-green-600">98ms avg</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-travel-coral" />
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-travel-coral rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {activity.activity_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.location && `in ${activity.location}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};