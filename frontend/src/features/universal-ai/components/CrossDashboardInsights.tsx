import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  MessageCircle,
  Zap,
  Target,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrossDashboardInsightsProps {
  dashboardType: 'admin' | 'partner' | 'user';
  className?: string;
}

export const CrossDashboardInsights: React.FC<CrossDashboardInsightsProps> = ({
  dashboardType,
  className
}) => {
  // Mock data - would be replaced with real analytics
  const getInsightsData = () => {
    switch (dashboardType) {
      case 'admin':
        return {
          metrics: [
            { label: 'System Health', value: 98, trend: 'up', icon: Activity },
            { label: 'AI Response Time', value: 1.2, unit: 's', trend: 'down', icon: Clock },
            { label: 'Task Success Rate', value: 94, trend: 'up', icon: Target },
            { label: 'Active Users', value: 1247, trend: 'up', icon: Users }
          ],
          insights: [
            'Voice interactions increased 34% this week',
            'Dialogflow routing improved efficiency by 12%',
            '3 new conversation patterns detected'
          ]
        };
      
      case 'partner':
        return {
          metrics: [
            { label: 'Booking Conversion', value: 12.4, unit: '%', trend: 'up', icon: TrendingUp },
            { label: 'AI Assist Revenue', value: 24580, unit: '$', trend: 'up', icon: Target },
            { label: 'Customer Satisfaction', value: 4.7, unit: '/5', trend: 'up', icon: Users },
            { label: 'Response Quality', value: 89, unit: '%', trend: 'stable', icon: MessageCircle }
          ],
          insights: [
            'AI-assisted bookings have 23% higher value',
            'Voice booking completion up 45%',
            'Customer queries resolved 67% faster'
          ]
        };
      
      case 'user':
      default:
        return {
          metrics: [
            { label: 'Trip Planning', value: 87, trend: 'up', icon: Target },
            { label: 'Saved Searches', value: 12, trend: 'up', icon: Activity },
            { label: 'Voice Commands', value: 34, trend: 'up', icon: MessageCircle },
            { label: 'Time Saved', value: 2.4, unit: 'hrs', trend: 'up', icon: Clock }
          ],
          insights: [
            'AI found you 3 better deals this month',
            'Voice planning saves 40% time',
            'Smart suggestions matched your preferences'
          ]
        };
    }
  };

  const data = getInsightsData();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Activity className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2">
        {data.metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <IconComponent className="h-3 w-3 text-muted-foreground" />
                {getTrendIcon(metric.trend)}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {metric.value}{metric.unit || '%'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {metric.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Performance Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>AI Performance</span>
          <Badge variant="outline" className="text-xs h-5">
            {data.metrics[0]?.value || 95}%
          </Badge>
        </div>
        <Progress value={data.metrics[0]?.value || 95} className="h-2" />
      </div>

      {/* Key Insights */}
      <div className="space-y-2">
        <div className="text-xs font-medium flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Key Insights
        </div>
        <div className="space-y-1">
          {data.insights.slice(0, 2).map((insight, index) => (
            <div key={index} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              • {insight}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-1 border-t">
        <div className="flex justify-between text-xs">
          <button 
            className="text-primary hover:underline"
            onClick={() => console.log('View detailed analytics')}
          >
            View Details
          </button>
          <button 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => console.log('Export insights')}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossDashboardInsights;