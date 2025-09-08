import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Lock, 
  Clock,
  TrendingUp,
  Eye,
  Ban
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'mfa_verification' | 'permission_escalation' | 'data_access' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  user_email?: string;
  ip_address: string;
  user_agent: string;
  event_data: Record<string, any>;
  timestamp: string;
  status: 'success' | 'failure' | 'blocked';
}

interface SecurityMetrics {
  total_events: number;
  failed_logins: number;
  successful_logins: number;
  blocked_attempts: number;
  unique_ips: number;
  mfa_success_rate: number;
}

export function SecurityEventMonitoring() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    total_events: 0,
    failed_logins: 0,
    successful_logins: 0,
    blocked_attempts: 0,
    unique_ips: 0,
    mfa_success_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time security event data
  useEffect(() => {
    const fetchEvents = () => {
      // Mock security events data
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'login_attempt',
          severity: 'medium',
          user_email: 'admin@maku.travel',
          ip_address: '203.123.45.67',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          event_data: { method: 'password', country: 'Australia' },
          timestamp: new Date(Date.now() - 300000).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'mfa_verification',
          severity: 'low',
          user_email: 'admin@maku.travel',
          ip_address: '203.123.45.67',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          event_data: { method: 'totp', attempts: 1 },
          timestamp: new Date(Date.now() - 290000).toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'login_attempt',
          severity: 'high',
          ip_address: '45.123.89.12',
          user_agent: 'curl/7.68.0',
          event_data: { method: 'password', country: 'Unknown', suspicious: true },
          timestamp: new Date(Date.now() - 180000).toISOString(),
          status: 'blocked'
        },
        {
          id: '4',
          type: 'admin_action',
          severity: 'medium',
          user_email: 'admin@maku.travel',
          ip_address: '203.123.45.67',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          event_data: { action: 'user_role_modification', target_user: 'user@example.com' },
          timestamp: new Date(Date.now() - 120000).toISOString(),
          status: 'success'
        },
        {
          id: '5',
          type: 'data_access',
          severity: 'low',
          user_email: 'admin@maku.travel',
          ip_address: '203.123.45.67',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          event_data: { resource: 'booking_data', query_type: 'audit_logs' },
          timestamp: new Date(Date.now() - 60000).toISOString(),
          status: 'success'
        }
      ];

      setEvents(mockEvents);
      setMetrics({
        total_events: 147,
        failed_logins: 8,
        successful_logins: 23,
        blocked_attempts: 5,
        unique_ips: 12,
        mfa_success_rate: 96.5
      });
      setLoading(false);
    };

    fetchEvents();

    if (autoRefresh) {
      const interval = setInterval(fetchEvents, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'failure': return 'destructive';
      case 'blocked': return 'secondary';
      default: return 'outline';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return <Users className="h-4 w-4" />;
      case 'mfa_verification': return <Shield className="h-4 w-4" />;
      case 'permission_escalation': return <TrendingUp className="h-4 w-4" />;
      case 'data_access': return <Eye className="h-4 w-4" />;
      case 'admin_action': return <Lock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Event Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time security events and threat detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.total_events}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.successful_logins}</p>
                <p className="text-xs text-muted-foreground">Successful Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.failed_logins}</p>
                <p className="text-xs text-muted-foreground">Failed Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.blocked_attempts}</p>
                <p className="text-xs text-muted-foreground">Blocked Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.unique_ips}</p>
                <p className="text-xs text-muted-foreground">Unique IPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.mfa_success_rate}%</p>
                <p className="text-xs text-muted-foreground">MFA Success</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Detection Alerts */}
      {events.some(event => event.severity === 'critical' || event.severity === 'high') && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Alert:</strong> High-severity security events detected. 
            Immediate review recommended.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
          <TabsTrigger value="trends">Security Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events Log</CardTitle>
              <CardDescription>Real-time security events from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border bg-card">
                    <div className="mt-0.5">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(event.severity)} className="text-xs">
                          {event.severity.toUpperCase()}
                        </Badge>
                        <Badge variant={getStatusColor(event.status)} className="text-xs">
                          {event.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {event.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {event.user_email || 'Unknown User'} from {event.ip_address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify(event.event_data)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats">
          <Card>
            <CardHeader>
              <CardTitle>Threat Analysis</CardTitle>
              <CardDescription>Automated threat detection and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Suspicious login pattern detected from IP 45.123.89.12 - Automated blocking activated
                  </AlertDescription>
                </Alert>
                <div className="text-sm text-muted-foreground">
                  <p>• 3 failed login attempts in the last hour</p>
                  <p>• Non-standard user agent detected</p>
                  <p>• IP geolocation: Unknown/VPN suspected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Security Trends</CardTitle>
              <CardDescription>Security metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Login Success Rate</p>
                  <div className="text-2xl font-bold text-green-600">94.2%</div>
                  <p className="text-xs text-muted-foreground">↑ 2.1% from last week</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Blocked Threats</p>
                  <div className="text-2xl font-bold text-red-600">12</div>
                  <p className="text-xs text-muted-foreground">↓ 8 from last week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}