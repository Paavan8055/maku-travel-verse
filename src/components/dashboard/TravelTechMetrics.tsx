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
export const TravelTechMetrics: React.FC<{
  className?: string;
}> = ({
  className
}) => {
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
  const techFeatures = [{
    icon: Zap,
    title: "AI-Powered Recommendations",
    value: `${metrics.aiPoweredRecommendations}%`,
    description: "Accuracy Rate",
    color: "text-travel-gold",
    bgColor: "bg-travel-gold/10"
  }, {
    icon: TrendingUp,
    title: "Price Intelligence",
    value: `${metrics.priceIntelligenceAccuracy}%`,
    description: "Prediction Accuracy",
    color: "text-travel-ocean",
    bgColor: "bg-travel-ocean/10"
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
  return;
};