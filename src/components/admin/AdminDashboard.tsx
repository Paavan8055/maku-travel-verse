
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Activity, 
  Shield, 
  Users, 
  Database,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Feature Flags',
      description: 'Manage feature rollouts and experiments',
      icon: Settings,
      path: '/admin/settings/features',
      status: 'active'
    },
    {
      title: 'Environment Config',
      description: 'Switch between test and production',
      icon: Database,
      path: '/admin/settings/environment',
      status: 'active'
    },
    {
      title: 'Performance Monitor',
      description: 'View system performance metrics',
      icon: Activity,
      path: '/admin/monitoring/performance',
      status: 'active'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and roles',
      icon: Users,
      path: '/admin/operations/users',
      status: 'pending'
    },
    {
      title: 'Security & Access',
      description: 'Audit logs and access control',
      icon: Shield,
      path: '/admin/security/access',
      status: 'pending'
    },
    {
      title: 'System Analytics',
      description: 'View detailed system analytics',
      icon: BarChart3,
      path: '/admin/analytics',
      status: 'pending'
    }
  ];

  const systemStatus = {
    overall: 'healthy',
    services: [
      { name: 'Database', status: 'healthy', uptime: '99.9%' },
      { name: 'Authentication', status: 'healthy', uptime: '99.8%' },
      { name: 'API Gateway', status: 'healthy', uptime: '99.9%' },
      { name: 'File Storage', status: 'warning', uptime: '98.5%' },
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default' as const,
      pending: 'secondary' as const,
      error: 'destructive' as const
    };
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage system configuration and monitor performance
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {systemStatus.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium text-sm">{service.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Uptime: {service.uptime}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.title} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(action.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  {getStatusBadge(action.status)}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">{action.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-muted-foreground">2 minutes ago</span>
              <span>Feature flag "performance_monitoring" enabled</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-muted-foreground">5 minutes ago</span>
              <span>Environment switched to test mode</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-muted-foreground">12 minutes ago</span>
              <span>Performance metrics updated</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
