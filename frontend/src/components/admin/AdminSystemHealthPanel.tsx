import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Shield, 
  AlertTriangle,
  Activity,
  Database,
  Network,
  Cpu,
  RefreshCw,
  Settings,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';

interface SystemHealthPanelProps {
  adminMode?: boolean;
  showDetailedMetrics?: boolean;
  enableEmergencyControls?: boolean;
}

const AdminSystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  adminMode = true,
  showDetailedMetrics = true,
  enableEmergencyControls = true
}) => {
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { 
    health, 
    loading, 
    lastChecked, 
    error,
    checkHealth,
    isCircuitBreakerOpen,
    circuitBreakerState 
  } = useHealthMonitor({
    checkInterval: refreshInterval * 1000,
    enableAutoCheck: autoRefresh
  });

  const [emergencyActions] = useState([
    {
      id: 'restart_services',
      label: 'Restart All Services',
      description: 'Restart all backend services to resolve connectivity issues',
      severity: 'high',
      icon: <RefreshCw className="w-4 h-4" />
    },
    {
      id: 'clear_cache',
      label: 'Clear System Cache',
      description: 'Clear all caches to resolve data consistency issues',
      severity: 'medium',
      icon: <Database className="w-4 h-4" />
    },
    {
      id: 'reset_connections',
      label: 'Reset Provider Connections',
      description: 'Reset connections to all travel providers',
      severity: 'medium',
      icon: <Network className="w-4 h-4" />
    }
  ]);

  const getOverallSystemStatus = () => {
    if (!health) return { status: 'unknown', color: 'gray' };
    
    const serviceStatuses = Object.values(health.services);
    const downServices = serviceStatuses.filter(s => s.status === 'down').length;
    const slowServices = serviceStatuses.filter(s => s.status === 'slow').length;
    
    if (downServices > 0) return { status: 'critical', color: 'red' };
    if (slowServices > 1) return { status: 'degraded', color: 'yellow' };
    return { status: 'healthy', color: 'green' };
  };

  const systemStatus = getOverallSystemStatus();

  const executeEmergencyAction = async (actionId: string) => {
    try {
      console.log(`Executing emergency action: ${actionId}`);
      // In production, this would call actual emergency procedures
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate action
      await checkHealth(); // Refresh health after action
    } catch (error) {
      console.error('Emergency action failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card className={`border-2 ${
        systemStatus.color === 'green' ? 'border-green-200 bg-green-50' :
        systemStatus.color === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
        systemStatus.color === 'red' ? 'border-red-200 bg-red-50' :
        'border-gray-200'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                systemStatus.color === 'green' ? 'bg-green-500' :
                systemStatus.color === 'yellow' ? 'bg-yellow-500' :
                systemStatus.color === 'red' ? 'bg-red-500' :
                'bg-gray-500'
              }`}>
                {systemStatus.color === 'green' ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : systemStatus.color === 'yellow' ? (
                  <AlertTriangle className="w-6 h-6 text-white" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">System Status: {systemStatus.status.toUpperCase()}</CardTitle>
                <CardDescription>
                  {systemStatus.color === 'green' && "All systems operating normally"}
                  {systemStatus.color === 'yellow' && "Some services experiencing delays"}
                  {systemStatus.color === 'red' && "Critical issues require immediate attention"}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={checkHealth}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Check Now
              </Button>
              
              {enableEmergencyControls && systemStatus.color === 'red' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => executeEmergencyAction('restart_services')}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Emergency Fix
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {health && (
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(health.services).map(([service, status]) => (
                <div key={service} className="text-center p-3 border rounded-lg">
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    status.status === 'up' ? 'bg-green-500' :
                    status.status === 'slow' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {status.status === 'up' ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : status.status === 'slow' ? (
                      <Clock className="w-4 h-4 text-white" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm capitalize">{service}</h4>
                  <p className="text-xs text-gray-600">
                    {status.responseTime ? `${Math.round(status.responseTime)}ms` : 'N/A'}
                  </p>
                  {status.error && (
                    <p className="text-xs text-red-600 mt-1 truncate">
                      {status.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Detailed Metrics for Admins */}
      {showDetailedMetrics && health && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Response Time</span>
                    <span className="font-medium">{Math.round(health.performance.responseTime)}ms</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (health.performance.responseTime / 10))} 
                    className="h-2"
                  />
                </div>
                
                {health.performance.memoryUsage && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Memory Usage</span>
                      <span className="font-medium">{health.performance.memoryUsage}MB</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (health.performance.memoryUsage / 1024) * 100)} 
                      className="h-2"
                    />
                  </div>
                )}
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Last checked</span>
                  <span>{lastChecked?.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Controls */}
          {enableEmergencyControls && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Emergency Controls</span>
                </CardTitle>
                <CardDescription>
                  Use these controls only when systems are experiencing issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emergencyActions.map(action => (
                    <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          action.severity === 'high' ? 'bg-red-100 text-red-600' :
                          action.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {action.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{action.label}</h4>
                          <p className="text-xs text-gray-600">{action.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={action.severity === 'high' ? 'destructive' : 'outline'}
                        onClick={() => executeEmergencyAction(action.id)}
                      >
                        Execute
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Circuit Breaker Status */}
      {isCircuitBreakerOpen && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Circuit Breaker Active:</strong> Health monitoring is temporarily paused due to repeated failures. 
            The system will automatically retry in a few minutes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AdminSystemHealthPanel;