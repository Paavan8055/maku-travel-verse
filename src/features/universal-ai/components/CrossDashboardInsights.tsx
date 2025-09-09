import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUniversalAI } from '../context/UniversalAIContext';
import { TrendingUp, Users, MessageCircle, Activity, Clock, Target } from 'lucide-react';

interface CrossDashboardInsightsProps {
  dashboardType: 'admin' | 'partner' | 'user';
}

export const CrossDashboardInsights: React.FC<CrossDashboardInsightsProps> = ({ dashboardType }) => {
  const { getCrossDashboardInsights, analyzeUsagePatterns, getPersonalizationData } = useUniversalAI();
  
  const insights = getCrossDashboardInsights(dashboardType);
  const usageData = analyzeUsagePatterns();
  const personalization = getPersonalizationData();

  const getRecommendations = () => {
    const recommendations = [];
    
    if (usageData.averageSuccessRate < 0.8) {
      recommendations.push({
        icon: <Target className="h-4 w-4" />,
        text: 'Try shorter, more specific queries for better results',
        type: 'improvement'
      });
    }
    
    if (personalization.optimalTimes.length > 0) {
      recommendations.push({
        icon: <Clock className="h-4 w-4" />,
        text: `Peak productivity at ${personalization.optimalTimes[0]}:00`,
        type: 'timing'
      });
    }
    
    if (dashboardType === 'user' && usageData.mostUsedDashboard !== 'user') {
      recommendations.push({
        icon: <Users className="h-4 w-4" />,
        text: 'Enable cross-dashboard sharing for better context',
        type: 'feature'
      });
    }
    
    return recommendations.slice(0, 3);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
              <TrendingUp className="h-3 w-3 mt-0.5 text-primary" />
              <span>{insight}</span>
            </div>
          ))}
          
          <div className="pt-2 border-t">
            <div className="text-xs font-medium mb-2">Quick Actions:</div>
            {getRecommendations().map((rec, index) => (
              <div key={index} className="flex items-center gap-2 text-xs p-1">
                {rec.icon}
                <span>{rec.text}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {rec.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrossDashboardInsights;