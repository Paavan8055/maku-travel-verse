import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building, 
  CreditCard, 
  Shield, 
  Activity,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useAdminIntegration } from '../context/AdminIntegrationContext';

interface HealthIndicator {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  description: string;
  icon: React.ReactNode;
}

const SimplifiedAdminInterface: React.FC = () => {
  const { state, setNonTechnicalMode, setGuidedMode, getContextualHelp, getQuickActions } = useAdminIntegration();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const healthIndicators: HealthIndicator[] = [
    {
      name: 'User Accounts',
      status: 'healthy',
      description: 'All user accounts are working normally',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Booking System',
      status: 'healthy',
      description: 'Bookings are processing successfully',
      icon: <Building className="h-5 w-5" />
    },
    {
      name: 'Payment Processing',
      status: state.systemHealth === 'critical' ? 'critical' : 'healthy',
      description: state.systemHealth === 'critical' ? 'Payment issues detected' : 'Payments processing normally',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      name: 'Security',
      status: 'healthy',
      description: 'No security issues detected',
      icon: <Shield className="h-5 w-5" />
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-white text-gray-800 border-gray-200';
    }
  };

  const contextualHelp = getContextualHelp();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Interface Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Simplified Mode</label>
              <p className="text-sm text-muted-foreground">Use plain language and hide technical details</p>
            </div>
            <Switch
              checked={state.nonTechnicalMode}
              onCheckedChange={setNonTechnicalMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Guided Workflows</label>
              <p className="text-sm text-muted-foreground">Show step-by-step instructions for tasks</p>
            </div>
            <Switch
              checked={state.guidedMode}
              onCheckedChange={setGuidedMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Show Technical Details</label>
              <p className="text-sm text-muted-foreground">Display technical information and error codes</p>
            </div>
            <Switch
              checked={showTechnicalDetails}
              onCheckedChange={setShowTechnicalDetails}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="help">Contextual Help</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Health at a Glance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthIndicators.map((indicator) => (
                  <div
                    key={indicator.name}
                    className={`p-4 rounded-lg border ${getStatusColor(indicator.status)}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {indicator.icon}
                      <span className="font-medium">{indicator.name}</span>
                      {getStatusIcon(indicator.status)}
                    </div>
                    <p className="text-sm">{indicator.description}</p>
                    {indicator.status !== 'healthy' && (
                      <Button size="sm" variant="outline" className="mt-2">
                        View Details
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          {state.systemHealth === 'critical' && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Attention Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  There are critical issues that need your immediate attention. These may affect customer experience.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm">
                    Fix Issues Now
                  </Button>
                  <Button variant="outline" size="sm">
                    Get Help
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Simple Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>What's Happening Right Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span>Customer bookings</span>
                  <Badge variant="secondary">Working normally</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span>Payment processing</span>
                  <Badge variant={state.systemHealth === 'critical' ? 'destructive' : 'secondary'}>
                    {state.systemHealth === 'critical' ? 'Needs attention' : 'Working normally'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span>Customer support</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help for Current Page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contextualHelp.map((helpText, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm">{helpText}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{action.label}</h3>
                      <Button size="sm" onClick={action.action}>
                        Start
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimplifiedAdminInterface;