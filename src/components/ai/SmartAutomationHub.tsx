import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Zap, 
  Shield, 
  RefreshCw, 
  Bell, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import logger from "@/utils/logger";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'rebooking' | 'upgrade' | 'notification' | 'pricing' | 'support';
  isActive: boolean;
  conditions: Array<{
    parameter: string;
    operator: string;
    value: any;
  }>;
  actions: Array<{
    type: string;
    parameters: any;
  }>;
  executionCount: number;
  successRate: number;
  lastExecuted?: string;
  aiConfidence: number;
}

interface AutomationEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  details: string;
  impact: {
    savedTime: number; // minutes
    savedMoney?: number;
    userSatisfaction?: number;
  };
}

interface SmartAutomationHubProps {
  userId?: string;
  className?: string;
}

export const SmartAutomationHub: React.FC<SmartAutomationHubProps> = ({
  userId,
  className = ""
}) => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [recentEvents, setRecentEvents] = useState<AutomationEvent[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(98.5);
  const { user } = useAuth();

  useEffect(() => {
    initializeAutomationHub();
    const interval = setInterval(checkForAutomationTriggers, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);

  const initializeAutomationHub = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAutomationRules(),
        loadRecentEvents(),
        checkSystemHealth()
      ]);
    } catch (error) {
      logger.error('Failed to initialize automation hub:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAutomationRules = async () => {
    const rules: AutomationRule[] = [
      {
        id: 'auto-reboot-1',
        name: 'Smart Flight Rebooking',
        description: 'Automatically rebooks flights when cancellations occur',
        type: 'rebooking',
        isActive: true,
        conditions: [
          { parameter: 'flight_status', operator: 'equals', value: 'cancelled' },
          { parameter: 'rebooking_window', operator: 'within', value: '24_hours' }
        ],
        actions: [
          { type: 'find_alternative_flights', parameters: { max_price_increase: 20 } },
          { type: 'send_notification', parameters: { urgency: 'high' } }
        ],
        executionCount: 23,
        successRate: 89.5,
        lastExecuted: '2024-01-15T10:30:00Z',
        aiConfidence: 94
      },
      {
        id: 'auto-upgrade-1',
        name: 'Smart Room Upgrades',
        description: 'Offers automatic upgrades based on availability and user profile',
        type: 'upgrade',
        isActive: true,
        conditions: [
          { parameter: 'room_availability', operator: 'greater_than', value: 80 },
          { parameter: 'user_loyalty_tier', operator: 'min', value: 'silver' }
        ],
        actions: [
          { type: 'offer_upgrade', parameters: { max_additional_cost: 50 } },
          { type: 'update_booking', parameters: { auto_accept: false } }
        ],
        executionCount: 156,
        successRate: 76.3,
        lastExecuted: '2024-01-15T14:22:00Z',
        aiConfidence: 87
      },
      {
        id: 'auto-notify-1',
        name: 'Intelligent Price Alerts',
        description: 'Sends notifications when prices drop for saved items',
        type: 'notification',
        isActive: true,
        conditions: [
          { parameter: 'price_drop_percent', operator: 'greater_than', value: 15 },
          { parameter: 'user_interest_score', operator: 'greater_than', value: 70 }
        ],
        actions: [
          { type: 'send_push_notification', parameters: { template: 'price_drop' } },
          { type: 'create_limited_offer', parameters: { expires_in: '24_hours' } }
        ],
        executionCount: 89,
        successRate: 92.1,
        lastExecuted: '2024-01-15T09:15:00Z',
        aiConfidence: 91
      },
      {
        id: 'auto-support-1',
        name: 'Proactive Customer Support',
        description: 'Detects potential issues and initiates support conversations',
        type: 'support',
        isActive: true,
        conditions: [
          { parameter: 'booking_complexity_score', operator: 'greater_than', value: 85 },
          { parameter: 'user_confusion_signals', operator: 'detected', value: true }
        ],
        actions: [
          { type: 'start_chat_session', parameters: { priority: 'high' } },
          { type: 'prepare_context', parameters: { include_booking_history: true } }
        ],
        executionCount: 34,
        successRate: 85.3,
        lastExecuted: '2024-01-15T13:45:00Z',
        aiConfidence: 82
      },
      {
        id: 'auto-pricing-1',
        name: 'Dynamic Pricing Optimization',
        description: 'Adjusts pricing based on demand patterns and user behavior',
        type: 'pricing',
        isActive: false, // Disabled for demo
        conditions: [
          { parameter: 'demand_score', operator: 'greater_than', value: 75 },
          { parameter: 'competitor_pricing', operator: 'analysis_complete', value: true }
        ],
        actions: [
          { type: 'adjust_pricing', parameters: { max_increase: 10, max_decrease: 25 } },
          { type: 'update_availability', parameters: { recalculate: true } }
        ],
        executionCount: 0,
        successRate: 0,
        aiConfidence: 88
      }
    ];
    
    setAutomationRules(rules);
  };

  const loadRecentEvents = async () => {
    const events: AutomationEvent[] = [
      {
        id: 'event-1',
        ruleId: 'auto-reboot-1',
        ruleName: 'Smart Flight Rebooking',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'success',
        details: 'Successfully rebooked cancelled QF127 to alternative QF129',
        impact: {
          savedTime: 45,
          savedMoney: 89,
          userSatisfaction: 95
        }
      },
      {
        id: 'event-2',
        ruleId: 'auto-upgrade-1',
        ruleName: 'Smart Room Upgrades',
        timestamp: '2024-01-15T14:22:00Z',
        status: 'success',
        details: 'Offered complimentary suite upgrade for Gold member',
        impact: {
          savedTime: 5,
          userSatisfaction: 92
        }
      },
      {
        id: 'event-3',
        ruleId: 'auto-notify-1',
        ruleName: 'Intelligent Price Alerts',
        timestamp: '2024-01-15T09:15:00Z',
        status: 'success',
        details: 'Price drop alert sent: Tokyo flight 18% off',
        impact: {
          savedTime: 2,
          savedMoney: 234
        }
      },
      {
        id: 'event-4',
        ruleId: 'auto-support-1',
        ruleName: 'Proactive Customer Support',
        timestamp: '2024-01-15T13:45:00Z',
        status: 'pending',
        details: 'Initiated support chat for complex multi-city booking',
        impact: {
          savedTime: 15
        }
      }
    ];
    
    setRecentEvents(events);
  };

  const checkSystemHealth = async () => {
    // Simulate system health check
    const health = 98.5 + (Math.random() * 3 - 1.5); // ±1.5% variation
    setSystemHealth(Number(health.toFixed(1)));
  };

  const checkForAutomationTriggers = async () => {
    if (!isEnabled) return;
    
    try {
      // Simulate checking for automation triggers
      logger.info('Checking for automation triggers...');
      
      // In production, this would evaluate all active rules against current data
      automationRules
        .filter(rule => rule.isActive)
        .forEach(rule => {
          // Simulate random trigger (5% chance per check)
          if (Math.random() < 0.05) {
            executeAutomationRule(rule);
          }
        });
        
    } catch (error) {
      logger.error('Error checking automation triggers:', error);
    }
  };

  const executeAutomationRule = async (rule: AutomationRule) => {
    try {
      logger.info(`Executing automation rule: ${rule.name}`);
      
      // Simulate rule execution
      const success = Math.random() > 0.1; // 90% success rate
      
      const newEvent: AutomationEvent = {
        id: `event-${Date.now()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        timestamp: new Date().toISOString(),
        status: success ? 'success' : 'failed',
        details: success ? 
          `Automation executed successfully` : 
          `Automation failed due to external constraints`,
        impact: {
          savedTime: Math.floor(Math.random() * 30) + 5,
          savedMoney: rule.type === 'rebooking' ? Math.floor(Math.random() * 200) + 50 : undefined,
          userSatisfaction: success ? Math.floor(Math.random() * 20) + 80 : undefined
        }
      };
      
      setRecentEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Keep last 10 events
      
      // Update rule execution count
      setAutomationRules(prev =>
        prev.map(r =>
          r.id === rule.id
            ? {
                ...r,
                executionCount: r.executionCount + 1,
                lastExecuted: new Date().toISOString(),
                successRate: success ? 
                  ((r.successRate * r.executionCount + 100) / (r.executionCount + 1)) :
                  ((r.successRate * r.executionCount) / (r.executionCount + 1))
              }
            : r
        )
      );
      
    } catch (error) {
      logger.error(`Failed to execute automation rule ${rule.name}:`, error);
    }
  };

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'rebooking': return 'bg-blue-100 text-blue-800';
      case 'upgrade': return 'bg-purple-100 text-purple-800';
      case 'notification': return 'bg-green-100 text-green-800';
      case 'pricing': return 'bg-orange-100 text-orange-800';
      case 'support': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Initializing automation systems...</span>
          </div>
          <Progress value={70} className="w-full mt-4" />
        </CardContent>
      </Card>
    );
  };

  const totalSavedTime = recentEvents.reduce((sum, event) => sum + event.impact.savedTime, 0);
  const totalSavedMoney = recentEvents.reduce((sum, event) => sum + (event.impact.savedMoney || 0), 0);
  const activeRules = automationRules.filter(rule => rule.isActive).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Status */}
      <Card className="bg-gradient-to-r from-travel-forest/5 to-travel-ocean/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-travel-forest" />
              Smart Automation Hub
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800">
                <Zap className="h-3 w-3 mr-1" />
                {systemHealth}% Health
              </Badge>
              <Switch 
                checked={isEnabled} 
                onCheckedChange={setIsEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-travel-forest">{activeRules}</div>
              <div className="text-sm text-muted-foreground">Active Rules</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-travel-ocean">{totalSavedTime}m</div>
              <div className="text-sm text-muted-foreground">Time Saved Today</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-travel-gold">${totalSavedMoney}</div>
              <div className="text-sm text-muted-foreground">Money Saved Today</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-travel-coral">{recentEvents.length}</div>
              <div className="text-sm text-muted-foreground">Events Today</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-travel-gold" />
            Automation Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {automationRules.map((rule) => (
            <div key={rule.id} className="p-4 border rounded-lg hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <Badge className={getRuleTypeColor(rule.type)}>
                      {rule.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rule.aiConfidence}% AI Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Executions:</span>
                      <span className="ml-2 font-medium">{rule.executionCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="ml-2 font-medium">{rule.successRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Run:</span>
                      <span className="ml-2 font-medium">
                        {rule.lastExecuted ? 
                          new Date(rule.lastExecuted).toLocaleDateString() : 
                          'Never'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={rule.isActive} 
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-travel-coral" />
            Recent Automation Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className={`p-2 rounded-full bg-white ${getStatusColor(event.status)}`}>
                  {getStatusIcon(event.status)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{event.ruleName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.details}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.impact.savedTime}m saved
                    </span>
                    {event.impact.savedMoney && (
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        ${event.impact.savedMoney} saved
                      </span>
                    )}
                    {event.impact.userSatisfaction && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Sparkles className="h-3 w-3" />
                        {event.impact.userSatisfaction}% satisfaction
                      </span>
                    )}
                  </div>
                </div>
                
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {systemHealth < 95 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System health is at {systemHealth}%. Some automation rules may experience delays.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};