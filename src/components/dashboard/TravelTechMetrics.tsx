import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Zap, Globe, Activity, Eye, BookOpen, Star } from 'lucide-react';
import { activityAPI } from '@/lib/otaDataClient';
import logger from "@/utils/logger";
interface TechMetrics {
  aiPoweredRecommendations: number;
  realTimeBookings: number;
  globalReach: number;
  userEngagement: number;
  sustainabilityScore: number;
}
export const TravelTechMetrics: React.FC<{
  className?: string;
}> = ({
  className
}) => {
  const [metrics, setMetrics] = useState<TechMetrics>({
    aiPoweredRecommendations: 94,
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
        logger.error('Error loading recent activity:', error);
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
  const techFeatures = [{
    icon: Zap,
    title: "AI-Powered Recommendations",
    value: `${metrics.aiPoweredRecommendations}%`,
    description: "Accuracy Rate",
    color: "text-travel-gold",
    bgColor: "bg-travel-gold/10"
  }, {
    icon: Activity,
    title: "Real-Time Bookings",
    value: metrics.realTimeBookings.toString(),
    description: "Today",
    color: "text-travel-coral",
    bgColor: "bg-travel-coral/10",
    isLive: true
  }, {
    icon: Globe,
    title: "Global Reach",
    value: `${metrics.globalReach}+`,
    description: "Countries",
    color: "text-travel-forest",
    bgColor: "bg-travel-forest/10"
  }];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-travel-gold" />
          Travel Tech Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {techFeatures.map((feature, index) => (
            <div key={index} className={`p-4 rounded-lg ${feature.bgColor}`}>
              <div className="flex items-center gap-3 mb-2">
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <p className="text-2xl font-bold">{feature.value}</p>
                </div>
                {feature.isLive && (
                  <Badge className="bg-red-500 text-white text-xs">Live</Badge>
                )}
              </div>
              <h3 className="font-medium text-sm">{feature.title}</h3>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};