import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Webhook,
  Trash2,
  Archive,
  Volume2,
  VolumeX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  escalated: boolean;
  metadata?: Record<string, any>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
  escalationTime: number; // minutes
  recipients: string[];
}

interface EscalationRule {
  id: string;
  triggerAfter: number; // minutes
  escalateTo: string[];
  channels: string[];
  enabled: boolean;
}

export const NotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Provider API Degraded',
        message: 'Amadeus API response time increased to 5.2s (threshold: 3s)',
        type: 'warning',
        priority: 'high',
        source: 'Health Monitor',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        acknowledged: false,
        resolved: false,
        escalated: false,
        metadata: { provider: 'amadeus', responseTime: 5200 }
      },
      {
        id: '2',
        title: 'Booking Payment Failed',
        message: 'Payment for booking MAKU001 failed after 3 retry attempts',
        type: 'error',
        priority: 'critical',
        source: 'Payment Gateway',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        acknowledged: true,
        resolved: false,
        escalated: true,
        metadata: { bookingRef: 'MAKU001', errorCode: 'CARD_DECLINED' }
      },
      {
        id: '3',
        title: 'System Health Check Passed',
        message: 'All systems operational - 99.9% uptime maintained',
        type: 'success',
        priority: 'low',
        source: 'Health Monitor',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        acknowledged: true,
        resolved: true,
        escalated: false
      }
    ];

    const mockAlertRules: AlertRule[] = [
      {
        id: 'rule-1',
        name: 'Provider Response Time Alert',
        condition: 'response_time > 3000ms',
        priority: 'high',
        enabled: true,
        channels: ['email', 'slack'],
        escalationTime: 15,
        recipients: ['admin@maku.travel', 'ops@maku.travel']
      },
      {
        id: 'rule-2',
        name: 'Payment Failure Alert',
        condition: 'payment_failure_rate > 5%',
        priority: 'critical',
        enabled: true,
        channels: ['email', 'slack', 'webhook'],
        escalationTime: 5,
        recipients: ['finance@maku.travel', 'admin@maku.travel']
      }
    ];

    setNotifications(mockNotifications);
    setAlertRules(mockAlertRules);
  }, []);

  const acknowledgeNotification = async (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, acknowledged: true } : notif
    ));
    toast.success('Notification acknowledged');
  };

  const resolveNotification = async (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, resolved: true } : notif
    ));
    toast.success('Notification resolved');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesPriority = filterPriority === 'all' || notif.priority === filterPriority;
    const matchesType = filterType === 'all' || notif.type === filterType;
    return matchesPriority && matchesType;
  });

  const unacknowledgedCount = notifications.filter(n => !n.acknowledged).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.resolved).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification & Alert Center
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive">{unacknowledgedCount} unread</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setSoundEnabled(!soundEnabled)}>
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notifications">
                Notifications
                {unacknowledgedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{unacknowledgedCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rules">Alert Rules</TabsTrigger>
              <TabsTrigger value="escalation">Escalation</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-4">
              <div className="flex gap-4">
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1" />

                <Button size="sm" variant="outline">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive All
                </Button>
              </div>

              <div className="space-y-3">
                {filteredNotifications.map(notification => (
                  <Card key={notification.id} className={`border ${notification.acknowledged ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getTypeIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{notification.title}</h4>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              {notification.escalated && (
                                <Badge variant="destructive">Escalated</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Source: {notification.source}</span>
                              <span>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {notification.timestamp.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {!notification.acknowledged && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => acknowledgeNotification(notification.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {!notification.resolved && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => resolveNotification(notification.id)}
                            >
                              Resolve
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredNotifications.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No notifications match your filters</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    Alert Rules Configuration
                    <Button size="sm">Add New Rule</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alertRules.map(rule => (
                    <Card key={rule.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{rule.name}</h4>
                            <p className="text-sm text-muted-foreground">{rule.condition}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(rule.priority)}>
                              {rule.priority}
                            </Badge>
                            <Switch checked={rule.enabled} />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Channels: </span>
                            <span>{rule.channels.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Escalation: </span>
                            <span>{rule.escalationTime}min</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Recipients: </span>
                            <span>{rule.recipients.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="escalation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Escalation Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Escalation Time (minutes)</label>
                      <Input type="number" defaultValue="15" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Escalate To</label>
                      <Textarea placeholder="manager@maku.travel, cto@maku.travel" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">On-Call Schedule</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select on-call rotation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary Team</SelectItem>
                          <SelectItem value="secondary">Secondary Team</SelectItem>
                          <SelectItem value="executive">Executive Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button>Save Escalation Rules</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mail className="h-5 w-5" />
                      Email Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">SMTP Server</label>
                      <Input defaultValue="smtp.maku.travel" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">From Address</label>
                      <Input defaultValue="alerts@maku.travel" />
                    </div>
                    <Button>Test Connection</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="h-5 w-5" />
                      Slack Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Webhook URL</label>
                      <Input placeholder="https://hooks.slack.com/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Channel</label>
                      <Input defaultValue="#alerts" />
                    </div>
                    <Button>Test Connection</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Webhook className="h-5 w-5" />
                      Webhook Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Webhook URL</label>
                      <Input placeholder="https://api.example.com/webhooks/alerts" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Secret Key</label>
                      <Input type="password" placeholder="Enter webhook secret" />
                    </div>
                    <Button>Test Connection</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};