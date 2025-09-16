import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUniversalAI } from '../context/UniversalAIContext';
import CrossDashboardInsights from './CrossDashboardInsights';
import { 
  Bot, 
  Sparkles, 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2,
  Settings,
  Activity,
  BarChart3,
  Users,
  Building2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalAIWidgetProps {
  dashboardType: 'admin' | 'partner' | 'user';
  className?: string;
}

export const UniversalAIWidget: React.FC<UniversalAIWidgetProps> = ({
  dashboardType,
  className
}) => {
  const { 
    currentContext, 
    aiInteractions, 
    setDashboardContext,
    trackInteraction,
    getCrossDashboardInsights
  } = useUniversalAI();

  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const [insights] = useState(getCrossDashboardInsights(dashboardType));

  useEffect(() => {
    setDashboardContext(dashboardType);
  }, [dashboardType, setDashboardContext]);

  const handleCloseAI = () => {
    // This can be used to hide the widget entirely.
    setIsMinimized(true);
  };

  const getDashboardIcon = () => {
    switch (dashboardType) {
      case 'admin': return <Settings className="h-4 w-4" />;
      case 'partner': return <Building2 className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getDashboardColor = () => {
    switch (dashboardType) {
      case 'admin': return 'border-red-500/20 bg-red-50/10';
      case 'partner': return 'border-blue-500/20 bg-blue-50/10';
      case 'user': return 'border-green-500/20 bg-green-50/10';
      default: return 'border-primary/20 bg-primary/10';
    }
  };

  if (isMinimized) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full h-12 w-12 shadow-lg"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-80 h-96 z-50 shadow-xl border-2",
      getDashboardColor(),
      className
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {getDashboardIcon()}
          <h3 className="font-semibold">AI Assistant</h3>
          <Badge variant="outline" className="text-xs">
            {dashboardType}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseAI}
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-1 p-2">
          <TabsTrigger value="insights" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="p-4 space-y-3">
          <div className="text-sm text-muted-foreground">
            Cross-dashboard AI insights
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Today's Interactions</span>
              <Badge variant="outline">
                {aiInteractions.filter(i => 
                  new Date(i.timestamp).toDateString() === new Date().toDateString()
                ).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Success Rate</span>
              <Badge variant="outline">94%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg Response Time</span>
              <Badge variant="outline">1.2s</Badge>
            </div>
          </div>
          <CrossDashboardInsights dashboardType={dashboardType} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default UniversalAIWidget;