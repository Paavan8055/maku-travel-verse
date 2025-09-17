import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sun, 
  Cloud, 
  Users, 
  Clock, 
  Camera,
  Mountain,
  Waves,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Star
} from 'lucide-react';

interface ActivityInsight {
  type: 'weather' | 'crowd_level' | 'seasonal' | 'safety' | 'photographer_tips' | 'group_suitability';
  title: string;
  description: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'info' | 'warning' | 'success';
  icon: React.ReactNode;
}

interface IntelligentActivityInfoProps {
  destination: string;
  date?: string;
  participants?: number;
  activityType?: string;
  className?: string;
}

export const IntelligentActivityInfo: React.FC<IntelligentActivityInfoProps> = ({
  destination,
  date,
  participants = 2,
  activityType,
  className = ''
}) => {
  const [insights, setInsights] = useState<ActivityInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateActivityInsights = async () => {
      setLoading(true);
      
      // Simulated intelligent activity insights
      const activityInsights: ActivityInsight[] = [];

      // Weather suitability
      if (date) {
        const selectedDate = new Date(date);
        const month = selectedDate.getMonth();
        
        if (month >= 5 && month <= 7) { // Summer
          activityInsights.push({
            type: 'weather',
            title: 'Perfect Weather Conditions',
            description: `Ideal weather for outdoor activities in ${destination}. Clear skies expected with 22°C average.`,
            value: 92,
            severity: 'success',
            icon: <Sun className="h-4 w-4" />
          });
        } else if (month >= 11 || month <= 2) { // Winter
          activityInsights.push({
            type: 'weather',
            title: 'Weather Advisory',
            description: 'Winter conditions may affect some outdoor activities. Indoor alternatives recommended.',
            severity: 'warning',
            icon: <Cloud className="h-4 w-4" />
          });
        }
      }

      // Crowd level prediction
      const isWeekend = date && (new Date(date).getDay() === 0 || new Date(date).getDay() === 6);
      activityInsights.push({
        type: 'crowd_level',
        title: isWeekend ? 'High Visitor Traffic' : 'Moderate Crowds',
        description: isWeekend 
          ? 'Weekend peak times. Consider early morning or late afternoon bookings.'
          : 'Weekday visits typically have 40% fewer crowds for better experience.',
        value: isWeekend ? 85 : 45,
        trend: isWeekend ? 'up' : 'down',
        severity: isWeekend ? 'warning' : 'success',
        icon: <Users className="h-4 w-4" />
      });

      // Group size suitability
      if (participants > 1) {
        const isLargeGroup = participants > 6;
        activityInsights.push({
          type: 'group_suitability',
          title: isLargeGroup ? 'Large Group Considerations' : 'Group-Friendly Activities',
          description: isLargeGroup
            ? 'Large group activities may require advance booking and could have limited availability.'
            : `Perfect group size for most activities. ${participants} participants qualify for group discounts.`,
          value: isLargeGroup ? 65 : 90,
          severity: isLargeGroup ? 'warning' : 'success',
          icon: <Users className="h-4 w-4" />
        });
      }

      // Activity-specific insights
      if (activityType || destination.toLowerCase().includes('beach') || destination.toLowerCase().includes('coast')) {
        activityInsights.push({
          type: 'seasonal',
          title: 'Water Activity Season',
          description: 'Prime season for water sports and beach activities. Water temperature: 24°C.',
          value: 88,
          severity: 'success',
          icon: <Waves className="h-4 w-4" />
        });
      }

      if (destination.toLowerCase().includes('mountain') || destination.toLowerCase().includes('hiking')) {
        activityInsights.push({
          type: 'safety',
          title: 'Mountain Activity Advisory',
          description: 'Check weather conditions and inform others of your hiking plans. Recommended gear list available.',
          severity: 'info',
          icon: <Mountain className="h-4 w-4" />
        });
      }

      // Photography insights
      activityInsights.push({
        type: 'photographer_tips',
        title: 'Photography Opportunities',
        description: 'Golden hour (6:30-7:30 AM & 7:00-8:00 PM) offers the best lighting for photography.',
        severity: 'info',
        icon: <Camera className="h-4 w-4" />
      });

      // Booking trend insight
      activityInsights.push({
        type: 'seasonal',
        title: 'Booking Trend',
        description: 'Adventure activities in this region are 34% more popular this month. Book early for preferred times.',
        value: 34,
        trend: 'up',
        severity: 'info',
        icon: <TrendingUp className="h-4 w-4" />
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInsights(activityInsights);
      setLoading(false);
    };

    if (destination) {
      generateActivityInsights();
    }
  }, [destination, date, participants, activityType]);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (trend === 'down') return <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />;
    return null;
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Activity Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-l-4 border-l-green-500`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5" />
          Activity Intelligence for {destination}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg border ${getSeverityColor(insight.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">{insight.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    {insight.trend && getTrendIcon(insight.trend)}
                    {insight.value && (
                      <Badge variant="secondary" className="text-xs">
                        {insight.value}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm opacity-90">{insight.description}</p>
                  
                  {insight.type === 'crowd_level' && insight.value && (
                    <div className="mt-2">
                      <Progress value={insight.value} className="h-2" />
                      <p className="text-xs mt-1 opacity-75">Expected Crowd Level</p>
                    </div>
                  )}
                  
                  {insight.type === 'weather' && insight.value && (
                    <div className="mt-2">
                      <Progress value={insight.value} className="h-2" />
                      <p className="text-xs mt-1 opacity-75">Weather Suitability</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};